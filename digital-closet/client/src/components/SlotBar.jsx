import { CATEGORIES } from '../constants.js';

// One button per slot; shows the chosen piece or a "+".
export default function SlotBar({ outfit, byId, locked, onPick }) {
  return (
    <div className="slots" role="group" aria-label="Outfit slots">
      {CATEGORIES.map((c) => {
        const item = byId[outfit[c.id]];
        return (
          <button key={c.id} className={item ? 'slot filled' : 'slot'} onClick={() => onPick(c.id)}
            aria-label={`${c.label}: ${item ? item.name : 'empty'}${item && locked.includes(c.id) ? ', locked' : ''}`}>
            {item && locked.includes(c.id) && <span className="slot-lock" aria-hidden="true">🔒</span>}
            {item ? <img className="checker" src={item.imageUrl} alt="" /> : <span className="slot-plus" aria-hidden="true">+</span>}
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
