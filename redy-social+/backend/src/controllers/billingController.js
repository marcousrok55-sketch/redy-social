import Stripe from 'stripe';
import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get subscription details
export const getSubscription = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const result = await query(
      'SELECT * FROM subscriptions WHERE workspace_id = $1',
      [workspaceId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        subscription: null, 
        plan: 'free',
        features: getPlanFeatures('free')
      });
    }

    const subscription = result.rows[0];
    res.json({ 
      subscription,
      plan: subscription.plan,
      features: getPlanFeatures(subscription.plan)
    });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

// Create checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { priceId, plan } = req.body;

    const priceIds = {
      pro: 'price_pro_monthly',
      agency: 'price_agency_monthly'
    };

    const selectedPriceId = priceIds[plan] || priceIds.pro;

    // Get or create Stripe customer
    let customerId = null;
    const subResult = await query(
      'SELECT stripe_customer_id FROM subscriptions WHERE workspace_id = $1',
      [workspaceId]
    );

    if (subResult.rows.length > 0 && subResult.rows[0].stripe_customer_id) {
      customerId = subResult.rows[0].stripe_customer_id;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { workspaceId }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/settings?success=subscribed`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?canceled=true`,
      metadata: { workspaceId, plan }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const subResult = await query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE workspace_id = $1 AND status = $2',
      [workspaceId, 'active']
    );

    if (subResult.rows.length === 0 || !subResult.rows[0].stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    await stripe.subscriptions.cancel(subResult.rows[0].stripe_subscription_id);

    await query(
      'UPDATE subscriptions SET status = $1 WHERE workspace_id = $2',
      ['canceled', workspaceId]
    );

    await query(
      'UPDATE workspaces SET plan = $1 WHERE id = $2',
      ['free', workspaceId]
    );

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Handle Stripe webhooks
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const workspaceId = session.metadata.workspaceId;
      const plan = session.metadata.plan;

      await query(
        `INSERT INTO subscriptions (workspace_id, stripe_subscription_id, plan, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '30 days')
         ON CONFLICT (workspace_id) DO UPDATE SET
           stripe_subscription_id = $2,
           plan = $3,
           status = $4,
           current_period_start = NOW(),
           current_period_end = NOW() + INTERVAL '30 days'`,
        [workspaceId, session.subscription, plan, 'active']
      );

      await query(
        'UPDATE workspaces SET plan = $1 WHERE id = $2',
        [plan, workspaceId]
      );

      logger.info(`Subscription activated for workspace ${workspaceId}: ${plan}`);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      logger.info('Subscription updated:', subscription.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await query(
        'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
        ['canceled', subscription.id]
      );
      logger.info('Subscription canceled:', subscription.id);
      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// Plan features helper
function getPlanFeatures(plan) {
  const features = {
    free: {
      accounts: 2,
      scheduledPosts: 10,
      analytics: false,
      aiAssistant: false,
      inbox: true,
      teamMembers: 1,
      price: 0
    },
    pro: {
      accounts: 5,
      scheduledPosts: -1, // unlimited
      analytics: true,
      aiAssistant: true,
      inbox: true,
      teamMembers: 3,
      price: 29
    },
    agency: {
      accounts: -1, // unlimited
      scheduledPosts: -1,
      analytics: true,
      aiAssistant: true,
      inbox: true,
      teamMembers: -1,
      price: 99
    }
  };

  return features[plan] || features.free;
}
