import { AVATAR_PRESETS, AVATAR_RANGES, BODY_TYPES } from '../constants.js';

const delta = (v) => {
  const d = Math.round((v - 1) * 100);
  return d === 0 ? 'Default' : `${d > 0 ? '+' : ''}${d}%`;
};

function Slider({ field, label, left, right, draft, onChange }) {
  const [min, max] = AVATAR_RANGES[field];
  const id = `avatar-${field}`;
  return (
    <div className="slider">
      <label htmlFor={id}>{label} <span className="muted">{delta(draft[field])}</span></label>
      <input id={id} type="range" min={min} max={max} step="0.01" value={draft[field]}
        onChange={(e) => onChange({ [field]: Number(e.target.value) })} />
      <div className="slider-ends muted"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

export default function AvatarControls({ draft, onChange, showAnchors, onToggleAnchors }) {
  const slider = { draft, onChange };
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
              onClick={() => onChange({ body: t.id })}>{t.label}</button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Body size">
        <span className="field-label">Body size</span>
        <div className="seg">
          {AVATAR_PRESETS.map((pr) => {
            const on = Math.abs(draft.width - pr.width) < 0.005;
            return (
              <button key={pr.id} className={on ? 'chip on' : 'chip'} aria-pressed={on}
                onClick={() => onChange({ width: pr.width })}>{pr.label}</button>
            );
          })}
        </div>
      </div>

      <Slider field="height" label="Height" left="Shorter" right="Taller" {...slider} />
      <Slider field="width" label="Width" left="Narrower" right="Wider" {...slider} />
      <Slider field="legs" label="Torso vs legs" left="Longer torso" right="Longer legs" {...slider} />

      <label className="check">
        <input type="checkbox" checked={showAnchors} onChange={(e) => onToggleAnchors(e.target.checked)} />
        Show anchor points
      </label>
      <button className="link" onClick={() => onChange({ height: 1, width: 1, legs: 1 })}>Reset proportions</button>
    </div>
  );
}
