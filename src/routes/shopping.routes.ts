import { Router } from 'express';
import { 
  getCurrent, 
  toggleItem, 
  addItem, 
  deleteItem, 
  getSubstitution,
  exportPdf,
  exportText
} from '../controllers/shopping.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/current', authMiddleware, getCurrent);
router.post('/toggle/:itemId', authMiddleware, toggleItem);
router.post('/add', authMiddleware, addItem);
router.delete('/:itemId', authMiddleware, deleteItem);
router.post('/substitution', authMiddleware, getSubstitution);
router.get('/export/pdf', authMiddleware, exportPdf);
router.get('/export/text', authMiddleware, exportText);

export default router;
