import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Admin Register - Allow ADMIN role registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).maxTimeMS(5000);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create admin user
    const user = new User({
      name,
      email,
      password,
      role: 'ADMIN',
      isPremium: true,
      status: 'ONLINE',
      lastLogin: new Date()
    });

    await user.save();
    await UserActivity.create({ userId: user._id, userName: user.name, type: 'LOGIN', ipAddress: req.ip, userAgent: req.get('user-agent') });

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).maxTimeMS(5000);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access only. Please use regular login.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update user status and last login
    user.status = 'ONLINE';
    user.lastLogin = new Date();
    await user.save();
    await UserActivity.create({ userId: user._id, userName: user.name, type: 'LOGIN', ipAddress: req.ip, userAgent: req.get('user-agent') });

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

export default router;

