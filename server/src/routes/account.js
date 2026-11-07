import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User, publicUser } from '../models/User.js';
import { Item, publicItem } from '../models/Item.js';
import { Avatar, publicAvatar } from '../models/Avatar.js';
import { Outfit } from '../models/Outfit.js';
import { Usage } from '../models/Usage.js';
import { SuggestCache } from '../models/SuggestCache.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/limits.js';
import { destroyAsset, destroyUserFolder } from '../cloudinary.js';

const router = Router();
router.use(requireAuth);

const confirmSchema = z.object({ password: z.string().min(1).max(72) });

// Deleting is permanent, so ask for the password again (a stolen token alone is not enough).
async function confirmed(req, res) {
  const user = await User.findById(req.userId);
  if (user && (await bcrypt.compare(req.body.password, user.passwordHash))) return true;
  res.status(401).json({ error: 'Wrong password' });
  return false;
}

// Cloudinary first (needs the ids from Mongo), then every database record.
async function wipeData(userId) {
  const items = await Item.find({ userId }).select('publicId').lean();
  for (let i = 0; i < items.length; i += 10) {
    await Promise.all(items.slice(i, i + 10).map((it) => destroyAsset(it.publicId)));
  }
  await destroyUserFolder(userId); // sweeps anything left, e.g. uploads that were never saved as items
  await Promise.all([
    Item.deleteMany({ userId }),
    Avatar.deleteMany({ userId }),
    Outfit.deleteMany({ userId }),
    Usage.deleteMany({ userId }),
    SuggestCache.deleteMany({ userId }),
  ]);
}

// A copy of everything stored about the account (no password hash).
router.get('/export', async (req, res) => {
  const [user, items, avatars, outfits] = await Promise.all([
    User.findById(req.userId),
    Item.find({ userId: req.userId }),
    Avatar.find({ userId: req.userId }),
    Outfit.find({ userId: req.userId }).lean(),
  ]);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  res.json({
    exportedAt: new Date().toISOString(),
    user: publicUser(user),
    items: items.map(publicItem),
    avatars: avatars.map(publicAvatar),
    outfits: outfits.map((o) => ({ name: o.name, tags: o.tags, favorite: o.favorite, items: o.items.map(String) })),
  });
});

// Empties the closet, avatars, outfits and AI history but keeps the login.
router.delete('/data', authLimiter, validate(confirmSchema), async (req, res) => {
  if (!(await confirmed(req, res))) return;
  await wipeData(req.userId);
  res.json({ ok: true });
});

router.delete('/', authLimiter, validate(confirmSchema), async (req, res) => {
  if (!(await confirmed(req, res))) return;
  await wipeData(req.userId);
  await User.deleteOne({ _id: req.userId });
  res.json({ ok: true });
});

export default router;
