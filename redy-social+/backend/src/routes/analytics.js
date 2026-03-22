import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get overview analytics
router.get('/overview', analyticsController.getOverview);

// Get platform-specific analytics
router.get('/:platform', analyticsController.getPlatformAnalytics);

// Get competitors
router.get('/competitors/list', analyticsController.getCompetitors);

// Add competitor
router.post('/competitors', analyticsController.addCompetitor);

// Remove competitor
router.delete('/competitors/:id', analyticsController.removeCompetitor);

export default router;
