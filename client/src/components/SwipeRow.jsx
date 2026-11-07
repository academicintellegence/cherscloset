import { useEffect, useRef } from 'react';

const ITEM_W = 88; // keep in sync with .swipe-item in styles.css

// One horizontal strip of choices. Flick it like a rail of hangers: the piece that settles in the
// centre is the one on the avatar. Tapping a piece or using the arrows moves it to the centre too.
// entries: [{ id, name, imageUrl, color }]. id null means "nothing in this slot".
export default function SwipeRow({ label, entries, value, onChange, focused, onFocus }) {
  const rail = useRef(null);
  const settle = useRef(null);
  const quiet = useRef(false); // true while we scroll the rail ourselves, so that scroll isn't read as a swipe
  const first = useRef(true);
  const idx = Math.max(0, entries.findIndex((e) => e.id === value));

  useEffect(() => {
    const el = rail.current;
    const child = el?.children[idx];
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    if (Math.abs(el.scrollLeft - target) < 4) return;
    quiet.current = true;
    el.scrollTo({ left: target, behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
    const t = setTimeout(() => { quiet.current = false; }, 450);
    return () => clearTimeout(t);
  }, [idx, entries.length]);

  const onScroll = () => {
    if (quiet.current) return;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = rail.current;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let gap = Infinity;
      [...el.children].forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
        if (d < gap) { gap = d; best = i; }
      });
      if (entries[best] && entries[best].id !== value) onChange(entries[best].id);
    }, 110);
  };
  useEffect(() => () => clearTimeout(settle.current), []);

  const step = (d) => { const next = entries[Math.min(entries.length - 1, Math.max(0, idx + d))]; if (next) onChange(next.id); };
  const current = entries[idx];

  return (
    <div className={focused ? 'swipe-block focused' : 'swipe-block'} onPointerDown={onFocus}>
      <div className="swipe-head">
        <strong>{label}</strong>
        <span className="muted">{current ? current.name : ''}</span>
        <span className="swipe-arrows">
          <button className="secondary" onClick={() => step(-1)} disabled={idx <= 0} aria-label={`Previous ${label.toLowerCase()}`}>‹</button>
          <button className="secondary" onClick={() => step(1)} disabled={idx >= entries.length - 1} aria-label={`Next ${label.toLowerCase()}`}>›</button>
        </span>
      </div>
      <div className="swipe-row" ref={rail} onScroll={onScroll} role="listbox" aria-label={label}>
        {entries.map((e) => (
          <button key={e.id ?? 'none'} className={e.id === value ? 'swipe-item on' : 'swipe-item'} role="option" aria-selected={e.id === value}
            onClick={() => onChange(e.id)}>
            {e.id === null ? <span className="swipe-none">None</span> : <img className="checker" src={e.imageUrl} alt={e.name} loading="lazy" draggable="false" />}
          </button>
        ))}
      </div>
    </div>
  );
}
