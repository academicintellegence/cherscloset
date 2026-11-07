import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false };

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { error: 'Too many requests, slow down a little' },
});

// Stricter limit for login/register to slow down password guessing.
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many attempts, try again in a few minutes' },
});

// Each AI request can spend daily quota, so keep bursts small.
export const suggestLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many suggestion requests, try again later' },
});

// Upload signatures are cheap but each one leads to a Cloudinary upload, so cap them per hour.
export const uploadLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: { error: 'Upload limit reached, try again later' },
});
