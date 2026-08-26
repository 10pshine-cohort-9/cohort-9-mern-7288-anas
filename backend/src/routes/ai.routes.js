import express from 'express';
import { getAutocompleteSuggestion } from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { globalLimiter } from '../middlewares/rateLimiter.middleware.js'; // Optional: Use your existing global limiter

const router = express.Router();

router.post('/autocomplete', verifyJWT, globalLimiter, getAutocompleteSuggestion);

export default router;