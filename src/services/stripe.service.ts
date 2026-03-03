/**
 * stripe.service.ts
 * 
 * Handles all Stripe interactions for TheCookFlow Pro subscriptions (2.99€/mo).
 * 
 * Flow:
 *  1. createCheckoutSession() — called when a FREE user clicks "Upgrade to Pro".
 *     Redirects them to Stripe-hosted payment page. On success → /success?session_id=...
 *  2. handleWebhookEvent() — called by Stripe's POST webhook after payment events.
 *     Activates/cancels subscriptions in our DB based on status changes.
 */

import Stripe from 'stripe';
import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { subscriptions, users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia'
});

export interface CheckoutSessionResult {
    url: string;
    sessionId: string;
}

/**
 * Creates a Stripe Checkout Session for upgrading to the Pro plan.
 * Associates the session with our userId via client_reference_id.
 */
export async function createCheckoutSession(
    userId: number,
    userEmail: string
): Promise<CheckoutSessionResult> {
    // Check if user already has a Stripe customer ID
    const [sub] = await db
        .select({ stripeCustomerId: subscriptions.stripeCustomerId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: env.STRIPE_PRO_PRICE_ID,
                quantity: 1,
            },
        ],
        client_reference_id: String(userId),
        customer_email: sub?.stripeCustomerId ? undefined : userEmail,
        customer: sub?.stripeCustomerId || undefined,
        subscription_data: {
            trial_period_days: 14, // 14-day free trial
            metadata: { userId: String(userId) },
        },
        success_url: `${env.APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.APP_URL}/subscription/cancel`,
        metadata: { userId: String(userId) },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
        url: session.url!,
        sessionId: session.id,
    };
}

/**
 * Handles incoming Stripe webhook events.
 * Verifies the signature and updates the subscriptions table accordingly.
 */
export async function handleWebhookEvent(
    rawBody: Buffer,
    signature: string
): Promise<void> {
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.client_reference_id || '0');
            const stripeCustomerId = session.customer as string;
            const stripeSubscriptionId = session.subscription as string;

            if (!userId) break;

            // Activate Pro subscription in our DB
            await db
                .update(subscriptions)
                .set({
                    plan: 'PRO',
                    status: 'ACTIVE',
                    stripeCustomerId,
                    stripeSubscriptionId,
                    updatedAt: new Date(),
                })
                .where(eq(subscriptions.userId, userId));

            // Also mark user as premium
            await db
                .update(users)
                .set({ isPremium: true, updatedAt: new Date() })
                .where(eq(users.id, userId));

            console.log(`[Stripe] ✅ User ${userId} upgraded to PRO`);
            break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            const stripeSubId = invoice.subscription as string;

            // Renew: update period end
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
            const periodEnd = new Date(stripeSub.current_period_end * 1000);

            await db
                .update(subscriptions)
                .set({
                    status: 'ACTIVE',
                    currentPeriodEnd: periodEnd,
                    updatedAt: new Date(),
                })
                .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

            console.log(`[Stripe] 🔄 Subscription ${stripeSubId} renewed until ${periodEnd.toISOString()}`);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const stripeSubId = invoice.subscription as string;

            await db
                .update(subscriptions)
                .set({ status: 'PAST_DUE', updatedAt: new Date() })
                .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

            console.log(`[Stripe] ⚠️ Payment failed for subscription ${stripeSubId}`);
            break;
        }

        case 'customer.subscription.deleted': {
            const stripeSub = event.data.object as Stripe.Subscription;

            await db
                .update(subscriptions)
                .set({ plan: 'FREE', status: 'CANCELED', updatedAt: new Date() })
                .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));

            // Revoke premium access
            const [sub] = await db
                .select({ userId: subscriptions.userId })
                .from(subscriptions)
                .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));

            if (sub?.userId) {
                await db
                    .update(users)
                    .set({ isPremium: false, updatedAt: new Date() })
                    .where(eq(users.id, sub.userId));
            }

            console.log(`[Stripe] ❌ Subscription ${stripeSub.id} canceled`);
            break;
        }

        default:
            console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
}

/**
 * Creates a Stripe Customer Portal session so users can manage their subscription
 * (update card, cancel, see invoices) without us building that UI.
 */
export async function createPortalSession(stripeCustomerId: string): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${env.APP_URL}/settings`,
    });
    return session.url;
}

export default stripe;
