import express from 'express';
import {
    createRegistrationRequest,
    getRegistrationRequests,
    rejectRegistrationRequest,
    approveRegistrationRequest
} from '../controllers/registrationRequestController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();
router.post('/', createRegistrationRequest);
router.get('/', authMiddleware, adminMiddleware, getRegistrationRequests);
router.delete('/:id', authMiddleware, adminMiddleware, rejectRegistrationRequest);
router.post('/:id/approve', authMiddleware, adminMiddleware, approveRegistrationRequest);

export default router;