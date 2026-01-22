
import express from 'express';
import { chat } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/', chat);

export default router;
