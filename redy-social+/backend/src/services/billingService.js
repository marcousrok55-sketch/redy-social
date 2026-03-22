import Stripe from 'stripe';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription plans
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Up to 3 social accounts',
      '10 scheduled posts per month',
      'Basic analytics',
      '1 team member'
    ],
    limits: {
      accounts: 3,
      postsPerMonth: 10,
      teamMembers: 1,
      aiGenerations: 5
    }
  },
  pro: {
    name: 'Pro',
    price: 2900, // $29.00 in cents
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Up to 10 social accounts',
      'Unlimited scheduled posts',
      'Advanced analytics',
      'AI content assistant',
      '5 team members',
      'Priority support'
    ],
    limits: {
      accounts: 10,
      postsPerMonth: -1, // unlimited
      teamMembers: 5,
      aiGenerations: 100
    }
  },
  agency: {
    name: 'Agency',
    price: 9900, // $99.00 in cents
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID,
    features: [
      'Unlimited social accounts',
      'Unlimited scheduled posts',
      'Full analytics suite',
      'AI content assistant',
      'Unlimited team members',
      'White-label reports',
      'API access',
      'Priority support'
    ],
    limits: {
      accounts: -1, // unlimited
      postsPerMonth: -1,
      teamMembers: -1,
      aiGenerations: -1
    }
  }
};

// Create checkout session
export async function createCheckoutSession(workspaceId, plan, successUrl, cancelUrl) {
  try {
    const planDetails = PLANS[plan];
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planDetails.stripePriceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspaceId
      }
    });

    return session;
  } catch (error) {
    logger.error('Stripe checkout error:', error);
    throw error;
  }
}

// Create customer
export async function createCustomer(workspaceId, email, name) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        workspaceId
      }
    });

    // Save customer ID to database
    await query(
      'UPDATE workspaces SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, workspaceId]
    );

    return customer;
  } catch (error) {
    logger.error('Stripe customer creation error:', error);
    throw error;
  }
}

// Get subscription
export async function getSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    logger.error('Get subscription error:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    throw error;
  }
}

// Update subscription (change plan)
export async function updateSubscription(subscriptionId, newPriceId) {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });
  } catch (error) {
    logger.error('Update subscription error:', error);
    throw error;
  }
}

// Handle webhook
export async function handleWebhook(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    throw error;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await handleSubscriptionCancelled(subscription);
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await handlePaymentFailed(invoice);
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      await handlePaymentSuccess(invoice);
      break;
    }
  }

  return { received: true };
}

async function handleCheckoutComplete(session) {
  const workspaceId = session.metadata.workspaceId;
  const subscriptionId = session.subscription;
  
  await query(
    `INSERT INTO subscriptions (workspace_id, stripe_subscription_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 month')
     ON CONFLICT (workspace_id) DO UPDATE 
     SET stripe_subscription_id = $2, status = 'active'`,
    [workspaceId, subscriptionId]
  );
  
  logger.info(`Checkout completed for workspace ${workspaceId}`);
}

async function handleSubscriptionUpdate(subscription) {
  const status = subscription.status === 'active' ? 'active' : subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  await query(
    `UPDATE subscriptions 
     SET status = $1, current_period_start = $2, current_period_end = $3
     WHERE stripe_subscription_id = $4`,
    [status, currentPeriodStart, currentPeriodEnd, subscription.id]
  );
  
  logger.info(`Subscription ${subscription.id} updated: ${status}`);
}

async function handleSubscriptionCancelled(subscription) {
  await query(
    `UPDATE subscriptions 
     SET status = 'cancelled'
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );
  
  logger.info(`Subscription ${subscription.id} cancelled`);
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  // Find workspace and notify
  const result = await query(
    'SELECT id FROM workspaces WHERE stripe_customer_id = $1',
    [customerId]
  );
  
  if (result.rows.length > 0) {
    const workspaceId = result.rows[0].id;
    logger.warn(`Payment failed for workspace ${workspaceId}`);
    // Could trigger notification here
  }
}

async function handlePaymentSuccess(invoice) {
  const customerId = invoice.customer;
  
  const result = await query(
    'SELECT id FROM workspaces WHERE stripe_customer_id = $1',
    [customerId]
  );
  
  if (result.rows.length > 0) {
    const workspaceId = result.rows[0].id;
    logger.info(`Payment succeeded for workspace ${workspaceId}`);
    // Could trigger notification here
  }
}

// Check plan limits
export async function checkPlanLimits(workspaceId, resource, currentCount) {
  const result = await query(
    'SELECT plan FROM workspaces WHERE id = $1',
    [workspaceId]
  );
  
  if (result.rows.length === 0) {
    return { allowed: false, reason: 'Workspace not found' };
  }
  
  const plan = result.rows[0].plan || 'free';
  const planLimits = PLANS[plan]?.limits;
  
  if (!planLimits) {
    return { allowed: false, reason: 'Invalid plan' };
  }
  
  const limit = planLimits[resource];
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, plan };
  }
  
  if (currentCount >= limit) {
    return { 
      allowed: false, 
      reason: `Limit reached for ${resource}. Upgrade to ${plan === 'free' ? 'Pro' : 'Agency'} plan.`,
      current: currentCount,
      limit,
      plan
    };
  }
  
  return { allowed: true, plan };
}

// Get billing portal URL
export async function createBillingPortalSession(workspaceId, returnUrl) {
  const result = await query(
    'SELECT stripe_customer_id FROM workspaces WHERE id = $1',
    [workspaceId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
    throw new Error('No billing account found');
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: result.rows[0].stripe_customer_id,
    return_url: returnUrl
  });
  
  return session;
}

export default {
  stripe,
  PLANS,
  createCheckoutSession,
  createCustomer,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  handleWebhook,
  checkPlanLimits,
  createBillingPortalSession
};
