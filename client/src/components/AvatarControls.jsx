import { useEffect, useState } from 'react';
import { AVATAR_DEFAULTS, AVATAR_PRESETS, AVATAR_RANGES, BODY_TYPES } from '../constants.js';

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const MEASURES = [
  ['heightCm', 'Height', 'Head to floor'],
  ['shoulderCm', 'Shoulder width', 'Straight across, from shoulder tip to shoulder tip'],
  ['bustCm', 'Bust', 'All the way round the fullest part'],
  ['waistCm', 'Waist', 'All the way round the narrowest part'],
  ['hipsCm', 'Hips', 'All the way round the fullest part'],
  ['inseamCm', 'Inseam', 'Inside of the leg, crotch to floor'],
];

// Typing is committed on blur or Enter, so you can type 165 without the field jumping at "1".
function CmInput({ id, value, range, onCommit }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n)) return setText(String(value));
    onCommit(clamp(Math.round(n), range));
  };
  return (
    <input id={id} type="number" inputMode="numeric" min={range[0]} max={range[1]} value={text}
      onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
  );
}

function Measure({ field, label, hint, draft, onChange }) {
  const range = AVATAR_RANGES[field];
  const id = `avatar-${field}`;
  return (
    <div className="measure">
      <div className="measure-head">
        <label htmlFor={id}>{label}</label>
        <span className="cm"><CmInput id={id} value={draft[field]} range={range} onCommit={(n) => onChange({ [field]: n })} /> cm</span>
      </div>
      <input type="range" aria-label={`${label} slider`} min={range[0]} max={range[1]} step="1" value={draft[field]}
        onChange={(e) => onChange({ [field]: Number(e.target.value) })} />
      <span className="muted hint">{hint}</span>
    </div>
  );
}

const atDefaults = (draft, body) => Object.entries(AVATAR_DEFAULTS[body]).every(([k, v]) => draft[k] === v);

export default function AvatarControls({ draft, onChange, showAnchors, onToggleAnchors }) {
  const male = draft.body === 'male';
  // Switching silhouette also switches the starting measurements, unless you already changed them.
  const pickBody = (id) => onChange(atDefaults(draft, draft.body) ? { body: id, ...AVATAR_DEFAULTS[id] } : { body: id });
  const presets = AVATAR_PRESETS[draft.body];

  return (
    <div className="avatar-form">
      <label className="field">Name
        <input type="text" maxLength={40} value={draft.name} onChange={(e) => onChange({ name: e.target.value })} />
      </label>

      <div role="group" aria-label="Silhouette">
        <span className="field-label">Silhouette</span>
        <div className="seg">
          {BODY_TYPES.map((t) => (
            <button key={t.id} className={draft.body === t.id ? 'chip on' : 'chip'} aria-pressed={draft.body === t.id}
              onClick={() => pickBody(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Start from a size">
        <span className="field-label">Start from a size <span className="muted">(sets shoulders, {male ? 'chest' : 'bust'}, waist and hips)</span></span>
        <div className="seg">
          {presets.map((pr) => {
            const on = Object.entries(pr.m).every(([k, v]) => draft[k] === v);
            return <button key={pr.id} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => onChange(pr.m)}>{pr.label}</button>;
          })}
        </div>
      </div>

      {MEASURES.map(([field, label, hint]) => (
        <Measure key={field} field={field} label={male && field === 'bustCm' ? 'Chest' : label} hint={hint} draft={draft} onChange={onChange} />
      ))}

      <label className="check">
        <input type="checkbox" checked={showAnchors} onChange={(e) => onToggleAnchors(e.target.checked)} />
        Show anchor points
      </label>
      <button className="link" onClick={() => onChange(AVATAR_DEFAULTS[draft.body])}>Reset measurements</button>
    </div>
  );
}
