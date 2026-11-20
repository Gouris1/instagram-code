const express = require('express');
const { signup, login } = require('../controllers/authcontroller');
const { signupValidation, LoginValidation } = require('../middleware/AuthValidation');

const router = express.Router();

router.post('/signup', signupValidation, signup);
router.post('/login', LoginValidation, login);

module.exports = router;