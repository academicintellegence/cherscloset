import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const signToken = (userId) =>
  jwt.sign({ sub: userId }, config.JWT_SECRET, { expiresIn: '7d' });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    req.userId = jwt.verify(token, config.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}
