import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES } from '../constants.js';
import AddItem from '../components/AddItem.jsx';
import EditItem from '../components/EditItem.jsx';
import HowToPhotograph from '../components/HowToPhotograph.jsx';

const TIPS_KEY = 'dc_tips_seen';
const tipsSeen = () => {
  try { return Boolean(localStorage.getItem(TIPS_KEY)); } catch { return false; }
};
const markTipsSeen = () => {
  try { localStorage.setItem(TIPS_KEY, '1'); } catch { /* private mode: just show tips again next time */ }
};

export default function Closet() {
  const [items, setItems] = useState(null);
  const [max, setMax] = useState(150);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'tips' | 'add' | { item }

  useEffect(() => {
    api('/items')
      .then((d) => { setItems(d.items); setMax(d.max); })
      .catch((e) => setError(e.message));
  }, []);

  const counts = useMemo(() => {
    const c = {};
    (items || []).forEach((i) => (c[i.category] = (c[i.category] || 0) + 1));
    return c;
  }, [items]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!items) return <p className="center-note">Loading your closet…</p>;

  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const full = items.length >= max;

  const openAdd = () => setModal(tipsSeen() ? 'add' : 'tips');
  const closeTips = () => { markTipsSeen(); setModal('add'); };

  return (
    <section>
      <div className="closet-head">
        <h2>My closet <span className="muted count">{items.length}/{max}</span></h2>
        <button className="primary" onClick={openAdd} disabled={full} title={full ? 'Closet is full' : undefined}>+ Add</button>
      </div>

      <div className="chips" role="tablist" aria-label="Filter by category">
        <button className={filter === 'all' ? 'chip on' : 'chip'} onClick={() => setFilter('all')}>All {items.length}</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={filter === c.id ? 'chip on' : 'chip'} onClick={() => setFilter(c.id)}>
            {c.label} {counts[c.id] || 0}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <p>{items.length === 0 ? 'Your closet is empty.' : 'Nothing in this category yet.'}</p>
          <button className="primary" onClick={openAdd}>Add your first piece</button>
        </div>
      ) : (
        <ul className="grid">
          {shown.map((item) => (
            <li key={item.id}>
              <button className="card" onClick={() => setModal({ item })}>
                <img className="checker" src={item.imageUrl} alt={item.name} loading="lazy" />
                <span className="card-name">
                  <i className="dot" style={{ background: item.color }} aria-hidden="true" />
                  {item.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {modal === 'tips' && <HowToPhotograph onDone={closeTips} />}
      {modal === 'add' && (
        <AddItem
          onClose={() => setModal(null)}
          onTips={() => setModal('tips')}
          onSaved={(item) => setItems((prev) => [item, ...prev])}
        />
      )}
      {modal?.item && (
        <EditItem
          item={modal.item}
          onClose={() => setModal(null)}
          onUpdated={(u) => setItems((prev) => prev.map((i) => (i.id === u.id ? u : i)))}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </section>
  );
}
