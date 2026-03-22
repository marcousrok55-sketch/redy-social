import { Router } from 'express';
import * as websiteController from '../controllers/websiteController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get all website configurations
router.get('/configs', websiteController.getWebsiteConfigs);

// Save website configuration
router.post('/configs', websiteController.saveWebsiteConfig);

// Test website connection
router.post('/configs/:id/test', websiteController.testWebsiteConnection);

// Delete website configuration
router.delete('/configs/:id', websiteController.deleteWebsiteConfig);

// Publish to website
router.post('/publish', websiteController.publishToWebsite);

export default router;
