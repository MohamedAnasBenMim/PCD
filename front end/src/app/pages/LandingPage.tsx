import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { GlassCard } from '../components/GlassCard';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  FileScan,
  Shield,
  Sparkles,
  Stethoscope,
  Zap,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function LandingPage() {
  return (
    <div className="min-h-screen clinical-shell">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:pb-20">
        <div className="clinical-grid absolute inset-x-0 top-0 h-[580px]" />
        <div className="absolute inset-0 opacity-[0.16]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1761086555461-1098623cb04b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1hbiUyMGV5ZSUyMGlyaXMlMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3NjExMzg1OHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted-foreground)] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[var(--success-green)] shadow-[0_0_18px_rgba(16,185,129,0.9)]" />
                Clinical decision support for retinal screening
              </div>

              <h1 className="max-w-4xl text-5xl leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                Diabetic Retinopathy AI Triage
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)] sm:text-xl">
                A polished diagnostic workspace for uploading retinal fundus images, reviewing confidence scores, and routing suspicious scans to clinical review faster.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-6 py-3 text-white shadow-xl shadow-cyan-950/25 hover:opacity-95"
                >
                  Start Analyzing
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--glass-border)] bg-white/[0.04] px-6 py-3 text-white backdrop-blur-xl hover:bg-white/[0.07]"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  { value: '99.2%', label: 'Model accuracy' },
                  { value: '250K+', label: 'Scans processed' },
                  { value: '<2s', label: 'Avg. response' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-4 backdrop-blur">
                    <div className="text-2xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <GlassCard className="relative overflow-hidden p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="rounded-lg border border-[var(--glass-border)] bg-[#050a12] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--muted-foreground)]">Current case</div>
                    <div className="mt-1 text-lg" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>Fundus Analysis</div>
                  </div>
                  <div className="rounded-full bg-[var(--success-green)]/12 px-3 py-1 text-xs text-[var(--success-green)]">Ready</div>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-950">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1583912086096-8c60d75a53f9?auto=format&fit=crop&q=80&w=1000"
                    alt="Retinal scan preview"
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_47%,transparent_0,transparent_34%,rgba(7,11,19,0.18)_36%,rgba(7,11,19,0.64)_69%)]" />
                  <div className="absolute left-5 top-5 rounded-full border border-cyan-300/60 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100 backdrop-blur">Macula centered</div>
                  <div className="absolute bottom-5 right-5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-strong)]/88 p-3 backdrop-blur">
                    <div className="text-xs text-[var(--muted-foreground)]">Confidence</div>
                    <div className="text-2xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>96.8%</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: FileScan, label: 'Quality', value: 'High' },
                    { icon: Activity, label: 'Severity', value: 'Moderate' },
                    { icon: Stethoscope, label: 'Action', value: 'Review' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-3">
                      <item.icon className="mb-2 h-4 w-4 text-[var(--clinical-cyan)]" />
                      <div className="text-xs text-[var(--muted-foreground)]">{item.label}</div>
                      <div className="mt-1 text-sm text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--clinical-cyan)]">
              <Sparkles className="h-4 w-4" />
              Diagnostic workflow
            </div>
            <h2 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
              Built for screening teams that need speed and traceability
            </h2>
            <p className="mt-4 text-lg text-[var(--muted-foreground)]">
              Focused tools for scan intake, model output review, and clinician handoff.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: 'Fast Triage',
                description: 'Prioritize suspicious scans with model output surfaced in seconds.',
              },
              {
                icon: Eye,
                title: 'Stage Detection',
                description: 'Classify No DR, Mild, Moderate, and Severe stages with confidence.',
              },
              {
                icon: Shield,
                title: 'Secure Workflow',
                description: 'Designed around protected patient data and controlled access.',
              },
              {
                icon: BarChart3,
                title: 'Audit-Ready Reports',
                description: 'Track decisions, confidence, status, and review outcomes.',
              },
            ].map((feature, i) => (
              <GlassCard key={i} className="group p-6 hover:border-cyan-300/40">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] group-hover:bg-[var(--clinical-cyan)]/12">
                  <feature.icon className="h-5 w-5 text-[var(--clinical-cyan)]" />
                </div>
                <h3 className="mb-2 text-lg text-white">{feature.title}</h3>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                A clear path from image to review
              </h2>
              <p className="mt-3 text-lg text-[var(--muted-foreground)]">
                Keep the clinical workflow legible from first upload to final report.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Upload Image',
                description: 'Upload high-quality retinal fundus images in standard formats',
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Our PyTorch model analyzes patterns and detects anomalies',
              },
              {
                step: '03',
                title: 'Get Results',
                description: 'Receive detailed report with severity level and confidence score',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <GlassCard className="h-full p-6">
                  <div className="mb-6 text-sm text-[var(--clinical-cyan)]" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-xl text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </GlassCard>
                {i < 2 && (
                  <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-gradient-to-r from-[var(--clinical-cyan)] to-transparent md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <GlassCard className="mx-auto max-w-4xl p-6 text-center sm:p-10">
            <h2 className="mb-4 text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[var(--muted-foreground)]">
              Join thousands of healthcare professionals using AI to detect diabetic retinopathy early
            </p>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {['HIPAA Compliant', 'FDA Approved', '24/7 Support'].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white/[0.035] px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success-green)]" />
                  <span className="text-sm">{badge}</span>
                </div>
              ))}
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-6 py-3 text-white hover:opacity-95"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--glass-border)] px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-[var(--muted-foreground)]">
          <p>&copy; 2026 Diabetic EyeDx. All rights reserved. Built with React, Node.js, PyTorch & PostgreSQL.</p>
        </div>
      </footer>
    </div>
  );
}
