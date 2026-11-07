import { categoryLabel } from '../constants.js';
import Sheet from './Sheet.jsx';

export default function SlotPicker({ category, items, currentId, onChoose, onClose }) {
  const list = items.filter((i) => i.category === category);
  const label = categoryLabel(category).toLowerCase();
  return (
    <Sheet title={`Choose ${label}`} onClose={onClose}>
      <div className="stack">
        {list.length === 0 ? (
          <p className="muted">No {label} yet. Add some in the Closet tab.</p>
        ) : (
          <ul className="grid">
            {list.map((item) => (
              <li key={item.id}>
                <button className={item.id === currentId ? 'card on' : 'card'} onClick={() => onChoose(category, item.id)}>
                  <img className="checker" src={item.imageUrl} alt={item.name} loading="lazy" />
                  <span className="card-name"><i className="dot" style={{ background: item.color }} aria-hidden="true" />{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {currentId && <button className="secondary wide" onClick={() => onChoose(category, null)}>Remove from outfit</button>}
      </div>
    </Sheet>
  );
}
