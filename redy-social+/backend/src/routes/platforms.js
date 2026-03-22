import { Router } from 'express';
import * as platformsController from '../controllers/platformsController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get all supported platforms
router.get('/', platformsController.getSupportedPlatforms);

// Get platform details
router.get('/:platform', platformsController.getPlatformDetails);

// Get N8N configurations
router.get('/n8n/configs', platformsController.getN8NConfigurations);

// Save N8N configuration
router.post('/n8n/configs', platformsController.saveN8NConfiguration);

// Test N8N webhook
router.post('/n8n/test', platformsController.testN8NWebhook);

export default router;
