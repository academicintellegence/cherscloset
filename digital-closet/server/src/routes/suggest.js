import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { Item } from '../models/Item.js';
import { SuggestCache } from '../models/SuggestCache.js';
import { giveBack, takeUse, today, usedToday } from '../models/Usage.js';
import { AI_USER_DAILY_LIMIT, OCCASIONS, WEATHER_BUCKETS } from '../constants.js';
import { requireAuth } from '../middleware/auth.js';
import { suggestLimiter } from '../middleware/limits.js';
import { validate } from '../middleware/validate.js';
import { askGemini } from '../gemini.js';
import { buildPrompt, extractJson, pickValid } from '../outfitAi.js';

const router = Router();
router.use(requireAuth);

const aiConfigured = Boolean(config.GEMINI_API_KEY) && config.AI_GLOBAL_DAILY_CAP > 0;
const left = (used) => Math.max(0, AI_USER_DAILY_LIMIT - used);

const bodySchema = z.object({
  occasion: z.enum(OCCASIONS),
  weather: z.object({ bucket: z.enum(WEATHER_BUCKETS), rainy: z.boolean() }).nullish(),
});
// What we accept back from the model; pickValid then checks the items themselves.
const outputSchema = z.object({
  outfits: z.array(z.object({ items: z.array(z.string().max(10)).min(2).max(7), why: z.string().max(2000) })).min(1).max(6),
});

// Remaining uses for the UI.
router.get('/usage', async (req, res) => {
  const date = today();
  const [used, globalUsed] = await Promise.all([usedToday(date, req.userId), usedToday(date, null)]);
  res.json({
    enabled: aiConfigured,
    limit: AI_USER_DAILY_LIMIT,
    remaining: left(used),
    available: aiConfigured && globalUsed < config.AI_GLOBAL_DAILY_CAP,
  });
});

// Never fails visibly: when AI cannot answer, `ideas` is null with a reason and the client shows the rules-based ideas.
router.post('/', suggestLimiter, validate(bodySchema), async (req, res) => {
  const { occasion, weather } = req.body;
  const date = today();
  const used = await usedToday(date, req.userId);
  const none = (reason, usedNow = used) => res.json({ ideas: null, reason, remaining: left(usedNow) });
  if (!aiConfigured) return none('unavailable');

  const items = (await Item.find({ userId: req.userId }).select('category color style pattern season').lean()).map((i) => ({
    id: String(i._id), category: i.category, color: i.color, style: i.style, pattern: i.pattern, season: i.season,
  }));
  const cats = new Set(items.map((i) => i.category));
  if (!cats.has('dress') && !(cats.has('top') && cats.has('bottom'))) return none('closet');

  // Same closet + weather bucket + occasion = same answer, and it costs no quota.
  const weatherKey = weather ? `${weather.bucket}-${weather.rainy ? 'wet' : 'dry'}` : 'none';
  const key = crypto.createHash('sha256').update(JSON.stringify([items.map((i) => i.id).sort(), weatherKey, occasion])).digest('hex');
  const cached = await SuggestCache.findOne({ key }).lean();
  if (cached) return res.json({ ideas: cached.ideas, source: 'cache', remaining: left(used) });

  const userCount = await takeUse(date, req.userId, AI_USER_DAILY_LIMIT);
  if (userCount === null) return none('user_limit', AI_USER_DAILY_LIMIT);
  if ((await takeUse(date, null, config.AI_GLOBAL_DAILY_CAP)) === null) {
    await giveBack(date, req.userId);
    return none('global_limit');
  }

  try {
    const { prompt, refs } = buildPrompt({ items, occasion, weather });
    const parsed = outputSchema.parse(extractJson(await askGemini(prompt)));
    const ideas = pickValid(parsed.outfits, refs);
    if (ideas.length === 0) throw new Error('No valid outfits in the model reply');
    await SuggestCache.updateOne(
      { key },
      { $set: { userId: req.userId, ideas, expiresAt: new Date(Date.now() + 24 * 3600 * 1000) } },
      { upsert: true }
    ).catch(() => {}); // a cache write failure must not lose a good answer
    res.json({ ideas, source: 'ai', remaining: left(userCount) });
  } catch (err) {
    console.error('AI suggest failed:', err.message); // message only: never log prompts, keys or tags
    // A failed call must not use up anyone's quota.
    await Promise.all([giveBack(date, req.userId), giveBack(date, null)]).catch(() => {});
    none('error');
  }
});

export default router;
