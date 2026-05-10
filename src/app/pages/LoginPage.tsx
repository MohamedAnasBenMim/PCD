import { Link, useNavigate } from 'react-router';
import { useState, FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { GlassCard } from '../components/GlassCard';
import { Eye, Mail, Lock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await resp.json();
      if (!resp.ok) throw new Error(body.message || 'Login failed');

      auth.login(body.token, body.user);
      navigate('/app');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[#0d1220] to-[var(--background)]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30 blur-[120px]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1761086555461-1098623cb04b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1hbiUyMGV5ZSUyMGlyaXMlMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3NjExMzg1OHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-20 blur-[120px]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1772312390922-8730b99a4bbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxodW1hbiUyMGV5ZSUyMGlyaXMlMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3NjExMzg1OHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-cyan)] flex items-center justify-center">
            <Eye className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl tracking-tight" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            Diabetic <span className="text-[var(--clinical-blue)]">EyeDx</span>
          </span>
        </div>

        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl mb-2" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Welcome Back
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Doctor sign-in for AI diagnostics access
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--clinical-blue)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-12"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--input-background)]"
              />
              <label htmlFor="remember" className="text-sm text-[var(--muted-foreground)]">
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)] hover:opacity-90"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--clinical-blue)] hover:underline">
                Create account
              </Link>
            </p>
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Administrator?{' '}
              <Link to="/admin/login" className="text-[var(--clinical-blue)] hover:underline">
                Open admin login
              </Link>
            </p>
          </div>
        </GlassCard>

        <div className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          <p>
            This system is restricted to licensed doctors. By signing in, you agree to our{' '}
            <Link to="/terms" className="hover:text-[var(--foreground)]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="hover:text-[var(--foreground)]">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
