import { Router } from 'express';
import { body, param } from 'express-validator';
import * as postsController from '../controllers/postsController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Get all posts
router.get('/', postsController.getPosts);

// Create post
router.post('/',
  body('content').trim().notEmpty(),
  body('platform').isIn(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']),
  postsController.createPost
);

// Bulk create posts
router.post('/bulk', postsController.bulkCreatePosts);

// Publish post
router.post('/:id/publish', param('id').isUUID(), postsController.publishPost);

// Update post
router.put('/:id', param('id').isUUID(), postsController.updatePost);

// Delete post
router.delete('/:id', param('id').isUUID(), postsController.deletePost);

export default router;
