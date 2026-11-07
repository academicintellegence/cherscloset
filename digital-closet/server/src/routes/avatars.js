import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Avatar, publicAvatar } from '../models/Avatar.js';
import { AVATAR_RANGES as R, BODIES, MAX_AVATARS } from '../constants.js';
import { requireAuth } from '../middleware/auth.js';
import { cleanString } from '../text.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const range = (key) => z.number().min(R[key][0], 'Value out of range').max(R[key][1], 'Value out of range');
const fields = {
  name: cleanString(40, 'Enter a name'),
  body: z.enum(BODIES),
  height: range('height'),
  width: range('width'),
  legs: range('legs'),
};
const createSchema = z.object(fields);
const updateSchema = z
  .object(fields)
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ error: 'Avatar not found' });

const fullError = { error: `You already have ${MAX_AVATARS} avatars. Delete one first.` };
const atCap = async (userId) => (await Avatar.countDocuments({ userId })) >= MAX_AVATARS;

router.get('/', async (req, res) => {
  const avatars = await Avatar.find({ userId: req.userId }).sort({ createdAt: 1 });
  res.json({ avatars: avatars.map(publicAvatar), max: MAX_AVATARS });
});

router.post('/', validate(createSchema), async (req, res) => {
  if (await atCap(req.userId)) return res.status(403).json(fullError);
  const avatar = await Avatar.create({ ...req.body, userId: req.userId });
  res.status(201).json({ avatar: publicAvatar(avatar) });
});

router.patch('/:id', validId, validate(updateSchema), async (req, res) => {
  const avatar = await Avatar.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
  if (!avatar) return res.status(404).json({ error: 'Avatar not found' });
  res.json({ avatar: publicAvatar(avatar) });
});

router.post('/:id/duplicate', validId, async (req, res) => {
  const src = await Avatar.findOne({ _id: req.params.id, userId: req.userId });
  if (!src) return res.status(404).json({ error: 'Avatar not found' });
  if (await atCap(req.userId)) return res.status(403).json(fullError);
  const copy = await Avatar.create({
    userId: req.userId,
    name: `${src.name} copy`.slice(0, 40),
    body: src.body,
    height: src.height,
    width: src.width,
    legs: src.legs,
  });
  res.status(201).json({ avatar: publicAvatar(copy) });
});

router.delete('/:id', validId, async (req, res) => {
  const avatar = await Avatar.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!avatar) return res.status(404).json({ error: 'Avatar not found' });
  res.json({ ok: true });
});

export default router;
