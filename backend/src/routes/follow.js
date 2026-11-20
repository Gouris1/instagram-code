
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const {
  followUser,
  unfollowUser
} = require('../controllers/followController');

router.post('/:userId/follow', auth, followUser);
router.delete('/:userId/follow', auth, unfollowUser);

module.exports = router;
