
const User = require('../models/user');

// FOLLOW USER
const followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (!targetUserId || !require('mongoose').Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: currentUserId }
    });

    return res.status(200).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UNFOLLOW USER
const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (!targetUserId || !require('mongoose').Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId }
    });

    return res.status(200).json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { followUser, unfollowUser };
