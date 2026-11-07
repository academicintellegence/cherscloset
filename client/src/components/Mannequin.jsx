import { buildMannequin, VIEWBOX } from '../lib/mannequin.js';

function Part({ part }) {
  if (part.kind === 'path') return <path d={part.d} fill="currentColor" />;
  if (part.kind === 'line') {
    return <line x1={part.x1} y1={part.y1} x2={part.x2} y2={part.y2} stroke="currentColor" strokeWidth={part.w} strokeLinecap="round" />;
  }
  const { cx, cy, rx, ry, rot } = part;
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="currentColor" transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined} />;
}

// Measurement lines drawn across the body, labelled with the numbers they come from.
const lines = (A, p, male) => [
  { label: 'Shoulders', y: A.shoulderL.y, cm: p.shoulderCm },
  { label: male ? 'Chest' : 'Bust', y: A.bustL.y, cm: p.bustCm },
  { label: 'Waist', y: A.waistL.y, cm: p.waistCm },
  { label: 'Hips', y: A.hipL.y, cm: p.hipsCm },
];

export default function Mannequin({ params, showAnchors = false, showMeasures = false }) {
  const { parts, anchors, shadow, top } = buildMannequin(params);
  return (
    <svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} role="img" aria-label="Body drawn from your measurements">
      <ellipse className="mq-shadow" {...shadow} />
      <g className="mq-body">
        {parts.map((part, i) => <Part key={i} part={part} />)}
      </g>
      {showMeasures && (
        <g className="mq-measures" aria-hidden="true">
          {lines(anchors, params, params.body === 'male').map(({ label, y, cm }) => (
            <g key={label}>
              <line x1="2" x2="198" y1={y} y2={y} />
              <text x="198" y={y - 2} textAnchor="end">{label} {cm} cm</text>
            </g>
          ))}
          <text x="2" y={Math.max(8, top - 3)}>{params.heightCm} cm</text>
        </g>
      )}
      {showAnchors &&
        Object.entries(anchors).map(([name, { x, y }]) => (
          <circle key={name} className="mq-anchor" cx={x} cy={y} r="2.8"><title>{name}</title></circle>
        ))}
    </svg>
  );
}
