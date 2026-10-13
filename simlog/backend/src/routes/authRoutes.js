const express = require('express');
const router = express.Router();
const { getCaptcha, login, me, updateProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.get('/captcha', getCaptcha);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);

module.exports = router;
