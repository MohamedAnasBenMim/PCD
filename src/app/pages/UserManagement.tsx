import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../lib/auth';
import { ShieldCheck, Mail, Building2, UserCircle2 } from 'lucide-react';

export function UserManagement() {
  const auth = useAuth();
  const doctorName = [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ').trim() || 'Doctor';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
          Doctor Profile
        </h1>
        <p className="text-[var(--muted-foreground)]">
          This workspace is restricted to doctors only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-cyan)] flex items-center justify-center">
              <UserCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                {doctorName}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">Logged in doctor</div>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3">
              <span className="text-[var(--muted-foreground)]">Email</span>
              <span className="text-white">{auth.user?.email || 'Not available'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3">
              <span className="text-[var(--muted-foreground)]">Role</span>
              <span className="text-[var(--success-green)]">Doctor</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3">
              <span className="text-[var(--muted-foreground)]">Access</span>
              <span className="text-[var(--success-green)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Restricted
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl mb-4 text-white" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            Doctor-only workflow
          </h2>
          <div className="space-y-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 mt-0.5 text-[var(--clinical-blue)]" />
              <p>Doctors sign in with their email and password.</p>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 mt-0.5 text-[var(--clinical-blue)]" />
              <p>The doctor uploads retinal images of patients for analysis.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-[var(--clinical-blue)]" />
              <p>Only authenticated doctors can access the dashboard, upload form, and history.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
