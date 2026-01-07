import { Router } from 'express';
import { getProfile, updateProfile, updateUser, getStats, deleteAccount } from '../controllers/users.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile/stats', authMiddleware, getStats);
router.delete('/profile', authMiddleware, deleteAccount);
router.patch('/me', authMiddleware, updateUser);

export default router;
