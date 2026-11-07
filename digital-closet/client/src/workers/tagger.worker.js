// Runs CLIP off the main thread. The library and model are fetched on first use
// (model files are cached by the browser, so later visits skip the download).
import { env, pipeline, RawImage } from '@huggingface/transformers';
import { PROMPTS, TEMPLATE, pickTags } from '../lib/tagLabels.js';

env.allowLocalModels = false;

const MODEL = 'Xenova/clip-vit-base-patch32';
let classifier = null;

function load() {
  if (!classifier) {
    const files = new Map();
    classifier = pipeline('zero-shot-image-classification', MODEL, {
      dtype: 'q8', // quantized: smaller download, fine for tagging
      progress_callback: (p) => {
        if (p.status !== 'progress' || !p.total) return;
        files.set(p.file, { loaded: p.loaded, total: p.total });
        let loaded = 0;
        let total = 0;
        for (const f of files.values()) { loaded += f.loaded; total += f.total; }
        self.postMessage({ type: 'progress', pct: Math.round((loaded / total) * 100) });
      },
    }).catch((err) => {
      classifier = null; // allow a retry on the next call
      throw err;
    });
  }
  return classifier;
}

self.onmessage = async ({ data: { id, blob } }) => {
  try {
    const clip = await load();
    const scores = await clip(await RawImage.fromBlob(blob), PROMPTS, { hypothesis_template: TEMPLATE });
    self.postMessage({ type: 'result', id, tags: pickTags(scores) });
  } catch (err) {
    self.postMessage({ type: 'error', id, message: String(err?.message || err) });
  }
};
