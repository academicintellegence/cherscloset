import mongoose from 'mongoose';
import { AVATAR_DEFAULTS, AVATAR_RANGES as R, BODIES } from '../constants.js';

const cm = (key) => ({ type: Number, min: R[key][0], max: R[key][1] });

// An avatar is a few real measurements in cm; the client draws the body from them.
// height/width/legs are the old relative sliders. They are kept so avatars saved before
// the cm update still load (measurementsOf converts them), and are no longer written.
const avatarSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    body: { type: String, enum: BODIES, required: true },
    ...Object.fromEntries(Object.keys(R).map((k) => [k, cm(k)])),
    height: { type: Number, default: 1 },
    width: { type: Number, default: 1 },
    legs: { type: Number, default: 1 },
  },
  { timestamps: true }
);

avatarSchema.index({ userId: 1, createdAt: 1 });

export const Avatar = mongoose.model('Avatar', avatarSchema);

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));

/** Real measurements for an avatar, converting old relative-slider avatars when needed. */
export function measurementsOf(a) {
  const d = AVATAR_DEFAULTS[a.body] || AVATAR_DEFAULTS.female;
  const h = a.height ?? 1;
  const w = a.width ?? 1;
  const old = {
    heightCm: d.heightCm * h,
    shoulderCm: d.shoulderCm * w,
    bustCm: d.bustCm * w,
    waistCm: d.waistCm * w,
    hipsCm: d.hipsCm * w,
    inseamCm: d.inseamCm * h * (a.legs ?? 1),
  };
  return Object.fromEntries(Object.keys(R).map((k) => [k, a[k] != null ? a[k] : clamp(Math.round(old[k]), R[k])]));
}

export const publicAvatar = (a) => ({
  id: a._id.toString(),
  name: a.name,
  body: a.body,
  ...measurementsOf(a),
});
