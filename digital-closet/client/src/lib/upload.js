import { api } from '../api.js';

// Ask our server for a signature, then send the file straight to Cloudinary (keeps traffic off Render).
export async function uploadImage(blob) {
  const sig = await api('/uploads/sign', { method: 'POST' });
  const form = new FormData();
  form.append('file', blob);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('public_id', sig.public_id);
  form.append('allowed_formats', sig.allowed_formats);
  form.append('signature', sig.signature);

  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
  } catch {
    throw new Error('Image upload failed. Check your connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || 'Image upload failed');
  return { imageUrl: data.secure_url, publicId: data.public_id };
}
