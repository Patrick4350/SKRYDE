import express from 'express';
import { PrismaClient } from '../generated/client';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard analytics
router.get('/dashboard', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    // Get user statistics
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { verified: true } });
    const drivers = await prisma.user.count({ where: { role: 'DRIVER' } });
    const riders = await prisma.user.count({ where: { role: 'RIDER' } });

    // Get ride statistics
    const totalRides = await prisma.ride.count();
    const activeRides = await prisma.ride.count({ where: { status: 'ACTIVE' } });
    const completedRides = await prisma.ride.count({ where: { status: 'COMPLETED' } });

    // Get offer statistics
    const totalOffers = await prisma.offer.count();
    const acceptedOffers = await prisma.offer.count({ where: { accepted: true } });

    // Get review statistics
    const totalReviews = await prisma.review.count();
    const averageRating = await prisma.review.aggregate({
      _avg: { rating: true }
    });

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        role: true,
        verified: true,
        createdAt: true
      }
    });

    const recentRides = await prisma.ride.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            school: true
          }
        }
      }
    });

    res.json({
      analytics: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          drivers,
          riders,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0
        },
        rides: {
          total: totalRides,
          active: activeRides,
          completed: completedRides,
          completionRate: totalRides > 0 ? (completedRides / totalRides * 100).toFixed(1) : 0
        },
        offers: {
          total: totalOffers,
          accepted: acceptedOffers,
          acceptanceRate: totalOffers > 0 ? (acceptedOffers / totalOffers * 100).toFixed(1) : 0
        },
        reviews: {
          total: totalReviews,
          averageRating: averageRating._avg.rating ? averageRating._avg.rating.toFixed(1) : 0
        }
      },
      recentActivity: {
        users: recentUsers,
        rides: recentRides
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data' });
  }
});

// Get all users with pagination
router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, search, role, verified } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { school: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (role) whereClause.role = role;
    if (verified !== undefined) whereClause.verified = verified === 'true';

    const users = await prisma.user.findMany({
      where: whereClause,
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
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: offset
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get all rides with pagination
router.get('/rides', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {};
    if (status) whereClause.status = status;

    const rides = await prisma.ride.findMany({
      where: whereClause,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            school: true,
            rating: true,
            verified: true
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
      take: parseInt(limit as string),
      skip: offset
    });

    const totalRides = await prisma.ride.count({ where: whereClause });

    res.json({
      rides,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalRides,
        pages: Math.ceil(totalRides / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ message: 'Failed to get rides' });
  }
});

// Manage ads
router.get('/ads', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ ads });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ message: 'Failed to get ads' });
  }
});

router.post('/ads', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { title, image, link } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const ad = await prisma.ad.create({
      data: {
        title,
        image: image || null,
        link: link || null
      }
    });

    res.status(201).json({
      message: 'Ad created successfully',
      ad
    });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ message: 'Failed to create ad' });
  }
});

router.put('/ads/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, active } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link;
    if (active !== undefined) updateData.active = active;

    const ad = await prisma.ad.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Ad updated successfully',
      ad
    });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ message: 'Failed to update ad' });
  }
});

router.delete('/ads/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.ad.delete({
      where: { id }
    });

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ message: 'Failed to delete ad' });
  }
});

// Business metrics
router.get('/metrics', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    // Revenue simulation (based on completed rides)
    const completedRides = await prisma.ride.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: daysAgo }
      },
      select: { fare: true }
    });

    const totalRevenue = completedRides.reduce(
      (sum: number, ride: { fare: number }) => sum + ride.fare,
      0
    );
    
    const platformRevenue = totalRevenue * 0.2; // 20% platform fee
    const driverRevenue = totalRevenue * 0.8; // 80% driver fee

    // User growth
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: daysAgo } }
    });

    // Active users (users who created rides or offers in the period)
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          { ridesAsDriver: { some: { createdAt: { gte: daysAgo } } } },
          { offers: { some: { createdAt: { gte: daysAgo } } } }
        ]
      }
    });

    res.json({
      period: `${period} days`,
      revenue: {
        total: totalRevenue.toFixed(2),
        platform: platformRevenue.toFixed(2),
        drivers: driverRevenue.toFixed(2),
        averageRideValue: completedRides.length > 0 ? (totalRevenue / completedRides.length).toFixed(2) : 0
      },
      users: {
        new: newUsers,
        active: activeUsers,
        growthRate: newUsers > 0 ? ((newUsers / (totalRevenue > 0 ? 1 : 1)) * 100).toFixed(1) : 0
      },
      rides: {
        completed: completedRides.length,
        averagePerDay: (completedRides.length / parseInt(period as string)).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ message: 'Failed to get metrics' });
  }
});

export default router;
