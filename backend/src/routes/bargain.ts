import express from 'express';
import { PrismaClient } from '../generated/client';
import { authenticateToken } from '../middleware/auth';
import { calculateDistance } from '../utils/geo';

const router = express.Router();
const prisma = new PrismaClient();

// Get nearby drivers for a ride request
router.get('/nearby-drivers', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 8 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = parseFloat(radius as string);

    // Get all verified drivers with location data
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        verified: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        school: true,
        rating: true,
        vehicleInfo: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });

    // Filter drivers within radius and calculate distances
    const nearbyDrivers = drivers
      .map((driver: any) => {
        if (!driver.currentLatitude || !driver.currentLongitude) return null;
        
        const distance = calculateDistance(
          lat,
          lng,
          driver.currentLatitude,
          driver.currentLongitude
        );
        
        return {
          ...driver,
          distance,
        };
      })
      .filter((driver: any) => driver && driver.distance <= searchRadius)
      .sort((a: any, b: any) => a!.distance - b!.distance);

    res.json({
      drivers: nearbyDrivers,
      count: nearbyDrivers.length,
      center: { latitude: lat, longitude: lng },
      radius: searchRadius,
    });
  } catch (error) {
    console.error('Error fetching nearby drivers:', error);
    res.status(500).json({ error: 'Failed to fetch nearby drivers' });
  }
});

// Calculate estimated fare for a ride
router.post('/calculate-fare', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, driverId, distance } = req.body;
    
    if (!origin || !destination || !driverId) {
      return res.status(400).json({ error: 'Origin, destination, and driverId are required' });
    }

    // Get driver info
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { rating: true, vehicleInfo: true },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Calculate base fare (simplified pricing model)
    const baseFare = 2.50; // Base fare
    const perKmRate = 1.20; // Per kilometer rate
    const estimatedDistance = distance || 5; // Default to 5km if not provided
    const ratingMultiplier = Math.max(0.8, Math.min(1.2, driver.rating / 5)); // Rating affects price
    
    const estimatedFare = (baseFare + (estimatedDistance * perKmRate)) * ratingMultiplier;

    res.json({
      estimatedFare: Math.round(estimatedFare * 100) / 100,
      baseFare,
      perKmRate,
      distance: estimatedDistance,
      ratingMultiplier,
      driver: {
        rating: driver.rating,
        vehicleInfo: driver.vehicleInfo,
      },
    });
  } catch (error) {
    console.error('Error calculating fare:', error);
    res.status(500).json({ error: 'Failed to calculate fare' });
  }
});

// Create a ride request with fare negotiation
router.post('/ride-request', authenticateToken, async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureTime,
      passengers,
      maxFare,
      message,
      originLatitude,
      originLongitude,
      destLatitude,
      destLongitude,
    } = req.body;

    const userId = (req as any).user.id;

    // Create ride request
    const rideRequest = await prisma.rideRequest.create({
      data: {
        riderId: userId,
        origin,
        destination,
        departureTime: new Date(departureTime),
        maxFare: parseFloat(maxFare),
        passengers: parseInt(passengers),
        message,
        originLatitude: originLatitude ? parseFloat(originLatitude) : null,
        originLongitude: originLongitude ? parseFloat(originLongitude) : null,
        destLatitude: destLatitude ? parseFloat(destLatitude) : null,
        destLongitude: destLongitude ? parseFloat(destLongitude) : null,
        status: 'PENDING',
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true,
            roleType: true,
          },
        },
      },
    });

    // Create notification for nearby drivers
    const nearbyDrivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        verified: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        lastLocationUpdate: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Drivers updated in last 5 minutes
        },
      },
      select: { id: true },
    });

    // Create notifications for nearby drivers
    if (nearbyDrivers.length > 0) {
      const notifications = nearbyDrivers.map(driver => ({
        recipientId: driver.id,
        senderId: userId,
        type: 'RIDE_REQUEST',
        message: `New ride request from ${origin || 'Unknown Origin'} to ${destination || 'Unknown Destination'}`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    }

    res.json({
      request: rideRequest,
      message: 'Ride request created successfully',
    });
  } catch (error) {
    console.error('Error creating ride request:', error);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
});

// Start fare negotiation
router.post('/start-bargain', authenticateToken, async (req, res) => {
  try {
    const { requestId, driverId, proposedFare, message } = req.body;

    const userId = (req as any).user.id;

    // Get the ride request
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { rider: true },
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    // Create or update the ride with fare negotiation
    const ride = await prisma.ride.upsert({
      where: { id: `${requestId}-${driverId}` },
      update: {
        proposedFare: parseFloat(proposedFare),
        bargainHistory: {
          negotiations: [
            {
              timestamp: new Date().toISOString(),
              type: 'proposal',
              from: userId,
              amount: parseFloat(proposedFare),
              message: message || '',
            },
          ],
        },
      },
      create: {
        id: `${requestId}-${driverId}`,
        driverId,
        origin: rideRequest.origin || 'Unknown Origin',
        destination: rideRequest.destination || 'Unknown Destination',
        departureTime: rideRequest.departureTime || new Date(),
        seats: rideRequest.passengers || 1,
        fare: parseFloat(proposedFare),
        proposedFare: parseFloat(proposedFare),
        status: 'ACTIVE',
        originLatitude: rideRequest.originLatitude,
        originLongitude: rideRequest.originLongitude,
        destLatitude: rideRequest.destLatitude,
        destLongitude: rideRequest.destLongitude,
        bargainHistory: {
          negotiations: [
            {
              timestamp: new Date().toISOString(),
              type: 'proposal',
              from: userId,
              amount: parseFloat(proposedFare),
              message: message || '',
            },
          ],
        },
      },
    });

    // Create notification for the rider
    await prisma.notification.create({
      data: {
        recipientId: rideRequest.riderId,
        senderId: userId,
        type: 'OFFER',
        message: `Driver responded to your ride request with a fare offer of $${proposedFare}`,
      },
    });

    res.json({
      ride,
      message: 'Fare negotiation started',
    });
  } catch (error) {
    console.error('Error starting bargain:', error);
    res.status(500).json({ error: 'Failed to start fare negotiation' });
  }
});

// Counter offer in fare negotiation
router.post('/counter-offer', authenticateToken, async (req, res) => {
  try {
    const { rideId, counterFare, message } = req.body;
    const userId = (req as any).user.id;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Update the ride with counter offer
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        proposedFare: parseFloat(counterFare),
        bargainHistory: {
          negotiations: [
            ...(ride.bargainHistory as any)?.negotiations || [],
            {
              timestamp: new Date().toISOString(),
              type: 'counter',
              from: userId,
              amount: parseFloat(counterFare),
              message: message || '',
            },
          ],
        },
      },
    });

    res.json({
      ride: updatedRide,
      message: 'Counter offer submitted',
    });
  } catch (error) {
    console.error('Error submitting counter offer:', error);
    res.status(500).json({ error: 'Failed to submit counter offer' });
  }
});

