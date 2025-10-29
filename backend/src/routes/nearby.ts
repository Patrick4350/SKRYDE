import express from 'express';
import { PrismaClient } from '../generated/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { isValidCoordinate, findNearbyLocations, getBoundingBox } from '../utils/geo';

const router = express.Router();
const prisma = new PrismaClient();

// Update user location (heartbeat)
router.post('/heartbeat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate coordinates
    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const userId = req.user!.id;

    // Update user's current location
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date()
      }
    });

    // Store location ping for history
    await prisma.locationPing.create({
      data: {
        userId,
        latitude,
        longitude
      }
    });

    res.json({ 
      message: 'Location updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Location heartbeat error:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Get nearby drivers
router.get('/drivers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (!isValidCoordinate(Number(latitude), Number(longitude))) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const centerLat = Number(latitude);
    const centerLon = Number(longitude);
    const radiusKm = Number(radius);

    // Get bounding box for efficient querying
    const boundingBox = getBoundingBox(centerLat, centerLon, radiusKm);

    // Find drivers within bounding box
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        verified: true,
        currentLatitude: {
          gte: boundingBox.south,
          lte: boundingBox.north
        },
        currentLongitude: {
          gte: boundingBox.west,
          lte: boundingBox.east
        },
        lastLocationUpdate: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Within last 30 minutes
        }
      },
      select: {
        id: true,
        name: true,
        rating: true,
        vehicleInfo: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
        _count: {
          select: {
            ridesAsDriver: true
          }
        }
      }
    });

    // Calculate exact distances and filter by radius
    const nearbyDrivers = findNearbyLocations(
      centerLat,
      centerLon,
      drivers.map(driver => ({
        latitude: driver.currentLatitude!,
        longitude: driver.currentLongitude!
      })),
      radiusKm
    );

    // Combine distance data with driver info
    const driversWithDistance = nearbyDrivers.map((location, index) => {
      const driver = drivers[index];
      return {
        ...driver,
        distance: location.distance
      };
    });

    res.json({
      drivers: driversWithDistance,
      center: {
        latitude: centerLat,
        longitude: centerLon
      },
      radius: radiusKm,
      count: driversWithDistance.length
    });
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    res.status(500).json({ message: 'Failed to get nearby drivers' });
  }
});

// Get nearby rides
router.get('/rides', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 10,
      page = 1,
      limit = 20
    } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (!isValidCoordinate(Number(latitude), Number(longitude))) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const centerLat = Number(latitude);
    const centerLon = Number(longitude);
    const radiusKm = Number(radius);
    const skip = (Number(page) - 1) * Number(limit);

    // Get bounding box for efficient querying
    const boundingBox = getBoundingBox(centerLat, centerLon, radiusKm);

    // Find rides within bounding box
    const rides = await prisma.ride.findMany({
      where: {
        status: 'ACTIVE',
        departureTime: {
          gte: new Date() // Only future rides
        },
        OR: [
          // Rides with origin coordinates
          {
            originLatitude: {
              gte: boundingBox.south,
              lte: boundingBox.north
            },
            originLongitude: {
              gte: boundingBox.west,
              lte: boundingBox.east
            }
          },
          // Rides with destination coordinates
          {
            destLatitude: {
              gte: boundingBox.south,
              lte: boundingBox.north
            },
            destLongitude: {
              gte: boundingBox.west,
              lte: boundingBox.east
            }
          }
        ]
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            rating: true,
            verified: true,
            vehicleInfo: true,
            currentLatitude: true,
            currentLongitude: true
          }
        },
        _count: {
          select: {
            requests: true,
            offers: true
          }
        }
      },
      orderBy: { departureTime: 'asc' },
      skip,
      take: Number(limit)
    });

    // Calculate distances and filter by radius
    const ridesWithDistance = rides.map(ride => {
      let distance = 0;
      
      // Calculate distance to origin or destination
      if (ride.originLatitude && ride.originLongitude) {
        distance = findNearbyLocations(
          centerLat,
          centerLon,
          [{ latitude: ride.originLatitude, longitude: ride.originLongitude }],
          radiusKm
        )[0]?.distance || 0;
      } else if (ride.destLatitude && ride.destLongitude) {
        distance = findNearbyLocations(
          centerLat,
          centerLon,
          [{ latitude: ride.destLatitude, longitude: ride.destLongitude }],
          radiusKm
        )[0]?.distance || 0;
      }

      return {
        ...ride,
        distance
      };
    }).filter(ride => ride.distance <= radiusKm);

    res.json({
      rides: ridesWithDistance,
      center: {
        latitude: centerLat,
        longitude: centerLon
      },
      radius: radiusKm,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: ridesWithDistance.length,
        pages: Math.ceil(ridesWithDistance.length / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get nearby rides error:', error);
    res.status(500).json({ message: 'Failed to get nearby rides' });
  }
});

