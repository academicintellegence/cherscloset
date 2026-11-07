import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { DEFAULT_FIT } from '../constants.js';
import { buildMannequin } from '../lib/mannequin.js';
import { Z_ORDER, slotBox } from '../lib/fit.js';
import OutfitStage from '../components/OutfitStage.jsx';
import SlotBar from '../components/SlotBar.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import FitPanel from '../components/FitPanel.jsx';
import SaveOutfit from '../components/SaveOutfit.jsx';
import { exportStagePng } from '../lib/exportPng.js';

const PREF_KEY = 'dc_avatar_id';
const readPref = () => { try { return localStorage.getItem(PREF_KEY); } catch { return null; } };
const writePref = (id) => { try { localStorage.setItem(PREF_KEY, id); } catch { /* private mode: not remembered */ } };
const sameFit = (a, b) => ['dx', 'dy', 'scale', 'rot'].every((k) => a[k] === b[k]);
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// A saved outfit is a list of item ids; put each one in its item's current category slot.
const slotsFrom = (saved, items) => {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const slots = {};
  (saved?.itemIds || []).forEach((id) => { if (byId[id]) slots[byId[id].category] = id; });
  return slots;
};

export default function Builder() {
  const { id } = useParams();
  const { state } = useLocation(); // a suggestion can pre-fill a new outfit with { itemIds }
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    Promise.all([api('/items'), api('/avatars'), id === 'new' ? null : api(`/outfits/${id}`)])
      .then(([i, a, o]) => setData({ items: i.items, avatars: a.avatars, outfit: o?.outfit ?? null }))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="center-note">Loading…</p>;
  return <BuilderView key={id} initialItems={data.items} initialOutfit={data.outfit} prefillIds={state?.itemIds} avatars={data.avatars} />;
}

