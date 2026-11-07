import { CATEGORIES, PATTERNS, SEASONS, STYLES } from '../constants.js';

// Fields shared by the add and edit sheets. `form` = { name, category, color, style, pattern, season }.
export default function ItemForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="item-form">
      <label>
        Name
        <input value={form.name} onChange={set('name')} maxLength={60} placeholder="e.g. Blue denim jacket" />
      </label>
      <label>
        Category
        <select value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </label>
      <TagSelect label="Style" value={form.style} options={STYLES} onChange={set('style')} />
      <TagSelect label="Pattern" value={form.pattern} options={PATTERNS} onChange={set('pattern')} />
      <TagSelect label="Season" value={form.season} options={SEASONS} onChange={set('season')} />
      <label>
        Main color
        <input type="color" value={form.color} onChange={set('color')} />
      </label>
    </div>
  );
}

function TagSelect({ label, value, options, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={onChange}>
        <option value="">Not set</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
