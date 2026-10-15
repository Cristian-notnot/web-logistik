const express = require('express');
const router = express.Router();
const { login, me, updateProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);

module.exports = router;
