import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import { apiLimiter } from './middleware/limits.js';
import accountRoutes from './routes/account.js';
import authRoutes from './routes/auth.js';
import avatarRoutes from './routes/avatars.js';
import itemRoutes from './routes/items.js';
import outfitRoutes from './routes/outfits.js';
import suggestRoutes from './routes/suggest.js';
import uploadRoutes from './routes/uploads.js';

const app = express();

app.set('trust proxy', 1); // Render sits behind one proxy; needed for correct rate-limit IPs
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = curl/health checks; browsers always send one.
      if (!origin || config.clientOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Origin not allowed'));
    },
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.use('/api', apiLimiter);
app.use('/api', (_req, res, next) => (res.set('Cache-Control', 'no-store'), next())); // personal data: never cached
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/suggest', suggestRoutes);
app.use('/api/uploads', uploadRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Rejected promises in async routes reach this handler via express-async-errors (imported in index.js).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.message === 'Origin not allowed') return res.status(403).json({ error: err.message });
  if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: 'Invalid request' }); // e.g. malformed JSON, body too large
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
