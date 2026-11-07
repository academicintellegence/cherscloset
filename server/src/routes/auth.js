import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User, publicUser } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { cleanString } from '../text.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/limits.js';

const router = Router();

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(254);
const password = z.string().min(8, 'Password must be at least 8 characters').max(72);

const registerSchema = z.object({
  email,
  password,
  displayName: cleanString(40, 'Enter a display name'),
});
const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

// Used to keep login timing similar when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { email, password, displayName } = req.body;
  if (await User.exists({ email })) {
    return res.status(409).json({ error: 'That email is already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, displayName });
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: signToken(user.id), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  res.json({ user: publicUser(user) });
});

export default router;
