import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import menusRoutes from './menus.routes.js';
import shoppingRoutes from './shopping.routes.js';
import gamificationRoutes from './gamification.routes.js';
import stripeRoutes from './stripe.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/menus', menusRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/stripe', stripeRoutes);

export default router;
