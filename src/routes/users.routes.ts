import { Router } from 'express';
import { getProfile, updateProfile, updateUser } from '../controllers/users.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.patch('/me', authMiddleware, updateUser);

export default router;
