import { rgbToHex } from './color.js';

const MAX_SIDE = 800; // final sticker size
const TARGET_BYTES = 50 * 1024; // WebP target
const PNG_TARGET_BYTES = 200 * 1024; // used when the browser cannot encode WebP (older Safari)
const INPUT_SIDE = 1024; // downscale before background removal: much faster, no visible loss for stickers

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

const toBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image'))), type, quality)
  );

function scaled(src, factor) {
  if (factor >= 1) return src;
  const c = makeCanvas(src.width * factor, src.height * factor);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

async function bitmapOf(source) {
  try {
    return await createImageBitmap(source, { imageOrientation: 'from-image' }); // respects phone EXIF rotation
  } catch {
    return createImageBitmap(source);
  }
}

async function canvasFrom(source, maxSide) {
  const bmp = await bitmapOf(source);
  const factor = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = makeCanvas(bmp.width * factor, bmp.height * factor);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

// AI cutout, fully in the browser. The library and model are loaded lazily on first use and cached by the browser.
async function removeBg(canvas, onStatus) {
  const { removeBackground } = await import('@imgly/background-removal');
  const input = await toBlob(canvas, 'image/png');
  const out = await removeBackground(input, {
    model: 'isnet_quint8', // smallest model: best for phones and free hosting
    progress: (key, current, total) => {
      const pct = total ? Math.round((current / total) * 100) : 0;
      onStatus(key.startsWith('fetch') ? `Downloading AI model (first time only) ${pct}%` : 'Cutting out the item…');
    },
  });
  return canvasFrom(out, INPUT_SIDE);
}

// Crops to the visible pixels so stickers fit the avatar anchors later.
function trimToContent(src) {
  const { width: w, height: h } = src;
  const { data } = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('No item found in the photo. Try a plainer background.');
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad + 1) - x0;
  const ch = Math.min(h, maxY + pad + 1) - y0;
  const out = makeCanvas(cw, ch);
  out.getContext('2d').drawImage(src, x0, y0, cw, ch, 0, 0, cw, ch);
  return out;
}

let webpSupport;
const supportsWebp = () =>
  (webpSupport ??= toBlob(makeCanvas(1, 1), 'image/webp', 0.8).then((b) => b.type === 'image/webp'));

// WebP, max 800px, lowering quality then size until it is near ~50 KB.
async function compress(src) {
  const webp = await supportsWebp();
  const type = webp ? 'image/webp' : 'image/png';
  const target = webp ? TARGET_BYTES : PNG_TARGET_BYTES;
  const qualities = webp ? [0.85, 0.7, 0.55, 0.4] : [undefined];
  let c = scaled(src, MAX_SIDE / Math.max(src.width, src.height));
  let blob;
  for (let i = 0; i < 6; i++) {
    for (const q of qualities) {
      blob = await toBlob(c, type, q);
      if (blob.size <= target) return blob;
    }
    c = scaled(c, 0.85);
  }
  return blob; // best effort
}

// Most common color among visible pixels (3-bit-per-channel buckets, averaged for accuracy).
export function dominantColor(src) {
  const c = scaled(src, 64 / Math.max(src.width, src.height));
  const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
    buckets.set(key, b);
  }
  let best = null;
  for (const b of buckets.values()) if (!best || b.n > best.n) best = b;
  return best ? rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n) : '#808080';
}

/**
 * Photo file -> { blob, color, cutoutFailed }.
 * If the AI cutout fails (low memory, offline model download) we fall back to the plain photo
 * so the user can still save the item.
 */
export async function processPhoto(file, onStatus) {
  onStatus('Reading photo…');
  const photo = await canvasFrom(file, INPUT_SIDE);
  let cut = photo;
  let cutoutFailed = false;
  try {
    cut = await removeBg(photo, onStatus);
  } catch (err) {
    console.warn('Background removal failed, using the original photo', err);
    cutoutFailed = true;
  }
  onStatus('Trimming and compressing…');
  const trimmed = trimToContent(cut);
  const blob = await compress(trimmed);
  return { blob, color: dominantColor(trimmed), cutoutFailed };
}
