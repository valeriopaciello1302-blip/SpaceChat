import express from 'express';
import {
    login,
    getMe,
    changePassword
} from '../controllers/authController.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.patch('/change-password', authMiddleware, changePassword);

export default router;