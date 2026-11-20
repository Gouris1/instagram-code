const express = require('express');
const router = express.Router();

const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get logged-in user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const notifications = await Notification.find({
      recipient: userId
    })
      .populate('sender', 'name profileImage')
      .populate('post', 'imageUrl caption')
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = notifications.filter(
      (item) => !item.isRead
    ).length;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);

    res.status(500).json({
      success: false,
      message: 'Notifications load nahi hui.'
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });

  } catch (error) {
    console.error('Mark notification read error:', error);

    res.status(500).json({
      success: false,
      message: 'Could not update notification'
    });
  }
});

module.exports = router;