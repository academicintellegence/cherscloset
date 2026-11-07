import mongoose from 'mongoose';

// Cached AI results, keyed by a hash of (item ids + weather bucket + occasion). Expires after a day.
const cacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  ideas: [{ _id: false, itemIds: [String], why: String }],
  expiresAt: { type: Date, required: true },
});
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SuggestCache = mongoose.model('SuggestCache', cacheSchema);
