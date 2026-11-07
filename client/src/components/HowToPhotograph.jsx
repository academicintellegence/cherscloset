import Sheet from './Sheet.jsx';

const TIPS = [
  ['🧺', 'Lay it flat or hang it', 'Smooth it out so the whole piece is visible.'],
  ['☀️', 'Use soft, even light', 'Near a window is best. Avoid harsh shadows.'],
  ['⬜', 'Plain, contrasting background', 'A bed sheet or clean floor. Not the same color as the clothes.'],
  ['📐', 'Fill the frame, shoot straight on', 'Hold the camera above (or in front of) the item, not at an angle.'],
  ['1️⃣', 'One item per photo', 'No hands, hangers or other clothes in the shot.'],
];

export default function HowToPhotograph({ onDone }) {
  return (
    <Sheet title="How to photograph" onClose={onDone}>
      <ul className="tips">
        {TIPS.map(([icon, title, text]) => (
          <li key={title}>
            <span aria-hidden="true">{icon}</span>
            <div>
              <strong>{title}</strong>
              <p className="muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <button className="primary wide" onClick={onDone}>Got it</button>
    </Sheet>
  );
}
