import { buildMannequin, VIEWBOX } from '../lib/mannequin.js';

function Part({ part }) {
  if (part.kind === 'path') return <path d={part.d} fill="currentColor" />;
  if (part.kind === 'line') {
    return <line x1={part.x1} y1={part.y1} x2={part.x2} y2={part.y2} stroke="currentColor" strokeWidth={part.w} strokeLinecap="round" />;
  }
  const { cx, cy, rx, ry, rot } = part;
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="currentColor" transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined} />;
}

export default function Mannequin({ params, showAnchors = false }) {
  const { parts, anchors, shadow } = buildMannequin(params);
  return (
    <svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} role="img" aria-label="Mannequin preview">
      <ellipse className="mq-shadow" {...shadow} />
      <g className="mq-body">
        {parts.map((part, i) => <Part key={i} part={part} />)}
      </g>
      {showAnchors &&
        Object.entries(anchors).map(([name, { x, y }]) => (
          <circle key={name} className="mq-anchor" cx={x} cy={y} r="2.8"><title>{name}</title></circle>
        ))}
    </svg>
  );
}
