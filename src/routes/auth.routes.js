import express from 'express';
import {
    login,
    logout,
    sendSignupOtp,
    verifySignupOtp,
    sendForgotOtp,
    resetPasswordWithOtp,
    changePassword,
    googleAuthRedirect,
    googleAuthCallback,
    updateProfile,
    getMe
} from '../controllers/auth.controller.js';

const router = express.Router();

// Session / User status
router.get('/me', getMe);
router.put('/update-profile', updateProfile);

// Standard Login & Logout
router.post('/login', login);
router.post('/logout', logout);

// Email OTP Registration
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);

// OTP Password Reset
router.post('/forgot-password-otp', sendForgotOtp);
router.post('/reset-password', resetPasswordWithOtp);

// Authenticated Password Change
router.post('/change-password', changePassword);

// Google OAuth
router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);

export default router;