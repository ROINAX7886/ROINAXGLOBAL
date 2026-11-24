import express from 'express';
import { signup, login, logout, updateProfile, getMe } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/me', getMe); // <--- Added here
router.post('/signup', signup);
router.post('/register', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', updateProfile);

export default router;