import { useNavigate } from 'react-router-dom';

export default function SuggestionCard({ idea }) {
  const nav = useNavigate();
  return (
    <li className="outfit-card">
      <div className="thumbs big">
        {idea.items.map((i) => <img key={i.id} className="checker" src={i.imageUrl} alt={i.name} loading="lazy" />)}
      </div>
      <p className="why">{idea.why}</p>
      {idea.missing.length > 0 && <p className="muted hint">Add {idea.missing.join(' and ')} to your closet to complete this look.</p>}
      <button className="primary" onClick={() => nav('/outfits/new', { state: { itemIds: idea.itemIds } })}>Try it on</button>
    </li>
  );
}
