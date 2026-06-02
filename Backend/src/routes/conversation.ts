import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createConversation, getConversations } from '../controllers/conversationController.js';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
	interface Request {
	  user?: jwt.JwtPayload;
	}
  }
}

const router = express.Router();

router.post('/', authMiddleware, createConversation);
router.get('/', authMiddleware, getConversations);

export default router;
