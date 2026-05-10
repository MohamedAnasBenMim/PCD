import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Upload,
  History,
  Users,
  HelpCircle,
  Eye,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/upload', icon: Upload, label: 'Upload Scan' },
  { to: '/app/history', icon: History, label: 'History' },
  { to: '/app/users', icon: Users, label: 'Doctor Profile' },
  { to: '/app/support', icon: HelpCircle, label: 'Support' },
];

function getDoctorName(user: { email?: string; firstName?: string; lastName?: string } | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return `Dr. ${fullName}`;

  const emailName = user?.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (emailName) return `Dr. ${emailName}`;

  return 'Doctor';
}

function getDoctorInitials(user: { email?: string; firstName?: string; lastName?: string } | null) {
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((part) => part?.[0])
    .join('')
    .toUpperCase();

  return initials || user?.email?.[0]?.toUpperCase() || 'DR';
}

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const doctorName = getDoctorName(auth.user);
  const doctorInitials = getDoctorInitials(auth.user);

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  function handleLogout() {
    auth.logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <aside className="hidden w-72 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] backdrop-blur-xl lg:flex">
        <div className="border-b border-[var(--sidebar-border)] p-5">
          <Link to="/app" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)] shadow-lg shadow-cyan-950/25">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base tracking-tight text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                Diabetic <span className="text-[var(--clinical-blue)]">EyeDx</span>
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">AI Diagnostics</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  active
                    ? 'bg-[var(--sidebar-accent)] text-[var(--clinical-cyan)] shadow-[inset_3px_0_0_var(--clinical-cyan)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--sidebar-border)] p-4">
          <div className="mb-4 rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Queue health</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>23</div>
              <div className="rounded-full bg-[var(--warning-yellow)]/12 px-2.5 py-1 text-xs text-[var(--warning-yellow)]">Needs review</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[var(--sidebar-accent)] px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)]">
              <span className="text-sm text-white">{doctorInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{doctorName}</div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">Doctor</div>
            </div>
            <button
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Sign out"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--surface-strong)]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)]">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>EyeDx</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-lg p-2 ${isActive(item.to) ? 'bg-[var(--sidebar-accent)] text-[var(--clinical-cyan)]' : 'text-[var(--muted-foreground)]'}`}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="min-h-full clinical-shell">
          <div className="hidden border-b border-[var(--glass-border)] bg-[var(--surface-strong)]/72 px-8 py-4 backdrop-blur-xl lg:flex lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                className="h-10 w-full rounded-lg border border-[var(--glass-border)] bg-white/[0.035] pl-10 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                placeholder="Search scans, patients, or reports"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-2 text-[var(--muted-foreground)] hover:text-white" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <Link to="/app/upload" className="rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2 text-sm text-white hover:opacity-95">
                New scan
              </Link>
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
