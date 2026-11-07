import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Outfits() {
  const nav = useNavigate();
  const [data, setData] = useState(null); // { outfits, items, max }
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/outfits'), api('/items')])
      .then(([o, i]) => setData({ outfits: o.outfits, max: o.max, items: i.items }))
      .catch((e) => setError(e.message));
  }, []);

  const byId = useMemo(() => Object.fromEntries((data?.items || []).map((i) => [i.id, i])), [data]);

  if (error && !data) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="center-note">Loading your outfits…</p>;

  const { outfits, max } = data;
  const shown = filter === 'fav' ? outfits.filter((o) => o.favorite) : outfits;
  const patchOutfits = (fn) => setData((d) => ({ ...d, outfits: fn(d.outfits) }));

  const toggleFavorite = async (o) => {
    setError('');
    try {
      const { outfit } = await api(`/outfits/${o.id}`, { method: 'PATCH', body: { favorite: !o.favorite } });
      patchOutfits((list) => list.map((x) => (x.id === outfit.id ? outfit : x)));
    } catch (e) { setError(e.message); }
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete "${o.name}"?`)) return;
    setError('');
    try {
      await api(`/outfits/${o.id}`, { method: 'DELETE' });
      patchOutfits((list) => list.filter((x) => x.id !== o.id));
    } catch (e) { setError(e.message); }
  };

  return (
    <section>
      <div className="closet-head">
        <h2>Outfits <span className="muted count">{outfits.length}/{max}</span></h2>
        <button className="primary" onClick={() => nav('/outfits/new')} disabled={outfits.length >= max}>+ New</button>
      </div>

      <div className="chips">
        <button className={filter === 'all' ? 'chip on' : 'chip'} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'fav' ? 'chip on' : 'chip'} onClick={() => setFilter('fav')}>Favorites</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {shown.length === 0 ? (
        <div className="empty">
          <p>{outfits.length === 0 ? 'No saved outfits yet.' : 'No favorites yet. Tap the star on an outfit.'}</p>
          {outfits.length === 0 && <button className="primary" onClick={() => nav('/outfits/new')}>Build your first outfit</button>}
        </div>
      ) : (
        <ul className="outfit-list">
          {shown.map((o) => (
            <li key={o.id} className="outfit-card">
              <div className="outfit-title">
                <strong>{o.name}</strong>
                <button className="star" onClick={() => toggleFavorite(o)} aria-pressed={o.favorite}
                  aria-label={o.favorite ? 'Remove from favorites' : 'Add to favorites'}>{o.favorite ? '★' : '☆'}</button>
              </div>
              {o.tags.length > 0 && <div className="tags">{o.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
              <div className="thumbs">
                {o.itemIds.map((id) => byId[id]).filter(Boolean).map((i) => (
                  <img key={i.id} className="checker" src={i.imageUrl} alt={i.name} loading="lazy" />
                ))}
              </div>
              <div className="actions">
                <button className="secondary" onClick={() => nav(`/outfits/${o.id}`)}>Open</button>
                <button className="danger" onClick={() => remove(o)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
