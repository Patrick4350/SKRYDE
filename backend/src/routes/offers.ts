import express from 'express';
import { PrismaClient } from '../generated/client';
import { authenticateToken, requireVerified, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all offers for a ride
router.get('/ride/:rideId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rideId } = req.params;

    const offers = await prisma.offer.findMany({
      where: { rideId },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true,
            verified: true
          }
        },
        ride: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            driverId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ offers });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Failed to get offers' });
  }
});

// Create offer (riders only)
router.post('/', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'RIDER') {
      return res.status(403).json({ message: 'Rider access required' });
    }

    const { rideId, amount } = req.body;

    if (!rideId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if ride exists and is active
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true, status: true, driverId: true, fare: true }
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Ride is not active' });
    }

    if (ride.driverId === req.user!.id) {
      return res.status(400).json({ message: 'Cannot make offer on your own ride' });
    }

    // Check if user already has an offer for this ride
    const existingOffer = await prisma.offer.findFirst({
      where: {
        rideId,
        riderId: req.user!.id
      }
    });

    if (existingOffer) {
      return res.status(400).json({ message: 'You already have an offer for this ride' });
    }

    const offer = await prisma.offer.create({
      data: {
        rideId,
        riderId: req.user!.id,
        amount: parseFloat(amount)
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true,
            verified: true
          }
        },
        ride: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Failed to create offer' });
  }
});

// Accept offer (driver only)
router.put('/:id/accept', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        ride: {
          select: {
            id: true,
            driverId: true,
            status: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is the driver of this ride
    if (offer.ride.driverId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (offer.ride.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Ride is not active' });
    }

    // Accept the offer
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: { accepted: true },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true,
            verified: true
          }
        },
        ride: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true
          }
        }
      }
    });

    res.json({
      message: 'Offer accepted successfully',
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: 'Failed to accept offer' });
  }
});

// Reject offer (driver only)
router.put('/:id/reject', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        ride: {
          select: {
            driverId: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user is the driver of this ride
    if (offer.ride.driverId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete the offer (rejection)
    await prisma.offer.delete({
      where: { id }
    });

    res.json({ message: 'Offer rejected successfully' });
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ message: 'Failed to reject offer' });
  }
});

// Get user's offers (as rider)
router.get('/my-offers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { riderId: req.user!.id },
      include: {
        ride: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                school: true,
                rating: true,
                verified: true,
                vehicleInfo: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ offers });
  } catch (error) {
    console.error('Get my offers error:', error);
    res.status(500).json({ message: 'Failed to get offers' });
  }
});

// Cancel offer (rider only)
router.delete('/:id', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      select: { riderId: true, accepted: true }
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.riderId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (offer.accepted) {
      return res.status(400).json({ message: 'Cannot cancel accepted offer' });
    }

    await prisma.offer.delete({
      where: { id }
    });

    res.json({ message: 'Offer cancelled successfully' });
  } catch (error) {
    console.error('Cancel offer error:', error);
    res.status(500).json({ message: 'Failed to cancel offer' });
  }
});

export default router;
