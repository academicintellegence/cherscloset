import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import TabBar from './TabBar.jsx';

// Protected shell: redirects to /login when signed out, otherwise shows the page above the tab bar.
export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <p className="center-note">Loading… (the server can take ~30s to wake up)</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="shell">
      <header className="topbar">
        <strong>Digital Closet</strong>
        <span className="top-links">
          <Link to="/account">Account</Link>
          <button className="link" onClick={logout}>Sign out</button>
        </span>
      </header>
      <main className="page">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <TabBar />
    </div>
  );
}
