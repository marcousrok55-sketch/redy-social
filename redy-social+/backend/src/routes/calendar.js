import { Router } from 'express';
import { body, param } from 'express-validator';
import * as calendarController from '../controllers/calendarController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get calendar data
router.get('/', calendarController.getCalendar);

// Move post (drag & drop)
router.put('/:postId/move', 
  param('postId').isUUID(),
  body('scheduledAt').isISO8601(),
  calendarController.movePost
);

export default router;
