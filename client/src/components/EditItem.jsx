import { useState } from 'react';
import { api } from '../api.js';
import ItemForm from './ItemForm.jsx';
import Sheet from './Sheet.jsx';

export default function EditItem({ item, onClose, onUpdated, onDeleted }) {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    color: item.color,
    style: item.style || '',
    pattern: item.pattern || '',
    season: item.season || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn) {
    setError('');
    setBusy(true);
    try {
      await fn();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      const name = form.name.trim() || item.name;
      const { item: updated } = await api(`/items/${item.id}`, { method: 'PATCH', body: { ...form, name } });
      onUpdated(updated);
    });

  const remove = () => {
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    run(async () => {
      await api(`/items/${item.id}`, { method: 'DELETE' });
      onDeleted(item.id);
    });
  };

  return (
    <Sheet title="Edit item" onClose={onClose}>
      <div className="stack">
        <img className="preview checker" src={item.imageUrl} alt={item.name} />
        <ItemForm form={form} setForm={setForm} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary wide" onClick={save} disabled={busy}>Save changes</button>
        <button className="danger wide" onClick={remove} disabled={busy}>Delete item</button>
      </div>
    </Sheet>
  );
}
