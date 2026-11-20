const express = require('express');
const router = express.Router();

const { getPosts, createPost, getMyPosts, toggleLike, addComment } = require('../controllers/postController');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getPosts);
router.get('/my-posts', auth, getMyPosts);
router.post('/', auth, upload.single('image'), createPost);

router.post('/:postId/like', auth, toggleLike);
router.post('/:postId/comments', auth, addComment);

module.exports = router;