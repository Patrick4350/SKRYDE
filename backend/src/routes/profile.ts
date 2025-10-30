import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { isValidCoordinate } from '../utils/geo';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        role: true,
        verified: true,
        rating: true,
        vehicleInfo: true,
        licensePlate: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ridesAsDriver: true,
            ridesAsRider: true,
            reviewsReceived: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      school,
      vehicleInfo,
      licensePlate,
      currentLatitude,
      currentLongitude
    } = req.body;

    // Validate coordinates if provided
    if (currentLatitude !== undefined && currentLongitude !== undefined) {
      if (!isValidCoordinate(currentLatitude, currentLongitude)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }
    }

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (school !== undefined) updateData.school = school;
    if (vehicleInfo !== undefined) updateData.vehicleInfo = vehicleInfo;
    if (licensePlate !== undefined) updateData.licensePlate = licensePlate;
    if (currentLatitude !== undefined) updateData.currentLatitude = currentLatitude;
    if (currentLongitude !== undefined) updateData.currentLongitude = currentLongitude;
    
    // Update last location update timestamp if coordinates are provided
    if (currentLatitude !== undefined && currentLongitude !== undefined) {
      updateData.lastLocationUpdate = new Date();
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        role: true,
        verified: true,
        rating: true,
        vehicleInfo: true,
        licensePlate: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ 
      user,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [
      totalRidesAsDriver,
      totalRidesAsRider,
      completedRides,
      averageRating,
      totalEarnings,
      recentReviews
    ] = await Promise.all([
      // Total rides as driver
      prisma.ride.count({
        where: { driverId: userId }
      }),
      
      // Total rides as rider
      prisma.rideRequest.count({
        where: { riderId: userId }
      }),
      
      // Completed rides
      prisma.ride.count({
        where: {
          OR: [
            { driverId: userId, status: 'COMPLETED' },
            { 
              requests: {
                some: {
                  riderId: userId,
                  status: 'COMPLETED'
                }
              }
            }
          ]
        }
      }),
      
      // Average rating
      prisma.review.aggregate({
        where: { reviewedId: userId },
        _avg: { rating: true }
      }),
      
      // Total earnings (as driver)
      prisma.ride.aggregate({
        where: {
          driverId: userId,
          status: 'COMPLETED'
        },
        _sum: { fare: true }
      }),
      
      // Recent reviews
      prisma.review.findMany({
        where: { reviewedId: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      stats: {
        totalRidesAsDriver,
        totalRidesAsRider,
        completedRides,
        averageRating: averageRating._avg.rating || 0,
        totalEarnings: totalEarnings._sum.fare || 0,
        recentReviews
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get statistics' });
  }
});

// Get user's ride history
router.get('/rides', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, type = 'all' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = {};

    if (type === 'driver') {
      whereClause = { driverId: userId };
    } else if (type === 'rider') {
      whereClause = {
        requests: {
          some: { riderId: userId }
        }
      };
    } else {
      // All rides (as driver or rider)
      whereClause = {
        OR: [
          { driverId: userId },
          {
            requests: {
              some: { riderId: userId }
            }
          }
        ]
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
              vehicleInfo: true
            }
          },
          requests: {
            where: type === 'rider' ? { riderId: userId } : undefined,
            include: {
              rider: {
                select: {
                  id: true,
                  name: true,
                  rating: true
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
    console.error('Get ride history error:', error);
    res.status(500).json({ message: 'Failed to get ride history' });
  }
});

// Delete user account
router.delete('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Check if user has any active rides
    const activeRides = await prisma.ride.count({
      where: {
        driverId: userId,
        status: 'ACTIVE'
      }
    });

    if (activeRides > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active rides. Please cancel active rides first.' 
      });
    }

    // Delete user and all related data
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
