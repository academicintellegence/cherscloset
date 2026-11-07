import crypto from 'node:crypto';
import { config } from './config.js';

// Cloudinary signature: sha1 of "k=v&k=v" (keys sorted) + API secret. Only the signed params are covered.
const sign = (params) => {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(str + config.CLOUDINARY_API_SECRET).digest('hex');
};

export const publicIdPrefix = (userId) => `digital-closet/${userId}/`;
export const deliveryPrefix = () => `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload/`;

// Everything the browser needs to upload one image straight to Cloudinary.
// The random public id is unguessable and sits in the user's own folder.
export function signUpload(userId) {
  const params = {
    allowed_formats: 'webp,png',
    public_id: publicIdPrefix(userId) + crypto.randomBytes(12).toString('hex'),
    timestamp: Math.floor(Date.now() / 1000),
  };
  return {
    ...params,
    signature: sign(params),
    apiKey: config.CLOUDINARY_API_KEY,
    cloudName: config.CLOUDINARY_CLOUD_NAME,
  };
}

// Admin API sweep of the user's whole folder. Best effort, like destroyAsset.
export async function destroyUserFolder(userId) {
  const auth = Buffer.from(`${config.CLOUDINARY_API_KEY}:${config.CLOUDINARY_API_SECRET}`).toString('base64');
  const url = `https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/resources/image/upload?prefix=${encodeURIComponent(publicIdPrefix(userId))}`;
  try {
    const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) console.warn('Cloudinary folder sweep failed', res.status);
  } catch (err) {
    console.warn('Cloudinary folder sweep error', err.message);
  }
}

// Best effort: a failed delete only leaves a ~50 KB orphan, so never block the user on it.
export async function destroyAsset(publicId) {
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({
    ...params,
    api_key: config.CLOUDINARY_API_KEY,
    signature: sign(params),
  });
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body,
    });
    if (!res.ok) console.warn('Cloudinary destroy failed', res.status);
  } catch (err) {
    console.warn('Cloudinary destroy error', err.message);
  }
}
