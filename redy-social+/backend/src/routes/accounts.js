import { Router } from 'express';
import { body, param } from 'express-validator';
import * as accountsController from '../controllers/accountsController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get all accounts
router.get('/', accountsController.getAccounts);

// Connect new account
router.post('/connect/:platform', 
  param('platform').isIn(['meta', 'twitter', 'linkedin', 'tiktok', 'youtube']),
  accountsController.connectAccount
);

// OAuth callback (no auth required)
router.get('/callback/:platform', accountsController.handleCallback);

// Disconnect account
router.delete('/:id', 
  param('id').isUUID(),
  accountsController.disconnectAccount
);

// Get account analytics
router.get('/:id/analytics', 
  param('id').isUUID(),
  accountsController.getAccountAnalytics
);

export default router;
