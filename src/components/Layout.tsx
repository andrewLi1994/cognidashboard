import { Link, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: '概览' },
  { path: '/timeline', label: '时间线' },
  { path: '/topics', label: '话题图谱' },
  { path: '/insights', label: 'AI 洞察' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <header className="border-b border-border-subtle bg-surface-alt/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight text-accent-alt">
            CogniBoard
          </Link>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-accent/20 text-accent-alt'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
