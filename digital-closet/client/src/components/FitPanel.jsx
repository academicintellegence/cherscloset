import { FIT_LIMITS } from '../constants.js';

// Fine-tune the selected piece. Dragging on the canvas handles position; this handles size and rotation.
export default function FitPanel({ item, fit, dirty, saving, locked, onToggleLock, onChange, onSave, onReset, onRemove }) {
  return (
    <div className="fit-panel stack">
      <strong>{item.name}</strong>
      <div className="slider">
        <label htmlFor="fit-scale">Size <span className="muted">{Math.round(fit.scale * 100)}%</span></label>
        <input id="fit-scale" type="range" min={FIT_LIMITS.scale[0]} max={FIT_LIMITS.scale[1]} step="0.01" value={fit.scale}
          onChange={(e) => onChange({ scale: Number(e.target.value) })} />
      </div>
      <div className="slider">
        <label htmlFor="fit-rot">Rotate <span className="muted">{Math.round(fit.rot)}°</span></label>
        <input id="fit-rot" type="range" min="-90" max="90" step="1" value={fit.rot}
          onChange={(e) => onChange({ rot: Number(e.target.value) })} />
      </div>
      <p className="muted hint">Drag the piece to move it. A saved fit is reused in every outfit and on every avatar.</p>
      <label className="check">
        <input type="checkbox" checked={locked} onChange={onToggleLock} /> Lock this piece (Shuffle keeps it)
      </label>
      <div className="actions">
        <button className="primary" onClick={onSave} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save fit'}</button>
        <button className="secondary" onClick={onReset}>Reset</button>
        <button className="danger" onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}
