import { Router } from 'express';
import { body } from 'express-validator';
import * as billingController from '../controllers/billingController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get subscription
router.get('/subscription', billingController.getSubscription);

// Create checkout session
router.post('/checkout', 
  body('priceId').trim().notEmpty(),
  billingController.createCheckoutSession
);

// Cancel subscription
router.post('/cancel', billingController.cancelSubscription);

// Webhook handler (no auth)
router.post('/webhook', billingController.handleWebhook);

export default router;
