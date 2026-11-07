import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true, maxlength: 40 },
    homeCity: { type: String, trim: true, maxlength: 80, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = mongoose.model('User', userSchema);

export const publicUser = (u) => ({
  id: u._id.toString(),
  email: u.email,
  displayName: u.displayName,
  homeCity: u.homeCity,
});
