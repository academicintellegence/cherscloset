import { Router } from 'express';
import { Item } from '../models/Item.js';
import { MAX_ITEMS } from '../constants.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/limits.js';
import { signUpload } from '../cloudinary.js';

const router = Router();

// Hands out a short-lived signature so the browser can upload directly to Cloudinary.
router.post('/sign', requireAuth, uploadLimiter, async (req, res) => {
  if ((await Item.countDocuments({ userId: req.userId })) >= MAX_ITEMS) {
    return res.status(403).json({ error: `Your closet is full (${MAX_ITEMS} items). Delete something first.` });
  }
  res.json(signUpload(req.userId));
});

export default router;
