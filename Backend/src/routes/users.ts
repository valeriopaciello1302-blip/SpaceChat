import express from 'express';
import { getUsers, createUser, updateMyAvatar } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getUsers);
router.post('/', createUser);
router.patch('/me/avatar', authMiddleware, updateMyAvatar);

export default router;