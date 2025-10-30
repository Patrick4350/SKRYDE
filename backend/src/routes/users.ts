import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerified, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        role: true,
        verified: true,
        rating: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Get user reviews
router.get('/:id/reviews', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { reviewedId: id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            school: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews' });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['RIDER', 'DRIVER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true
      }
    });

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
