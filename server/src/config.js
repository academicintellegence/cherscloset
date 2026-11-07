import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  // Comma-separated list of allowed frontend origins (scheme + host, no path).
  CLIENT_ORIGIN: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
  CLOUDINARY_API_KEY: z.string().trim().min(1),
  CLOUDINARY_API_SECRET: z.string().trim().min(1),
  // Optional: without a key the app simply uses the rules-based recommender.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  AI_GLOBAL_DAILY_CAP: z.coerce.number().int().min(0).default(200), // AI calls per day across all users
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((s) => s.trim().replace(/\/$/, '')),
};
