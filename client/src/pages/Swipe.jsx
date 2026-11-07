import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { categoryLabel } from '../constants.js';
import { buildMannequin } from '../lib/mannequin.js';
import { Z_ORDER, slotBox } from '../lib/fit.js';
import OutfitStage from '../components/OutfitStage.jsx';
import SwipeRow from '../components/SwipeRow.jsx';
import SaveOutfit from '../components/SaveOutfit.jsx';

const PREF_KEY = 'dc_avatar_id'; // shared with the Dress up page
const readPref = () => { try { return localStorage.getItem(PREF_KEY); } catch { return null; } };
const writePref = (id) => { try { localStorage.setItem(PREF_KEY, id); } catch { /* private mode: not remembered */ } };
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// A dress replaces top and bottom, so each mode shows only the rows that make sense together.
const MODES = {
  separates: { label: 'Tops and bottoms', rows: ['top', 'bottom', 'shoes', 'outerwear'] },
  dress: { label: 'Dresses', rows: ['dress', 'shoes', 'outerwear'] },
};
const OPTIONAL = ['shoes', 'outerwear']; // these rows can be empty

export default function Swipe() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/items'), api('/avatars')])
      .then(([i, a]) => setData({ items: i.items, avatars: a.avatars }))
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="center-note">Loading your closet…</p>;
  return <SwipeView items={data.items} avatars={data.avatars} />;
}

function SwipeView({ items, avatars }) {
  const nav = useNavigate();
  const [avatarId, setAvatarId] = useState(readPref);
  const [mode, setMode] = useState('separates');
  const [focus, setFocus] = useState('top');
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const byCat = useMemo(() => {
    const m = {};
    items.forEach((i) => { (m[i.category] ||= []).push(i); });
    return m;
  }, [items]);
  const entriesOf = (c) => (OPTIONAL.includes(c) ? [{ id: null, name: 'Nothing' }, ...(byCat[c] || [])] : byCat[c] || []);

  // Start with the first piece of every main row so there is an outfit to flick through straight away.
  const [picks, setPicks] = useState(() => Object.fromEntries(['top', 'bottom', 'dress', 'shoes'].map((c) => [c, byCat[c]?.[0]?.id ?? null])));

  const avatar = avatars.find((a) => a.id === avatarId) || avatars[0];
  const anchors = useMemo(() => (avatar ? buildMannequin(avatar).anchors : null), [avatar]);
  if (!avatar) {
    return (
      <div className="empty">
        <p>Create an avatar first, then flick through outfits on it.</p>
        <button className="primary" onClick={() => nav('/avatar')}>Create an avatar</button>
      </div>
    );
  }

  const rows = MODES[mode].rows;
  const outfit = Object.fromEntries(rows.filter((c) => picks[c]).map((c) => [c, picks[c]]));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const ids = Z_ORDER.map((c) => outfit[c]).filter(Boolean);
  const layers = ids.map((id) => ({ item: byId[id], box: slotBox(byId[id].category, anchors), fit: byId[id].fit }));

  const setPick = (c, id) => { setPicks((p) => ({ ...p, [c]: id })); setSaved(false); };
  const changeMode = (m) => { setMode(m); setFocus(MODES[m].rows[0]); setSaved(false); };
  const stepFocus = (dir) => {
    const list = entriesOf(focus);
    const i = Math.max(0, list.findIndex((e) => e.id === picks[focus]));
    const next = list[Math.min(list.length - 1, Math.max(0, i + dir))];
    if (next) setPick(focus, next.id);
  };
  const shuffle = () => setPicks((p) => {
    const next = { ...p };
    rows.forEach((c) => { const l = entriesOf(c); if (l.length) next[c] = pickRandom(l).id; });
    return next;
  });

  const saveOutfit = async (meta) => {
    setSaveBusy(true);
    setSaveError('');
    try {
      await api('/outfits', { method: 'POST', body: { ...meta, items: ids } });
      setSaveOpen(false);
      setSaved(true);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <section>
      <div className="closet-head"><h2>Swipe</h2></div>

      <div className="chips" aria-label="Avatar">
        {avatars.map((a) => (
          <button key={a.id} className={a.id === avatar.id ? 'chip on' : 'chip'} onClick={() => { setAvatarId(a.id); writePref(a.id); }}>{a.name}</button>
        ))}
      </div>
      <div className="seg" role="group" aria-label="Outfit type">
        {Object.entries(MODES).map(([id, m]) => (
          <button key={id} className={mode === id ? 'chip on' : 'chip'} aria-pressed={mode === id} onClick={() => changeMode(id)}>{m.label}</button>
        ))}
      </div>

      <OutfitStage avatar={avatar} layers={layers} selectedId={null} onSelect={() => {}} onMove={() => {}} onSwipe={stepFocus} readOnly />
      <p className="muted hint">Flick a row below. Swiping the avatar moves the highlighted row: {categoryLabel(focus).toLowerCase()}.</p>

      {items.length === 0 ? (
        <p className="muted">Add some pieces in the Closet tab first.</p>
      ) : (
        rows.map((c) =>
          entriesOf(c).length === 0 || (OPTIONAL.includes(c) && entriesOf(c).length === 1) ? (
            <p key={c} className="muted hint">No {categoryLabel(c).toLowerCase()} in your closet yet.</p>
          ) : (
            <SwipeRow key={c} label={categoryLabel(c)} entries={entriesOf(c)} value={picks[c]} focused={focus === c}
              onFocus={() => setFocus(c)} onChange={(id) => setPick(c, id)} />
          )
        )
      )}

      <div className="actions save-row">
        <button className="secondary" onClick={shuffle} disabled={items.length === 0}>Shuffle</button>
        <button className="primary" onClick={() => setSaveOpen(true)} disabled={layers.length === 0}>Save outfit</button>
        <button className="secondary" onClick={() => nav('/outfits/new', { state: { itemIds: ids } })} disabled={layers.length === 0}>Fine-tune</button>
      </div>
      {saved && <p className="notice">Saved. Find it in the Outfits tab.</p>}
      {saveOpen && (
        <SaveOutfit initial={{ name: '', tags: [], favorite: false }} isUpdate={false} busy={saveBusy}
          error={saveError} onSave={saveOutfit} onClose={() => setSaveOpen(false)} />
      )}
    </section>
  );
}