function BuilderView({ initialItems, initialOutfit, prefillIds, avatars }) {
  const nav = useNavigate();
  const stageRef = useRef(null);
  const [items, setItems] = useState(initialItems);
  const [avatarId, setAvatarId] = useState(readPref);
  const [outfit, setOutfit] = useState(() => slotsFrom(initialOutfit || (prefillIds && { itemIds: prefillIds }), initialItems)); // { category: itemId }
  const [raised, setRaised] = useState([]); // item ids tapped to the front, oldest first
  const [selectedId, setSelectedId] = useState(null);
  const [fits, setFits] = useState({}); // unsaved fit edits by item id
  const [picker, setPicker] = useState(null); // category being picked
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [saved, setSaved] = useState(initialOutfit); // the saved outfit being edited, if any
  const [locked, setLocked] = useState([]); // categories Shuffle must not change
  const [history, setHistory] = useState({ list: [], i: -1 }); // outfits visited by shuffle/swipe
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  const avatar = avatars.find((a) => a.id === avatarId) || avatars[0];
  const anchors = useMemo(() => (avatar ? buildMannequin(avatar).anchors : null), [avatar]);
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  if (!avatar) {
    return (
      <div className="empty">
        <p>Create an avatar first, then dress it here.</p>
        <button className="primary" onClick={() => nav('/avatar')}>Create an avatar</button>
      </div>
    );
  }

  const fitOf = (item) => fits[item.id] || item.fit;

  // Fixed order by category, with tapped pieces moved in front.
  const ids = Z_ORDER.map((c) => outfit[c]).filter(Boolean);
  const order = [...ids.filter((id) => !raised.includes(id)), ...raised.filter((id) => ids.includes(id))];
  const layers = order.map((id) => ({ item: byId[id], box: slotBox(byId[id].category, anchors), fit: fitOf(byId[id]) }));

  const selected = selectedId ? byId[selectedId] : null;
  const dirty = Boolean(selected && fits[selectedId] && !sameFit(fits[selectedId], selected.fit));

  const pickAvatar = (id) => { setAvatarId(id); writePref(id); };

  const select = (id) => {
    setSelectedId(id);
    if (id) setRaised((r) => [...r.filter((x) => x !== id), id]);
  };

  const choose = (category, id) => {
    const next = { ...outfit };
    if (id) next[category] = id; else delete next[category];
    // A dress replaces top + bottom, and the other way round.
    if (id && category === 'dress') { delete next.top; delete next.bottom; }
    if (id && (category === 'top' || category === 'bottom')) delete next.dress;
    setOutfit(next);
    setHistory({ list: [], i: -1 });
    setInfo('');
    if (!id) setLocked((l) => l.filter((c) => c !== category));
    setRaised((r) => r.filter((x) => Object.values(next).includes(x)));
    setSelectedId(id);
    setPicker(null);
  };

  const setFit = (id, patch) => setFits((f) => ({ ...f, [id]: { ...(f[id] || byId[id].fit), ...patch } }));

  const saveFit = async () => {
    setSaving(true);
    setError('');
    try {
      const { item } = await api(`/items/${selectedId}`, { method: 'PATCH', body: { fit: fits[selectedId] } });
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setFits(({ [item.id]: _saved, ...rest }) => rest);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const applyOutfit = (next) => {
    setOutfit(next);
    setRaised([]);
    setSelectedId(null);
    setInfo('');
  };

  // One new random piece per unlocked, filled slot. An empty outfit gets a starter (top + bottom + shoes, or a dress).
  const shuffle = () => {
    const cats = Object.keys(outfit);
    const next = { ...outfit };
    const of = (c) => items.filter((i) => i.category === c);
    if (cats.length === 0) {
      ['top', 'bottom', 'shoes'].forEach((c) => { const it = pickRandom(of(c)); if (it) next[c] = it.id; });
      if (!next.top && !next.bottom) { const d = pickRandom(of('dress')); if (d) next.dress = d.id; }
    } else {
      cats.filter((c) => !locked.includes(c)).forEach((c) => {
        const it = pickRandom(of(c).filter((i) => i.id !== outfit[c]));
        if (it) next[c] = it.id;
      });
    }
    const keys = Object.keys(next);
    if (keys.length === cats.length && keys.every((c) => next[c] === outfit[c])) {
      setInfo('Nothing to shuffle yet. Add more pieces to these slots, or unlock one.');
      return;
    }
    const base = history.i >= 0 ? history.list.slice(0, history.i + 1) : [outfit];
    const list = [...base, next].slice(-30);
    setHistory({ list, i: list.length - 1 });
    applyOutfit(next);
  };

  // dir -1 = back through earlier combinations, +1 = forward (a new shuffle at the end).
  const swipe = (dir) => {
    const { list, i } = history;
    if (dir < 0) {
      if (i > 0) { setHistory({ list, i: i - 1 }); applyOutfit(list[i - 1]); }
    } else if (i >= 0 && i < list.length - 1) {
      setHistory({ list, i: i + 1 });
      applyOutfit(list[i + 1]);
    } else {
      shuffle();
    }
  };

  const toggleLock = (category) =>
    setLocked((l) => (l.includes(category) ? l.filter((c) => c !== category) : [...l, category]));

  const saveOutfit = async (meta) => {
    setSaveBusy(true);
    setSaveError('');
    try {
      const body = { ...meta, items: ids };
      const res = saved
        ? await api(`/outfits/${saved.id}`, { method: 'PATCH', body })
        : await api('/outfits', { method: 'POST', body });
      setSaved(res.outfit);
      setSaveOpen(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaveBusy(false);
    }
  };

  const exportPng = () => {
    setError('');
    try {
      exportStagePng(stageRef.current, saved?.name || 'outfit');
    } catch {
      setError('Could not export the image. Reload the page and try again.');
    }
  };

  return (
    <section>
      <div className="closet-head"><h2>{saved ? saved.name : 'Dress up'}</h2></div>

      <div className="chips" aria-label="Avatar">
        {avatars.map((a) => (
          <button key={a.id} className={a.id === avatar.id ? 'chip on' : 'chip'} onClick={() => pickAvatar(a.id)}>{a.name}</button>
        ))}
      </div>

      <OutfitStage avatar={avatar} layers={layers} selectedId={selectedId} onSelect={select}
        onMove={(id, pos) => setFit(id, pos)} onSwipe={swipe} stageRef={stageRef} />

      <div className="shuffle-row">
        <button className="secondary" onClick={() => swipe(-1)} disabled={history.i <= 0} aria-label="Previous combination">‹</button>
        <button className="primary" onClick={shuffle} disabled={items.length === 0}>Shuffle</button>
        <button className="secondary" onClick={() => swipe(1)} disabled={items.length === 0} aria-label="Next combination">›</button>
      </div>

      {selected ? (
        <FitPanel item={selected} fit={fitOf(selected)} dirty={dirty} saving={saving}
          locked={locked.includes(selected.category)} onToggleLock={() => toggleLock(selected.category)}
          onChange={(patch) => setFit(selectedId, patch)} onSave={saveFit}
          onReset={() => setFit(selectedId, DEFAULT_FIT)} onRemove={() => choose(selected.category, null)} />
      ) : (
        <p className="muted hint">{items.length === 0 ? 'Add pieces in the Closet tab, then dress your avatar here.' : 'Pick a piece for each slot. Tap one on the avatar to adjust it.'}</p>
      )}

      <SlotBar outfit={outfit} byId={byId} locked={locked} onPick={setPicker} />
      {info && <p className="notice">{info}</p>}
      <div className="actions save-row">
        <button className="primary" onClick={() => setSaveOpen(true)} disabled={layers.length === 0}>{saved ? 'Update outfit' : 'Save outfit'}</button>
        <button className="secondary" onClick={exportPng} disabled={layers.length === 0}>Export PNG</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {picker && <SlotPicker category={picker} items={items} currentId={outfit[picker]} onChoose={choose} onClose={() => setPicker(null)} />}
      {saveOpen && (
        <SaveOutfit initial={saved || { name: '', tags: [], favorite: false }} isUpdate={Boolean(saved)} busy={saveBusy}
          error={saveError} onSave={saveOutfit} onClose={() => setSaveOpen(false)} />
      )}
    </section>
  );
}
