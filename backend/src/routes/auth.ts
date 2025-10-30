import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken, verifyEmailDomain } from '../utils/auth';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, school, role = 'RIDER', roleType = 'Student', vehicleInfo, licensePlate } = req.body;

    // Validate required fields
    if (!email || !password || !name || !school) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate .edu email domain
    if (!email.endsWith('.edu')) {
      return res.status(400).json({ message: 'Only .edu email addresses are allowed for student verification' });
    }

    // Validate roleType
    if (!['Student', 'Faculty'].includes(roleType)) {
      return res.status(400).json({ message: 'Role type must be either Student or Faculty' });
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Verify email domain for student verification
    const isStudentEmail = verifyEmailDomain(email);
    
    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        school,
        role,
        roleType,
        verified: isStudentEmail, // Auto-verify .edu emails
        vehicleInfo: role === 'DRIVER' ? vehicleInfo : null,
        licensePlate: role === 'DRIVER' ? licensePlate : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        role: true,
        roleType: true,
        verified: true,
        rating: true,
        vehicleInfo: true,
        licensePlate: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
      requiresVerification: !isStudentEmail
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

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
        createdAt: true,
        updatedAt: true
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

// Update profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, school, vehicleInfo, licensePlate } = req.body;
    const userId = req.user!.id;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (school) updateData.school = school;
    if (vehicleInfo) updateData.vehicleInfo = vehicleInfo;
    if (licensePlate) updateData.licensePlate = licensePlate;

    const user = await prisma.user.update({
      where: { id: userId },
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
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Verify account (admin only for manual verification)
router.post('/verify/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true
      }
    });

    res.json({
      message: 'User verified successfully',
      user
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Failed to verify user' });
  }
});

export default router;
