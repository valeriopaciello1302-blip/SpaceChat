import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createMessage, getMessagesByConversation} from '../controllers/messageController.js';

const router = express.Router();

router.post('/', authMiddleware, createMessage);
router.get('/conversation/:id', authMiddleware, getMessagesByConversation);

export default router;