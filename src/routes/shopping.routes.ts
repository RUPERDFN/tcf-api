import { Router } from 'express';
import { getList, addItem, togglePurchased, deleteItem, getFromActiveMenu } from '../controllers/shopping.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getList);
router.get('/from-menu', authMiddleware, getFromActiveMenu);
router.post('/', authMiddleware, addItem);
router.patch('/:id', authMiddleware, togglePurchased);
router.delete('/:id', authMiddleware, deleteItem);

export default router;
