const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Message = require('../models/Message');
const User = require('../models/user');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(
      req.user.id
    );

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          },

          lastMessage: {
            $first: '$$ROOT'
          },

          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', currentUserId] },
                    { $ne: ['$isRead', true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: {
          'lastMessage.createdAt': -1
        }
      }
    ]);

    const result = await Promise.all(
      conversations.map(async conversation => {
        const user = await User.findById(
          conversation._id
        ).select('name fullName username email avatarUrl profileImage');

        if (!user) return null;

        return {
          user,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: result.filter(Boolean)
    });

  } catch (error) {
    console.error('Get conversations error:', error);

    return res.status(500).json({
      success: false,
      message: 'Conversations could not be loaded'
    });
  }
});


// SEND MESSAGE
router.post('/', auth, async (req, res) => {
  try {
    const senderId = String(req.user.id);
    const { receiverId, text } = req.body;

    if (
      !receiverId ||
      !mongoose.isValidObjectId(receiverId) ||
      typeof text !== 'string' ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid receiverId and text are required'
      });
    }

    if (senderId === String(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot message yourself'
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: text.trim()
    });

    const io = req.app.get('io');

    if (io) {
      io.to(String(receiverId)).emit(
        'receiveMessage',
        message
      );

      io.to(senderId).emit(
        'messageSent',
        message
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);

    return res.status(500).json({
      success: false,
      message: 'Message could not be sent'
    });
  }
});


// MARK MESSAGES AS READ
router.patch('/:userId/read', auth, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const otherUserId = req.params.userId;

    if (
      !mongoose.isValidObjectId(otherUserId) ||
      currentUserId === String(otherUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    const result = await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        isRead: { $ne: true }
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    const io = req.app.get('io');

    if (io) {
      io.to(String(otherUserId)).emit('messagesRead', {
        readerId: currentUserId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark messages read error:', error);

    return res.status(500).json({
      success: false,
      message: 'Messages could not be marked as read'
    });
  }
});


// GET SELECTED USER CONVERSATION
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const otherUserId = req.params.userId;

    if (
      !mongoose.isValidObjectId(otherUserId) ||
      currentUserId === String(otherUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get messages error:', error);

    return res.status(500).json({
      success: false,
      message: 'Messages could not be loaded'
    });
  }
});

module.exports = router; 