
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = express.Router();


// 1. SEARCH USERS API
// GET /api/users/search?q=name
router.get('/search', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.status(200).json({
        success: true,
        users: []
      });
    }

    const currentUser = await User.findById(req.user.id)
      .select('following')
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Logged-in user not found'
      });
    }

    const followingIds = (currentUser.following || []).map(
      id => String(id)
    );

    const escapedQuery = q.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        {
          name: {
            $regex: escapedQuery,
            $options: 'i'
          }
        },
        {
          email: {
            $regex: escapedQuery,
            $options: 'i'
          }
        }
      ]
    })
      .select('_id name profileImage')
      .limit(20)
      .lean();

    const resultUsers = users.map(user => ({
      ...user,
      isFollowing: followingIds.includes(String(user._id))
    }));

    return res.status(200).json({
      success: true,
      users: resultUsers
    });

  } catch (error) {
    console.error('Search users error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// GET LOGGED-IN USER PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email profileImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// 2. GET USER PROFILE BY ID
// GET /api/users/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId)
      .select('name email profileImage followers following')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const followers = user.followers || [];
    const following = user.following || [];

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        followersCount: followers.length,
        followingCount: following.length,
        isFollowing: followers.some(
          id => String(id) === String(req.user.id)
        )
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// 3. GET ALL USERS
// GET /api/users
// GET ALL USERS WITH FOLLOW STATUS
router.get('/', auth, async (req, res) => {
  try {
    // Logged-in user ki following list nikalo
    const currentUser = await User.findById(req.user.id)
      .select('following')
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Logged-in user not found'
      });
    }

    // Following IDs ko Set mein convert karo
    const followingIds = new Set(
      (currentUser.following || []).map(id => String(id))
    );

    // Logged-in user ko chhodkar baaki users fetch karo
    const users = await User.find({
      _id: { $ne: req.user.id }
    })
      .select('_id name')
      .limit(100)
      .lean();

    // Har user ka follow status add karo
    const resultUsers = users.map(user => ({
      ...user,
      isFollowing: followingIds.has(String(user._id))
    }));

    return res.status(200).json({
      success: true,
      users: resultUsers
    });

  } catch (error) {
    console.error('Get all users error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;
