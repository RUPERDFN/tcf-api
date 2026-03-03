import { Router, raw } from 'express';
import { createCheckout, stripeWebhook, customerPortal } from '../controllers/stripe.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Webhook must use raw body parser BEFORE JSON middleware parses it
// express.raw is applied only to this specific route
router.post('/webhook', raw({ type: 'application/json' }), stripeWebhook);

// Authenticated Stripe routes
router.post('/checkout', authMiddleware, createCheckout);
router.post('/portal', authMiddleware, customerPortal);

export default router;
