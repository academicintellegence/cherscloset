import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Item, publicItem } from '../models/Item.js';
import { Outfit } from '../models/Outfit.js';
import { CATEGORIES, FIT_LIMITS as L, MAX_ITEMS, PATTERNS, SEASONS, STYLES } from '../constants.js';
import { requireAuth } from '../middleware/auth.js';
import { cleanString } from '../text.js';
import { validate } from '../middleware/validate.js';
import { deliveryPrefix, destroyAsset, publicIdPrefix } from '../cloudinary.js';

const router = Router();
router.use(requireAuth);

const name = cleanString(60, 'Enter a name');
const category = z.enum(CATEGORIES, { errorMap: () => ({ message: 'Pick a category' }) });
const color = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'Invalid color')
  .transform((c) => c.toLowerCase());

const tag = (values) => z.enum(values).or(z.literal(''));
const tags = { style: tag(STYLES), pattern: tag(PATTERNS), season: tag(SEASONS) };

const fit = z.object({
  dx: z.number().min(-L.offset).max(L.offset),
  dy: z.number().min(-L.offset).max(L.offset),
  scale: z.number().min(L.scale[0]).max(L.scale[1]),
  rot: z.number().min(-L.rot).max(L.rot),
});

const createSchema = z.object({
  name,
  category,
  color,
  style: tags.style.optional(),
  pattern: tags.pattern.optional(),
  season: tags.season.optional(),
  imageUrl: z.string().url().max(500),
  publicId: z.string().max(200),
});
const updateSchema = z
  .object({ name, category, color, ...tags, fit })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ error: 'Item not found' });

router.get('/', async (req, res) => {
  const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ items: items.map(publicItem), max: MAX_ITEMS });
});

router.post('/', validate(createSchema), async (req, res) => {
  const { publicId, imageUrl } = req.body;
  // The image must be one we signed for this user, otherwise anyone could attach arbitrary URLs.
  // The cloud name is compared ignoring letter case, and the reason for a rejection is logged (never shown).
  const checks = {
    ownFolder: publicId.startsWith(publicIdPrefix(req.userId)),
    ourCloud: imageUrl.toLowerCase().startsWith(deliveryPrefix().toLowerCase()),
    matchesId: imageUrl.includes(`/${publicId}`),
  };
  if (!checks.ownFolder || !checks.ourCloud || !checks.matchesId) {
    console.warn('Rejected item image', checks, 'expected prefix', deliveryPrefix(), 'got', imageUrl.slice(0, 80));
    return res.status(400).json({ error: 'Invalid image' });
  }
  if ((await Item.countDocuments({ userId: req.userId })) >= MAX_ITEMS) {
    return res.status(403).json({ error: `Your closet is full (${MAX_ITEMS} items). Delete something first.` });
  }
  const item = await Item.create({ ...req.body, userId: req.userId });
  res.status(201).json({ item: publicItem(item) });
});

router.patch('/:id', validId, validate(updateSchema), async (req, res) => {
  const item = await Item.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ item: publicItem(item) });
});

router.delete('/:id', validId, async (req, res) => {
  const item = await Item.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await destroyAsset(item.publicId);
  await Outfit.updateMany({ userId: req.userId, items: item._id }, { $pull: { items: item._id } }); // keep saved outfits valid
  res.json({ ok: true });
});

export default router;
