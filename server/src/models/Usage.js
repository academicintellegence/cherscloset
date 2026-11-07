import mongoose from 'mongoose';

// Daily counters for AI calls: one document per user per UTC date, plus one with userId null for the global cap.
const usageSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD (UTC)
  userId: { type: mongoose.Schema.Types.ObjectId },
  count: Number, // no default: it is created by $inc, a default would conflict with it
  expiresAt: Date, // old counters delete themselves, keeping the free Atlas cluster small
});
usageSchema.index({ date: 1, userId: 1 }, { unique: true });
usageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Usage = mongoose.model('Usage', usageSchema);

export const today = () => new Date().toISOString().slice(0, 10);

/** Atomically uses one unit of a daily cap. Returns the new count, or null when the cap is reached. */
export async function takeUse(date, userId, cap) {
  if (cap <= 0) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // When the counter is already full the filter misses, the upsert tries to insert, and the unique index rejects it.
      const doc = await Usage.findOneAndUpdate(
        { date, userId, count: { $lt: cap } },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000) } },
        { upsert: true, new: true }
      );
      return doc.count;
    } catch (e) {
      if (e.code !== 11000) throw e;
      // Either the cap is reached, or two requests raced to create the counter: the retry tells them apart.
    }
  }
  return null;
}

export const giveBack = (date, userId) =>
  Usage.updateOne({ date, userId, count: { $gt: 0 } }, { $inc: { count: -1 } });

export async function usedToday(date, userId) {
  const doc = await Usage.findOne({ date, userId });
  return doc?.count ?? 0;
}
