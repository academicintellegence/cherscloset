import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Account() {
  const { user, logout } = useAuth();
  const [action, setAction] = useState(null); // 'data' | 'account' while asking for the password
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function download() {
    setError('');
    try {
      const data = await api('/account/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      Object.assign(document.createElement('a'), { href: url, download: 'digital-closet-data.json' }).click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  }

  async function confirmDelete(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(action === 'account' ? '/account' : '/account/data', { method: 'DELETE', body: { password } });
      if (action === 'account') return logout();
      setMsg('All your items, avatars and outfits were deleted.');
      setAction(null);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h2>Account</h2>
      <p className="muted">{user.displayName} · {user.email}</p>
      {msg && <p className="notice">{msg}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <button className="secondary" onClick={download}>Download my data</button>
      <Link to="/privacy">Privacy: who sees what</Link>

      <h3>Delete</h3>
      {action ? (
        <form className="stack" onSubmit={confirmDelete}>
          <p>
            {action === 'account'
              ? 'This permanently deletes your account and everything in it, including your photos.'
              : 'This permanently deletes every item, avatar and outfit (and their photos). Your login stays.'}{' '}
            Enter your password to confirm.
          </p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} required autoComplete="current-password" aria-label="Password" />
          <button className="primary danger" disabled={busy}>{busy ? 'Deleting…' : 'Delete permanently'}</button>
          <button type="button" className="secondary" onClick={() => { setAction(null); setPassword(''); setError(''); }}>Cancel</button>
        </form>
      ) : (
        <>
          <button className="secondary" onClick={() => setAction('data')}>Delete all my data, keep my account</button>
          <button className="secondary" onClick={() => setAction('account')}>Delete my account</button>
        </>
      )}
    </section>
  );
}
