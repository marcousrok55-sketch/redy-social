import { Router } from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/aiController.js';
import { authenticate, workspaceAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(workspaceAccess);

// Generate content
router.post('/generate', 
  body('prompt').optional(),
  body('url').optional(),
  body('platform').optional(),
  body('tone').optional(),
  aiController.generateContent
);

// Improve content
router.post('/improve',
  body('content').trim().notEmpty(),
  body('improvementType').optional(),
  aiController.improveContent
);

// Translate content
router.post('/translate',
  body('content').trim().notEmpty(),
  body('targetLanguage').trim().notEmpty(),
  aiController.translateContent
);

// Get hashtag suggestions
router.get('/hashtags',
  aiController.getHashtagSuggestions
);

// Analyze sentiment
router.post('/sentiment',
  body('content').trim().notEmpty(),
  aiController.analyzeSentiment
);

export default router;
