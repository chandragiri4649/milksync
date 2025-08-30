const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Password reset routes (public - no authentication required)
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.validateResetToken);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
