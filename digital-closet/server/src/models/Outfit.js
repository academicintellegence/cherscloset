import mongoose from 'mongoose';

// An outfit is just a list of item ids; the client places them by category and re-fits them to any avatar.
const outfitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    tags: { type: [String], default: [] },
    favorite: { type: Boolean, default: false },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  },
  { timestamps: true }
);

outfitSchema.index({ userId: 1, updatedAt: -1 });

export const Outfit = mongoose.model('Outfit', outfitSchema);

export const publicOutfit = (o) => ({
  id: o._id.toString(),
  name: o.name,
  tags: o.tags,
  favorite: o.favorite,
  itemIds: o.items.map(String),
  updatedAt: o.updatedAt,
});
