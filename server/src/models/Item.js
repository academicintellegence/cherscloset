import mongoose from 'mongoose';
import { CATEGORIES, FIT_LIMITS as L, PATTERNS, SEASONS, STYLES } from '../constants.js';

const itemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, enum: CATEGORIES, required: true },
    color: { type: String, required: true, match: /^#[0-9a-f]{6}$/ }, // dominant color, lowercase hex
    // Optional tags ('' = not set). Suggested by the in-browser CLIP model, corrected by the user.
    style: { type: String, enum: [...STYLES, ''], default: '' },
    pattern: { type: String, enum: [...PATTERNS, ''], default: '' },
    season: { type: String, enum: [...SEASONS, ''], default: '' },
    imageUrl: { type: String, required: true, maxlength: 500 }, // Cloudinary delivery URL (image itself is never stored in Mongo)
    publicId: { type: String, required: true, maxlength: 200 }, // Cloudinary id, needed to delete the asset
    fit: {
      dx: { type: Number, default: 0, min: -L.offset, max: L.offset },
      dy: { type: Number, default: 0, min: -L.offset, max: L.offset },
      scale: { type: Number, default: 1, min: L.scale[0], max: L.scale[1] },
      rot: { type: Number, default: 0, min: -L.rot, max: L.rot },
    },
  },
  { timestamps: true }
);

itemSchema.index({ userId: 1, createdAt: -1 });

export const Item = mongoose.model('Item', itemSchema);

export const publicItem = (i) => ({
  id: i._id.toString(),
  name: i.name,
  category: i.category,
  color: i.color,
  style: i.style || '',
  pattern: i.pattern || '',
  season: i.season || '',
  imageUrl: i.imageUrl,
  fit: { dx: i.fit?.dx ?? 0, dy: i.fit?.dy ?? 0, scale: i.fit?.scale ?? 1, rot: i.fit?.rot ?? 0 },
  createdAt: i.createdAt,
});