// Accept fare negotiation
router.post('/accept-fare', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.body;
    const userId = (req as any).user.id;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { requests: true },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Accept the proposed fare
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        acceptedFare: ride.proposedFare,
        bargainHistory: {
          negotiations: [
            ...(ride.bargainHistory as any)?.negotiations || [],
            {
              timestamp: new Date().toISOString(),
              type: 'acceptance',
              from: userId,
              amount: ride.proposedFare,
              message: 'Fare accepted',
            },
          ],
        },
      },
    });

    // Create notification for the other party
    const isRider = ride.requests.some((req: any) => req.riderId === userId);
    const notificationRecipientId = isRider ? ride.driverId : ride.requests[0]?.riderId;
    
    if (notificationRecipientId) {
      await prisma.notification.create({
        data: {
          recipientId: notificationRecipientId,
          senderId: userId,
          type: 'OFFER_ACCEPTED',
          message: `${isRider ? 'Rider' : 'Driver'} accepted the fare of $${ride.proposedFare}`,
        },
      });
    }

    res.json({
      ride: updatedRide,
      message: 'Fare accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting fare:', error);
    res.status(500).json({ error: 'Failed to accept fare' });
  }
});

// Reject fare negotiation
router.post('/reject-fare', authenticateToken, async (req, res) => {
  try {
    const { rideId, reason } = req.body;
    const userId = (req as any).user.id;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { requests: true },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Update ride status to cancelled
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'CANCELLED',
        bargainHistory: {
          negotiations: [
            ...(ride.bargainHistory as any)?.negotiations || [],
            {
              timestamp: new Date().toISOString(),
              type: 'rejection',
              from: userId,
              amount: ride.proposedFare,
              message: reason || 'Fare rejected',
            },
          ],
        },
      },
    });

    // Create notification for the other party
    const isRider = ride.requests.some((req: any) => req.riderId === userId);
    const notificationRecipientId = isRider ? ride.driverId : ride.requests[0]?.riderId;
    
    if (notificationRecipientId) {
      await prisma.notification.create({
        data: {
          recipientId: notificationRecipientId,
          senderId: userId,
          type: 'OFFER_REJECTED',
          message: `${isRider ? 'Rider' : 'Driver'} rejected the fare offer`,
        },
      });
    }

    res.json({
      ride: updatedRide,
      message: 'Fare negotiation rejected',
    });
  } catch (error) {
    console.error('Error rejecting fare:', error);
    res.status(500).json({ error: 'Failed to reject fare' });
  }
});

// Get ride requests for drivers
router.get('/ride-requests', authenticateToken, async (req, res) => {
  try {
    const { driverId, status, limit = 20, offset = 0 } = req.query;
    const userId = (req as any).user.id;

    // If driverId is provided, filter by that driver
    // Otherwise, get all pending requests for any driver to see
    const whereClause: any = {
      status: status || 'PENDING',
    };

    // For now, get all pending requests (drivers can see all requests)
    // In a real app, you might want to filter by location/distance
    
    const requests = await prisma.rideRequest.findMany({
      where: whereClause,
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            school: true,
            role: true,
            roleType: true,
            verified: true,
            rating: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const totalCount = await prisma.rideRequest.count({
      where: whereClause,
    });

    res.json({
      requests,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    res.status(500).json({ error: 'Failed to fetch ride requests' });
  }
});

export default router;
