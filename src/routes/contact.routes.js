import express from 'express';
import { handleContactEnquiry } from '../controllers/contact.controller.js';

const router = express.Router();

router.post('/send', handleContactEnquiry);

export default router;