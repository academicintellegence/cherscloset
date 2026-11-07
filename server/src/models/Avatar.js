import mongoose from 'mongoose';
import { AVATAR_RANGES as R, BODIES } from '../constants.js';

const factor = (key) => ({ type: Number, required: true, min: R[key][0], max: R[key][1] });

// An avatar is just a few numbers; the client draws the mannequin from them.
const avatarSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    body: { type: String, enum: BODIES, required: true },
    height: factor('height'), // overall size
    width: factor('width'), // body width (also drives the size presets)
    legs: factor('legs'), // >1 = longer legs and shorter torso
  },
  { timestamps: true }
);

avatarSchema.index({ userId: 1, createdAt: 1 });

export const Avatar = mongoose.model('Avatar', avatarSchema);

export const publicAvatar = (a) => ({
  id: a._id.toString(),
  name: a.name,
  body: a.body,
  height: a.height,
  width: a.width,
  legs: a.legs,
});