// Get location history for a user
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { hours = 24, limit = 100 } = req.query;
    const userId = req.user!.id;

    const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

    const locationHistory = await prisma.locationPing.findMany({
      where: {
        userId,
        timestamp: {
          gte: since
        }
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit)
    });

    res.json({
      history: locationHistory,
      hours: Number(hours),
      count: locationHistory.length
    });
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ message: 'Failed to get location history' });
  }
});

// Get real-time map data (drivers + rides)
router.get('/map-data', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 5,
      includeRides = true
    } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (!isValidCoordinate(Number(latitude), Number(longitude))) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const centerLat = Number(latitude);
    const centerLon = Number(longitude);
    const radiusKm = Number(radius);

    // Get bounding box
    const boundingBox = getBoundingBox(centerLat, centerLon, radiusKm);

    // Get nearby drivers
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        verified: true,
        currentLatitude: {
          gte: boundingBox.south,
          lte: boundingBox.north
        },
        currentLongitude: {
          gte: boundingBox.west,
          lte: boundingBox.east
        },
        lastLocationUpdate: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Within last 30 minutes
        }
      },
      select: {
        id: true,
        name: true,
        rating: true,
        vehicleInfo: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true
      }
    });

    let rides: any[] = [];

    // Get nearby rides if requested
    if (includeRides === 'true') {
      rides = await prisma.ride.findMany({
        where: {
          status: 'ACTIVE',
          departureTime: {
            gte: new Date()
          },
          OR: [
            {
              originLatitude: {
                gte: boundingBox.south,
                lte: boundingBox.north
              },
              originLongitude: {
                gte: boundingBox.west,
                lte: boundingBox.east
              }
            },
            {
              destLatitude: {
                gte: boundingBox.south,
                lte: boundingBox.north
              },
              destLongitude: {
                gte: boundingBox.west,
                lte: boundingBox.east
              }
            }
          ]
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              rating: true,
              vehicleInfo: true
            }
          }
        },
        take: 50 // Limit for performance
      });
    }

    // Calculate distances
    const driversWithDistance = findNearbyLocations(
      centerLat,
      centerLon,
      drivers.map(driver => ({
        latitude: driver.currentLatitude!,
        longitude: driver.currentLongitude!
      })),
      radiusKm
    ).map((location, index) => ({
      ...drivers[index],
      distance: location.distance
    }));

    const ridesWithDistance = rides.map(ride => {
      let distance = 0;
      
      if (ride.originLatitude && ride.originLongitude) {
        distance = findNearbyLocations(
          centerLat,
          centerLon,
          [{ latitude: ride.originLatitude, longitude: ride.originLongitude }],
          radiusKm
        )[0]?.distance || 0;
      }

      return {
        ...ride,
        distance
      };
    }).filter(ride => ride.distance <= radiusKm);

    res.json({
      drivers: driversWithDistance,
      rides: ridesWithDistance,
      center: {
        latitude: centerLat,
        longitude: centerLon
      },
      radius: radiusKm,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get map data error:', error);
    res.status(500).json({ message: 'Failed to get map data' });
  }
});

export default router;
