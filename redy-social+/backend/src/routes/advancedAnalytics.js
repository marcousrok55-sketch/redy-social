import { Router } from 'express';
import * as advancedAnalyticsController from '../controllers/advancedAnalyticsController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get optimal posting times
router.get('/optimal-times', advancedAnalyticsController.getOptimalTimes);

// Get content performance by type
router.get('/content-performance', advancedAnalyticsController.getContentPerformance);

// Get hashtag performance
router.get('/hashtag-performance', advancedAnalyticsController.getHashtagPerformance);

// Export report
router.get('/export', advancedAnalyticsController.exportReport);

export default router;
