import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerified, AuthRequest } from '../middleware/auth';
import { isValidCoordinate, calculateDistance } from '../utils/geo';

const router = express.Router();
const prisma = new PrismaClient();

// Get all rides with filters
router.get('/', async (req, res) => {
  try {
    const {
      origin,
      destination,
      minFare,
      maxFare,
      seats,
      departureDate,
      latitude,
      longitude,
      radius = 10, // km
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = {
      status: 'ACTIVE'
    };

    // Text-based filters
    if (origin) {
      whereClause.origin = {
        contains: origin as string,
        mode: 'insensitive'
      };
    }

    if (destination) {
      whereClause.destination = {
        contains: destination as string,
        mode: 'insensitive'
      };
    }

    // Fare filters
    if (minFare || maxFare) {
      whereClause.fare = {};
      if (minFare) whereClause.fare.gte = Number(minFare);
      if (maxFare) whereClause.fare.lte = Number(maxFare);
    }

    // Seats filter
    if (seats) {
      whereClause.seats = {
        gte: Number(seats)
      };
    }

    // Date filter
    if (departureDate) {
      const date = new Date(departureDate as string);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      whereClause.departureTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: whereClause,
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
      }),
      prisma.ride.count({ where: whereClause })
    ]);

    // Filter by location if coordinates provided
    let filteredRides = rides;
    if (latitude && longitude && rides.length > 0) {
      filteredRides = rides.filter(ride => {
        if (!ride.driver.currentLatitude || !ride.driver.currentLongitude) {
          return false; // Skip rides without driver location
        }
        
        const distance = calculateDistance(
          Number(latitude),
          Number(longitude),
          ride.driver.currentLatitude,
          ride.driver.currentLongitude
        );
        
        return distance <= Number(radius);
      });
    }

    res.json({
      rides: filteredRides,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredRides.length,
        pages: Math.ceil(filteredRides.length / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ message: 'Failed to get rides' });
  }
});

// Get single ride by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            rating: true,
            verified: true,
            vehicleInfo: true,
            licensePlate: true,
            school: true,
            currentLatitude: true,
            currentLongitude: true
          }
        },
        requests: {
          include: {
            rider: {
              select: {
                id: true,
                name: true,
                rating: true,
                school: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        offers: {
          include: {
            rider: {
              select: {
                id: true,
                name: true,
                rating: true,
                school: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            requests: true,
            offers: true
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json({ ride });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({ message: 'Failed to get ride' });
  }
});

// Create new ride (drivers only)
router.post('/', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const {
      origin,
      destination,
      departureTime,
      seats,
      fare,
      originLatitude,
      originLongitude,
      destLatitude,
      destLongitude
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !departureTime || !seats || !fare) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate coordinates if provided
    if (originLatitude !== undefined && originLongitude !== undefined) {
      if (!isValidCoordinate(originLatitude, originLongitude)) {
        return res.status(400).json({ message: 'Invalid origin coordinates' });
      }
    }

    if (destLatitude !== undefined && destLongitude !== undefined) {
      if (!isValidCoordinate(destLatitude, destLongitude)) {
        return res.status(400).json({ message: 'Invalid destination coordinates' });
      }
    }

    // Validate departure time is in the future
    const departure = new Date(departureTime);
    if (departure <= new Date()) {
      return res.status(400).json({ message: 'Departure time must be in the future' });
    }

    // Validate seats and fare
    if (seats < 1 || seats > 8) {
      return res.status(400).json({ message: 'Seats must be between 1 and 8' });
    }

    if (fare < 0) {
      return res.status(400).json({ message: 'Fare must be positive' });
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: req.user!.id,
        origin,
        destination,
        departureTime: departure,
        seats: Number(seats),
        fare: Number(fare),
        originLatitude: originLatitude || null,
        originLongitude: originLongitude || null,
        destLatitude: destLatitude || null,
        destLongitude: destLongitude || null
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            rating: true,
            verified: true,
            vehicleInfo: true
          }
        }
      }
    });

    res.status(201).json({
      ride,
      message: 'Ride created successfully'
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ message: 'Failed to create ride' });
  }
});

// Update ride (driver only)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      origin,
      destination,
      departureTime,
      seats,
      fare,
      status,
      originLatitude,
      originLongitude,
      destLatitude,
      destLongitude
    } = req.body;

    // Check if ride exists and user is the driver
    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: {
        requests: true,
        offers: true
      }
    });

    if (!existingRide) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (existingRide.driverId !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized to update this ride' });
    }

    // Check if ride has pending requests/offers
    if (existingRide.requests.length > 0 || existingRide.offers.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot update ride with pending requests or offers' 
      });
    }

    const updateData: any = {};
    
    if (origin !== undefined) updateData.origin = origin;
    if (destination !== undefined) updateData.destination = destination;
    if (departureTime !== undefined) {
      const departure = new Date(departureTime);
      if (departure <= new Date()) {
        return res.status(400).json({ message: 'Departure time must be in the future' });
      }
      updateData.departureTime = departure;
    }
    if (seats !== undefined) {
      if (seats < 1 || seats > 8) {
        return res.status(400).json({ message: 'Seats must be between 1 and 8' });
      }
      updateData.seats = Number(seats);
    }
    if (fare !== undefined) {
      if (fare < 0) {
        return res.status(400).json({ message: 'Fare must be positive' });
      }
      updateData.fare = Number(fare);
    }
    if (status !== undefined) updateData.status = status;
    if (originLatitude !== undefined) updateData.originLatitude = originLatitude;
    if (originLongitude !== undefined) updateData.originLongitude = originLongitude;
    if (destLatitude !== undefined) updateData.destLatitude = destLatitude;
    if (destLongitude !== undefined) updateData.destLongitude = destLongitude;

    const ride = await prisma.ride.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            rating: true,
            verified: true,
            vehicleInfo: true
          }
        }
      }
    });

    res.json({
      ride,
      message: 'Ride updated successfully'
    });
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({ message: 'Failed to update ride' });
  }
});

// Delete ride (driver only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if ride exists and user is the driver
    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: {
        requests: true,
        offers: true
      }
    });

    if (!existingRide) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (existingRide.driverId !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized to delete this ride' });
    }

    // Check if ride has pending requests/offers
    if (existingRide.requests.length > 0 || existingRide.offers.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete ride with pending requests or offers' 
      });
    }

    await prisma.ride.delete({
      where: { id }
    });

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({ message: 'Failed to delete ride' });
  }
});

// Get driver's rides
router.get('/driver/my-rides', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = {
      driverId: req.user!.id
    };

    if (status) {
      whereClause.status = status;
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: whereClause,
        include: {
          requests: {
            include: {
              rider: {
                select: {
                  id: true,
                  name: true,
                  rating: true,
                  school: true
                }
              }
            }
          },
          offers: {
            include: {
              rider: {
                select: {
                  id: true,
                  name: true,
                  rating: true,
                  school: true
                }
              }
            }
          },
          _count: {
            select: {
              requests: true,
              offers: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.ride.count({ where: whereClause })
    ]);

    res.json({
      rides,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get driver rides error:', error);
    res.status(500).json({ message: 'Failed to get driver rides' });
  }
});

export default router;
