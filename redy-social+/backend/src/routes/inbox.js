import { Router } from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import * as inboxController from '../controllers/inboxController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get inbox messages
router.get('/', inboxController.getMessages);

// Mark as read
router.put('/:id/read', param('id').isUUID(), inboxController.markAsRead);

// Mark as starred
router.put('/:id/star', param('id').isUUID(), inboxController.markAsStarred);

// Reply to message
router.post('/:id/reply', 
  param('id').isUUID(),
  body('content').trim().notEmpty(),
  inboxController.replyToMessage
);

// Get quick replies
router.get('/quick-replies', inboxController.getQuickReplies);

// Create quick reply
router.post('/quick-replies',
  body('title').trim().notEmpty(),
  body('content').trim().notEmpty(),
  inboxController.createQuickReply
);

// Delete quick reply
router.delete('/quick-replies/:id', param('id').isUUID(), inboxController.deleteQuickReply);

export default router;
