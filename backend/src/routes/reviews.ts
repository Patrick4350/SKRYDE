import express from 'express';
import { PrismaClient } from '../generated/client';
import { authenticateToken, requireVerified, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get reviews for a user
router.get('/user/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { reviewedId: userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews' });
  }
});

// Create review
router.post('/', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const { reviewedId, rating, comment } = req.body;

    if (!reviewedId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid review data' });
    }

    // Check if user is trying to review themselves
    if (reviewedId === req.user!.id) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    // Check if user already reviewed this person
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: req.user!.id,
        reviewedId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this user' });
    }

    // Check if reviewed user exists
    const reviewedUser = await prisma.user.findUnique({
      where: { id: reviewedId }
    });

    if (!reviewedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: req.user!.id,
        reviewedId,
        rating: parseInt(rating),
        comment: comment || null
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true
          }
        },
        reviewed: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true
          }
        }
      }
    });

    // Update user's average rating
    const allReviews = await prisma.review.findMany({
      where: { reviewedId },
      select: { rating: true }
    });

    const averageRating =
      allReviews.reduce(
        (sum: number, r: { rating: number }) => sum + r.rating,
        0
      ) / allReviews.length;


    await prisma.user.update({
      where: { id: reviewedId },
      data: { rating: Math.round(averageRating * 10) / 10 } // Round to 1 decimal place
    });

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to create review' });
  }
});

// Update review
router.put('/:id', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id },
      select: { reviewerId: true, reviewedId: true }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewerId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData: any = {};
    if (rating && rating >= 1 && rating <= 5) {
      updateData.rating = parseInt(rating);
    }
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true
          }
        },
        reviewed: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true
          }
        }
      }
    });

    // Update user's average rating if rating changed
    if (rating) {
      const allReviews = await prisma.review.findMany({
        where: { reviewedId: review.reviewedId },
        select: { rating: true }
      });

      const averageRating =
      allReviews.reduce(
        (sum: number, r: { rating: number }) => sum + r.rating,
        0
      ) / allReviews.length;


      await prisma.user.update({
        where: { id: review.reviewedId },
        data: { rating: Math.round(averageRating * 10) / 10 }
      });
    }

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', authenticateToken, requireVerified, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      select: { reviewerId: true, reviewedId: true }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.review.delete({
      where: { id }
    });

    // Update user's average rating
    const allReviews = await prisma.review.findMany({
      where: { reviewedId: review.reviewedId },
      select: { rating: true }
    });

    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length 
      : 0;

    await prisma.user.update({
      where: { id: review.reviewedId },
      data: { rating: Math.round(averageRating * 10) / 10 }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

// Get user's reviews given
router.get('/my-reviews', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { reviewerId: req.user!.id },
      include: {
        reviewed: {
          select: {
            id: true,
            name: true,
            school: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Failed to get reviews' });
  }
});

export default router;
