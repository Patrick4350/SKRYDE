import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get notifications for logged-in user
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            roleType: true,
          },
        },
      },
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch("/:id/read", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { 
        id: req.params.id,
        recipientId: req.user!.id, // Ensure user can only mark their own notifications as read
      },
      data: { read: true },
    });
    res.json({ ok: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        recipientId: req.user!.id,
        read: false,
      },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread notification count
router.get("/unread-count", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: { 
        recipientId: req.user!.id,
        read: false,
      },
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

export default router;
