// Optional AI stylist row. Shows how many of today's picks are left.
export default function AiBar({ usage, busy, active, note, onAsk }) {
  return (
    <div className="ai-bar">
      <button className="secondary" onClick={onAsk} disabled={busy || active || !usage.available}>
        {busy ? 'Asking…' : active ? 'AI picks shown' : 'Ask the AI stylist'}
      </button>
      <span className="muted hint" title="Resets at midnight UTC">
        {usage.available ? `${usage.remaining} of ${usage.limit} AI picks left today` : 'AI picks are resting today'}
      </span>
      {note && <p className="notice">{note}</p>}
    </div>
  );
}
