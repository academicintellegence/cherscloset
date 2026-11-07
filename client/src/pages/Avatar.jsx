import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { DEFAULT_AVATAR, MAX_AVATARS } from '../constants.js';
import Mannequin from '../components/Mannequin.jsx';
import AvatarControls from '../components/AvatarControls.jsx';

const FIELDS = ['name', 'body', 'heightCm', 'shoulderCm', 'bustCm', 'waistCm', 'hipsCm', 'inseamCm'];
const pick = (a) => Object.fromEntries(FIELDS.map((f) => [f, a[f]]));
const same = (a, b) => FIELDS.every((f) => a[f] === b[f]);

export default function Avatar() {
  const [avatars, setAvatars] = useState(null);
  const [max, setMax] = useState(MAX_AVATARS);
  const [selected, setSelected] = useState('new'); // avatar id, or 'new' for an unsaved one
  const [draft, setDraft] = useState(DEFAULT_AVATAR);
  const [showAnchors, setShowAnchors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = (a) => {
    setSelected(a ? a.id : 'new');
    setDraft(a ? pick(a) : DEFAULT_AVATAR);
    setError('');
  };

  useEffect(() => {
    api('/avatars')
      .then((d) => { setAvatars(d.avatars); setMax(d.max); open(d.avatars[0]); })
      .catch((e) => setError(e.message));
  }, []);

  if (!avatars) return error ? <p className="error" role="alert">{error}</p> : <p className="center-note">Loading your avatars…</p>;

  const current = avatars.find((a) => a.id === selected);
  const changed = !same(draft, current ? pick(current) : DEFAULT_AVATAR);
  const full = avatars.length >= max;
  const edit = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const go = (a) => {
    if (changed && !window.confirm('Discard your unsaved changes?')) return;
    open(a);
  };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const save = () => run(async () => {
    if (current) {
      const { avatar } = await api(`/avatars/${current.id}`, { method: 'PATCH', body: draft });
      setAvatars((prev) => prev.map((a) => (a.id === avatar.id ? avatar : a)));
      open(avatar);
    } else {
      const { avatar } = await api('/avatars', { method: 'POST', body: draft });
      setAvatars((prev) => [...prev, avatar]);
      open(avatar);
    }
  });

  const duplicate = () => run(async () => {
    const { avatar } = await api(`/avatars/${current.id}/duplicate`, { method: 'POST' });
    setAvatars((prev) => [...prev, avatar]);
    open(avatar);
  });

  const remove = () => {
    if (!window.confirm(`Delete "${current.name}"?`)) return;
    run(async () => {
      await api(`/avatars/${current.id}`, { method: 'DELETE' });
      const rest = avatars.filter((a) => a.id !== current.id);
      setAvatars(rest);
      open(rest[0]);
    });
  };

  return (
    <section>
      <div className="closet-head">
        <h2>Avatars <span className="muted count">{avatars.length}/{max}</span></h2>
        <button className="primary" onClick={() => go(null)} disabled={full || selected === 'new'}
          title={full ? `You have ${max} avatars. Delete one to add another.` : undefined}>+ New</button>
      </div>

      <div className="chips" aria-label="Your avatars">
        {avatars.map((a) => (
          <button key={a.id} className={a.id === selected ? 'chip on' : 'chip'} onClick={() => go(a)}>{a.name}</button>
        ))}
        {selected === 'new' && avatars.length > 0 && <button className="chip on">New avatar</button>}
      </div>

      <div className="avatar-editor">
        <div className="avatar-stage"><Mannequin params={draft} showAnchors={showAnchors} showMeasures /></div>
        <div className="stack">
          <AvatarControls draft={draft} onChange={edit} showAnchors={showAnchors} onToggleAnchors={setShowAnchors} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary wide" onClick={save} disabled={busy || !draft.name.trim() || (current && !changed)}>
            {current ? 'Save changes' : 'Save avatar'}
          </button>
          {current && (
            <div className="actions">
              <button className="secondary" onClick={duplicate} disabled={busy || changed || full}
                title={changed ? 'Save your changes first' : undefined}>Duplicate</button>
              <button className="danger" onClick={remove} disabled={busy}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
