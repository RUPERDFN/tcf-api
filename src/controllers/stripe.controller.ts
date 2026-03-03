/**
 * stripe.controller.ts
 * 
 * Exposes three endpoints:
 *  POST /stripe/checkout  — Create checkout session (authenticated)
 *  POST /stripe/webhook   — Stripe webhook receiver (raw body, no auth)
 *  POST /stripe/portal    — Customer portal for billing management (authenticated)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';
import { subscriptions, users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import {
    createCheckoutSession,
    handleWebhookEvent,
    createPortalSession,
} from '../services/stripe.service.js';

/**
 * POST /stripe/checkout
 * Creates a Stripe Checkout Session for the Pro plan upgrade.
 * Returns the redirect URL.
 */
export async function createCheckout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        // Fetch user email
        const [user] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId));

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verify user is not already on Pro
        const [sub] = await db
            .select({ plan: subscriptions.plan, status: subscriptions.status })
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId));

        if (sub?.plan === 'PRO' && sub?.status === 'ACTIVE') {
            return res.status(400).json({ error: 'Ya tienes una suscripción Pro activa' });
        }

        const result = await createCheckoutSession(userId, user.email);
        res.json({ url: result.url, sessionId: result.sessionId });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /stripe/webhook
 * Receives raw Stripe webhook events. Must use express.raw() middleware for this route.
 * No JWT auth — Stripe signature is the security mechanism.
 */
export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            return res.status(400).json({ error: 'Missing stripe-signature header' });
        }

        await handleWebhookEvent(req.body as Buffer, signature);

        // Always respond 200 to Stripe quickly, even if processing had issues
        res.json({ received: true });
    } catch (error: any) {
        console.error('[Stripe Webhook] Error:', error.message);
        res.status(400).json({ error: error.message });
    }
}

/**
 * POST /stripe/portal
 * Creates a Stripe Customer Portal session so users can manage their subscription.
 */
export async function customerPortal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        const [sub] = await db
            .select({ stripeCustomerId: subscriptions.stripeCustomerId, plan: subscriptions.plan })
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId));

        if (!sub?.stripeCustomerId) {
            return res.status(400).json({
                error: 'No tienes una suscripción activa de Stripe. Suscríbete primero al plan Pro.'
            });
        }

        const url = await createPortalSession(sub.stripeCustomerId);
        res.json({ url });
    } catch (error) {
        next(error);
    }
}
