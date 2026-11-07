// Main-thread side of the tagging worker. The worker (and so the transformers.js bundle)
// is only created when the first item is tagged, keeping the initial app load small.
const SIZE = 224; // CLIP input size

let worker = null;
let nextId = 0;
const pending = new Map(); // id -> { resolve, reject }
let onProgress = null;

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/tagger.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') return onProgress?.(data.pct);
    const job = pending.get(data.id);
    pending.delete(data.id);
    if (data.type === 'result') job?.resolve(data.tags);
    else job?.reject(new Error(data.message));
  };
  worker.onerror = () => {
    for (const job of pending.values()) job.reject(new Error('Tagger crashed'));
    pending.clear();
    worker.terminate();
    worker = null; // next call starts a fresh worker
  };
  return worker;
}

// The cutout is transparent; CLIP needs an opaque square, so center it on white.
async function clipInput(blob) {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const k = (SIZE * 0.92) / Math.max(bmp.width, bmp.height);
  const w = bmp.width * k;
  const h = bmp.height * k;
  ctx.drawImage(bmp, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare image'))), 'image/jpeg', 0.92)
  );
}

/** Image blob -> { category, style, pattern, season }. Rejects on any failure; callers fall back to manual tags. */
export async function tagImage(blob, progress) {
  onProgress = progress;
  const input = await clipInput(blob);
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    try {
      getWorker().postMessage({ id, blob: input });
    } catch (err) {
      pending.delete(id);
      reject(err);
    }
  });
}
