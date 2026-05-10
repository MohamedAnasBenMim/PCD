import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Lock, Mail, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@eyedx.local');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await fetch(`${apiBase}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await resp.json();
      if (!resp.ok) throw new Error(body.message || 'Admin login failed');

      localStorage.setItem('adminToken', body.token);
      localStorage.setItem('adminUser', JSON.stringify(body.user));
      navigate('/admin');
    } catch (err: any) {
      setError(err?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[#0c1422] to-[var(--background)]">
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-20 blur-[80px]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&q=80&w=1200"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-cyan)]">
            <Eye className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl tracking-tight" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            Diabetic <span className="text-[var(--clinical-blue)]">EyeDx</span>
          </span>
        </Link>

        <GlassCard className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
              <ShieldCheck className="h-6 w-6 text-[var(--clinical-cyan)]" />
            </div>
            <h1 className="mb-2 text-2xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
              Admin Login
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Secure access for platform management
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="adminEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="h-12 border-[var(--glass-border)] bg-[var(--input-background)] pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="h-12 border-[var(--glass-border)] bg-[var(--input-background)] pl-11"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 px-3 py-2 text-sm text-[var(--error-red)]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)] hover:opacity-90"
            >
              {loading ? 'Checking access...' : 'Access Admin Panel'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            <Link to="/login" className="hover:text-[var(--foreground)]">
              Return to doctor login
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
