import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { OCCASIONS, suggest } from '../lib/recommend.js';
import { Z_ORDER } from '../lib/fit.js';
import AiBar from '../components/AiBar.jsx';
import WeatherBar from '../components/WeatherBar.jsx';
import SuggestionCard from '../components/SuggestionCard.jsx';

export default function Suggest() {
  const nav = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [occasion, setOccasion] = useState('everyday');
  const [weather, setWeather] = useState(null);
  const [round, setRound] = useState(0); // bump to draw a fresh set of ideas
  const [usage, setUsage] = useState(null); // AI quota, null = AI not offered
  const [ai, setAi] = useState(null); // AI ideas for the current occasion + weather
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');

  useEffect(() => {
    api('/items').then((d) => setItems(d.items)).catch((e) => setError(e.message));
    api('/suggest/usage').then(setUsage).catch(() => setUsage(null));
  }, []);

  // AI picks belong to one occasion + weather; changing either goes back to the built-in ideas.
  useEffect(() => { setAi(null); setAiNote(''); }, [occasion, weather?.key]);

  const rules = useMemo(() => (items ? suggest({ items, weather, occasion }) : []), [items, weather, occasion, round]);
  const ideas = ai ? ai.ideas : rules;

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!items) return <p className="center-note">Loading your closet…</p>;

  const NOTES = {
    user_limit: "You have used today's AI picks. The built-in ideas keep working.",
    global_limit: 'AI picks are resting for today. Showing the built-in ideas.',
    closet: 'Add a dress, or a top and a bottom, to get AI picks.',
  };

  // Any failure just keeps the built-in ideas on screen.
  const askAi = async () => {
    setAiBusy(true);
    setAiNote('');
    try {
      const r = await api('/suggest', {
        method: 'POST',
        body: { occasion, weather: weather ? { bucket: weather.bucket, rainy: weather.rainy } : null },
      });
      if (typeof r.remaining === 'number') setUsage((u) => (u ? { ...u, remaining: r.remaining } : u));
      const byId = Object.fromEntries(items.map((i) => [i.id, i]));
      const mapped = (r.ideas || [])
        .map((o) => {
          const list = o.itemIds.map((id) => byId[id]).filter(Boolean)
            .sort((a, b) => Z_ORDER.indexOf(a.category) - Z_ORDER.indexOf(b.category));
          return { key: list.map((i) => i.id).join('|'), itemIds: list.map((i) => i.id), items: list, why: o.why, missing: [] };
        })
        .filter((o) => o.items.length > 0);
      if (mapped.length) setAi({ ideas: mapped, source: r.source });
      else setAiNote(NOTES[r.reason] || 'AI picks are not available right now. Showing the built-in ideas.');
    } catch {
      setAiNote('AI picks are not available right now. Showing the built-in ideas.');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <section>
      <div className="closet-head"><h2>Suggestions</h2></div>
      <WeatherBar weather={weather} onWeather={setWeather} />

      <div className="chips" aria-label="Occasion">
        {OCCASIONS.map((o) => (
          <button key={o.id} className={o.id === occasion ? 'chip on' : 'chip'} aria-pressed={o.id === occasion} onClick={() => setOccasion(o.id)}>{o.label}</button>
        ))}
      </div>

      {usage?.enabled && <AiBar usage={usage} busy={aiBusy} active={Boolean(ai)} note={aiNote} onAsk={askAi} />}

      {ideas.length === 0 ? (
        <div className="empty">
          <p>Add a few tops and bottoms (or a dress) to get outfit ideas.</p>
          <button className="primary" onClick={() => nav('/closet')}>Go to closet</button>
        </div>
      ) : (
        <div className="stack">
          <p className="muted hint">{ai ? 'AI stylist picks' : 'Built-in stylist'}</p>
          <ul className="outfit-list">{ideas.map((idea) => <SuggestionCard key={idea.key} idea={idea} />)}</ul>
          <button className="secondary wide" onClick={() => { setAi(null); setRound((r) => r + 1); }}>Show other ideas</button>
        </div>
      )}
    </section>
  );
}
