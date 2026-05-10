import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Activity, Eye, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', to: '/features' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm ${isActive ? 'text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--glass-border)] bg-[var(--surface-strong)]/88 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)] shadow-lg shadow-cyan-950/30">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: 'Outfit' }}>
              Diabetic <span className="text-[var(--clinical-blue)]">EyeDx</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2 text-sm text-white shadow-lg shadow-cyan-950/20 hover:opacity-95"
            >
              <Activity className="h-4 w-4" />
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.03] text-[var(--foreground)] md:hidden"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-3 grid gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-strong)] p-3 md:hidden">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/[0.07] text-white' : 'text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:text-[var(--foreground)]'}`
                }
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:text-[var(--foreground)]"
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2 text-sm text-white shadow-lg shadow-cyan-950/20 hover:opacity-95"
              onClick={() => setMobileOpen(false)}
            >
              <Activity className="h-4 w-4" />
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
