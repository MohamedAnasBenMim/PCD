import { Link, useNavigate } from 'react-router';
import { useState, FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { GlassCard } from '../components/GlassCard';
import { Eye, Mail, Lock, User, Building2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!terms) return setError('You must accept the terms.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, organization, password }),
      });

      const body = await resp.json();
      if (!resp.ok) throw new Error(body.message || 'Registration failed');

      auth.login(body.token, body.user);
      navigate('/app');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[#0d1220] to-[var(--background)]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] opacity-30 blur-[120px]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1764773963911-01313b5b4002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxodW1hbiUyMGV5ZSUyMGlyaXMlMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3NjExMzg1OHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-20 blur-[120px]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1763325227595-f487ced4c1c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxodW1hbiUyMGV5ZSUyMGlyaXMlMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3NjExMzg1OHww&ixlib=rb-4.1.0&q=80&w=1080"
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
              Doctor Account
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Create a doctor account for the AI diagnostics platform
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className="bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                />
              </div>
            </div>

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
                  className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  id="organization"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="City Medical Center"
                  className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--input-background)] mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-[var(--clinical-blue)] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[var(--clinical-blue)] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)] hover:opacity-90"
            >
              {loading ? 'Creating…' : 'Create Doctor Account'}
            </Button>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--clinical-blue)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
