const mongoose = require('mongoose');

const Post = require('../models/Post');
const Notification = require('../models/Notification');
const getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      Post.find()
        .populate('user', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      message: 'Posts fetched successfully',
      pagination: {
        currentPage: page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit)
      },
      posts: posts.map((post) => ({
        ...post,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0
      }))
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
};

const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image'
      });
    }

    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not found in authentication token'
      });
    }

    const post = await Post.create({
      user: userId,
      imageUrl: `/uploads/${req.file.filename}`,
      caption: req.body.caption || ''
    });

    const savedPost = await Post.findById(post._id)
      .populate('user', 'name email profileImage')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        ...savedPost,
        likesCount: savedPost.likes?.length || 0,
        commentsCount: savedPost.comments?.length || 0
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }

    const posts = await Post.find({ user: userId })
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'My posts fetched successfully',
      totalPosts: posts.length,
      posts: posts.map((post) => ({
        ...post,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0
      }))
    });
  } catch (error) {
    console.error('Get my posts error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch my posts'
    });
  }
};



// LIKE / UNLIKE POST
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      // Unlike
      post.likes.pull(userId);
      await post.save();

      return res.status(200).json({
        success: true,
        message: 'Post unliked successfully',
        liked: false,
        likesCount: post.likes.length
      });
    }

    // Like
    post.likes.push(userId);
    await post.save();

    // Apni post like karne par khud ko notification nahi bhejni
    if (post.user.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'like',
        post: post._id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      liked: true,
      likesCount: post.likes.length
    });

  } catch (error) {
    console.error('Like post error:', error);

    return res.status(500).json({
      success: false,
      message: 'Like action failed'
    });
  }
};


// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Apni post par comment karne par khud ko notification nahi bhejni
    if (post.user.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        post: post._id,
        commentText: text.trim()
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
      commentsCount: post.comments.length
    });

  } catch (error) {
    console.error('Add comment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Comment could not be added'
    });
  }
};

module.exports = { getPosts, createPost, getMyPosts, toggleLike, addComment };