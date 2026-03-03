import { Link, useLocation } from 'react-router-dom';
import { Car, GitCompare, Search } from 'lucide-react';

export function Navbar() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home', icon: Car },
    { to: '/compare', label: 'Compare', icon: GitCompare },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2 font-pixel text-primary text-sm">
          <Car className="w-5 h-5" />
          <span className="hidden sm:inline">Repo Parking Lot</span>
        </Link>

        <div className="flex items-center gap-4">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 text-xs font-pixel transition-colors ${
                location.pathname === to
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
