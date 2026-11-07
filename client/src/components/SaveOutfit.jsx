import { useState } from 'react';
import Sheet from './Sheet.jsx';

export default function SaveOutfit({ initial, isUpdate, busy, error, onSave, onClose }) {
  const [name, setName] = useState(initial.name);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [favorite, setFavorite] = useState(initial.favorite);

  const submit = (e) => {
    e.preventDefault();
    onSave({ name: name.trim(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean), favorite });
  };

  return (
    <Sheet title={isUpdate ? 'Update outfit' : 'Save outfit'} onClose={onClose}>
      <form className="item-form" onSubmit={submit}>
        <label>Name
          <input value={name} maxLength={60} required autoFocus onChange={(e) => setName(e.target.value)} />
        </label>
        <label>Tags <span className="muted">(comma separated, optional)</span>
          <input value={tags} placeholder="date night, summer" onChange={(e) => setTags(e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} /> Favorite
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary wide" disabled={busy || !name.trim()}>{busy ? 'Saving…' : isUpdate ? 'Update' : 'Save'}</button>
      </form>
    </Sheet>
  );
}
