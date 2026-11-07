import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/closet', label: 'Closet', icon: '👚' },
  { to: '/avatar', label: 'Avatar', icon: '🧍' },
  { to: '/outfits', label: 'Outfits', icon: '💖' },
  { to: '/suggest', label: 'Suggest', icon: '✨' },
];

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
