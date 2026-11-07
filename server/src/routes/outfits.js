import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Outfit, publicOutfit } from '../models/Outfit.js';
import { Item } from '../models/Item.js';
import { CATEGORIES, MAX_OUTFITS } from '../constants.js';
import { requireAuth } from '../middleware/auth.js';
import { cleanString } from '../text.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const fields = {
  name: cleanString(60, 'Enter a name'),
  tags: z
    .array(cleanString(20, 'Tags cannot be empty').transform((t) => t.toLowerCase()))
    .max(8, 'Up to 8 tags')
    .transform((t) => [...new Set(t)]),
  favorite: z.boolean(),
  // One piece per category at most, so an outfit never has more pieces than categories.
  items: z
    .array(z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid item'))
    .min(1, 'Add at least one piece')
    .max(CATEGORIES.length),
};
const createSchema = z.object({ ...fields, tags: fields.tags.default([]), favorite: fields.favorite.default(false) });
const updateSchema = z
  .object(fields)
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ error: 'Outfit not found' });

// Every item must be unique and belong to this user.
async function ownsItems(userId, ids) {
  if (new Set(ids).size !== ids.length) return false;
  return (await Item.countDocuments({ userId, _id: { $in: ids } })) === ids.length;
}
const badItems = { error: 'Some pieces are no longer in your closet' };

router.get('/', async (req, res) => {
  const outfits = await Outfit.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json({ outfits: outfits.map(publicOutfit), max: MAX_OUTFITS });
});

router.get('/:id', validId, async (req, res) => {
  const outfit = await Outfit.findOne({ _id: req.params.id, userId: req.userId });
  if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
  res.json({ outfit: publicOutfit(outfit) });
});

router.post('/', validate(createSchema), async (req, res) => {
  if ((await Outfit.countDocuments({ userId: req.userId })) >= MAX_OUTFITS) {
    return res.status(403).json({ error: `You already have ${MAX_OUTFITS} saved outfits. Delete one first.` });
  }
  if (!(await ownsItems(req.userId, req.body.items))) return res.status(400).json(badItems);
  const outfit = await Outfit.create({ ...req.body, userId: req.userId });
  res.status(201).json({ outfit: publicOutfit(outfit) });
});

router.patch('/:id', validId, validate(updateSchema), async (req, res) => {
  if (req.body.items && !(await ownsItems(req.userId, req.body.items))) return res.status(400).json(badItems);
  const outfit = await Outfit.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
  if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
  res.json({ outfit: publicOutfit(outfit) });
});

router.delete('/:id', validId, async (req, res) => {
  const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
  res.json({ ok: true });
});

export default router;
