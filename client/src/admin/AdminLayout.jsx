import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, ExternalLink, Images, Inbox, Layers, LayoutDashboard, LogOut, Package, Settings, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/States';
import { useEffect } from 'react';

const NAV = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/series', 'Series', Layers],
  ['/admin/chapters', 'Chapters', BookOpen],
  ['/admin/products', 'Products', Package],
  ['/admin/media', 'Images', Images],
  ['/admin/orders', 'Orders', ShoppingBag],
  ['/admin/inbox', 'Inbox', Inbox],
  ['/admin/settings', 'Settings', Settings],
];

export default function AdminLayout() {
  const { user, loading, isAdmin, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Admin — QUIET BATTLES™';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  if (loading) return <div className="min-h-screen"><Spinner label="Checking session" /></div>;
  // Route guard: not logged in (or not an admin) -> login page. The server checks again on every API call.
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const link = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-graphite text-bone' : 'text-bone/60 hover:bg-coal hover:text-bone'}`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b border-graphite bg-coal lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="font-display text-lg tracking-[0.08em] whitespace-nowrap">QUIET BATTLES™</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider2 text-ash">Admin</p>
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-3 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
          {NAV.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <Icon size={16} strokeWidth={1.6} /> <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-graphite p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p className="truncate text-xs text-ash">{user.email}</p>
          <div className="mt-3 flex gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="adm-btn flex-1 justify-center"><ExternalLink size={13} /> Site</a>
            <button className="adm-btn flex-1 justify-center" onClick={logout}><LogOut size={13} /> Logout</button>
          </div>
        </div>
        <div className="flex gap-2 border-t border-graphite p-3 lg:hidden">
          <a href="/" target="_blank" rel="noopener noreferrer" className="adm-btn"><ExternalLink size={13} /> Site</a>
          <button className="adm-btn" onClick={logout}><LogOut size={13} /> Logout</button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10"><Outlet /></main>
    </div>
  );
}
