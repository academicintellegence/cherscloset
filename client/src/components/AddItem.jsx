import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { categoryNoun } from '../constants.js';
import { colorName } from '../lib/color.js';
import { tagImage } from '../lib/tagger.js';
import { processPhoto } from '../lib/imagePipeline.js';
import { uploadImage } from '../lib/upload.js';
import ItemForm from './ItemForm.jsx';
import Sheet from './Sheet.jsx';

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const TAG_FIELDS = ['category', 'style', 'pattern', 'season'];
const EMPTY_FORM = { name: '', category: 'top', color: '#808080', style: '', pattern: '', season: '' };

// Flow: pick a photo -> in-browser processing -> review/edit -> upload + save.
export default function AddItem({ onClose, onSaved, onTips }) {
  const [stage, setStage] = useState('pick'); // pick | processing | review
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null); // { blob, color, cutoutFailed }
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagState, setTagState] = useState({ status: 'idle', pct: null }); // idle | loading | done | failed
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const touched = useRef(new Set()); // fields the user edited by hand: AI suggestions never overwrite them
  const tagRun = useRef(0); // ignores results from a photo that was since retaken

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    if (file.size > MAX_PHOTO_BYTES) return setError('That photo is too large (max 20 MB).');
    setStage('processing');
    try {
      const r = await processPhoto(file, setStatus);
      setResult(r);
      setPreview(URL.createObjectURL(r.blob));
      setForm({ ...EMPTY_FORM, color: r.color });
      setStage('review');
      runTagging(r.blob);
    } catch (err) {
      setError(err.message || 'Could not process that photo.');
      setStage('pick');
    }
  }

  // Runs in the background while the user reviews the photo. Any failure just means manual tags.
  async function runTagging(blob) {
    const run = ++tagRun.current;
    touched.current = new Set();
    setTagState({ status: 'loading', pct: null });
    try {
      const tags = await tagImage(blob, (pct) => run === tagRun.current && setTagState({ status: 'loading', pct }));
      if (run !== tagRun.current) return;
      setForm((f) => {
        const next = { ...f };
        for (const k of TAG_FIELDS) if (!touched.current.has(k)) next[k] = tags[k];
        return next;
      });
      setTagState({ status: 'done', pct: null });
    } catch (err) {
      console.warn('Auto-tagging failed', err);
      if (run === tagRun.current) setTagState({ status: 'failed', pct: null });
    }
  }

  function editForm(next) {
    for (const k of Object.keys(next)) if (next[k] !== form[k]) touched.current.add(k);
    setForm(next);
  }

  function retake() {
    tagRun.current++; // drop any tagging still running for this photo
    setTagState({ status: 'idle', pct: null });
    setStage('pick');
  }

  async function save() {
    setError('');
    setSaving(true);
    try {
      const { imageUrl, publicId } = await uploadImage(result.blob);
      const name = form.name.trim() || `${colorName(form.color)} ${categoryNoun(form.category)}`;
      const { item } = await api('/items', {
        method: 'POST',
        body: { name, category: form.category, color: form.color, style: form.style, pattern: form.pattern, season: form.season, imageUrl, publicId },
      });
      onSaved(item);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Sheet title="Add to closet" onClose={onClose}>
      {stage === 'pick' && (
        <div className="stack">
          <p className="muted">Take a photo or choose one. We cut out the background on your device, so your photo never leaves it unprocessed.</p>
          <button className="primary wide" onClick={() => cameraRef.current.click()}>📷 Take photo</button>
          <button className="secondary wide" onClick={() => galleryRef.current.click()}>🖼️ Choose from gallery</button>
          <button className="link" onClick={onTips}>Photo tips</button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>
      )}

      {stage === 'processing' && (
        <div className="processing" role="status">
          <div className="spinner" />
          <p>{status}</p>
          <p className="muted">The first cutout downloads a model (~40 MB) and takes longer. After that it is quick.</p>
        </div>
      )}

      {stage === 'review' && (
        <div className="stack">
          <img className="preview checker" src={preview} alt="Cutout preview" />
          {result.cutoutFailed && (
            <p className="notice">Background removal didn’t work here, so the original photo is used. A plainer background helps.</p>
          )}
          <TagStatus {...tagState} />
          <ItemForm form={form} setForm={editForm} />
          <button className="primary wide" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save to closet'}
          </button>
          <button className="link" onClick={retake} disabled={saving}>Retake</button>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </Sheet>
  );
}

function TagStatus({ status, pct }) {
  if (status === 'loading') {
    return (
      <p className="notice tagging" role="status">
        <span className="spinner small" />
        {pct != null && pct < 100 ? `Downloading AI tagger (first time only) ${pct}%` : 'Suggesting tags with AI…'}
      </p>
    );
  }
  if (status === 'done') return <p className="notice">AI suggested the tags below. Please check them.</p>;
  if (status === 'failed') return <p className="notice">Auto-tagging isn’t available right now. Choose the tags yourself.</p>;
  return null;
}
