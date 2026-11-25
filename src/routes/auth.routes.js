import express from 'express';
import { uploadAvatar } from '../lib/cloudinary.js';
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

router.get('/me', getMe);

// Attach multer upload middleware
router.put('/update-profile', (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, updateProfile);

router.post('/login', login);
router.post('/logout', logout);
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/forgot-password-otp', sendForgotOtp);
router.post('/reset-password', resetPasswordWithOtp);
router.post('/change-password', changePassword);
router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);

export default router;