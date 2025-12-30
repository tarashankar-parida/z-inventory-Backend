import express from 'express';
import UserActivity from '../models/UserActivity.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all activities (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    let activities = await UserActivity.find();
    activities = activities.sort((a, b) => (new Date(b.timestamp) - new Date(a.timestamp))).slice(0, limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear all activities (Admin only)
router.delete('/', authenticate, requireAdmin, async (req, res) => {
  try {
    await UserActivity.deleteMany({});
    res.json({ message: 'All activities cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

