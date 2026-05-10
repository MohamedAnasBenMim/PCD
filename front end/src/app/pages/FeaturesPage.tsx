import { Link } from 'react-router';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  Lock,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard } from '../components/GlassCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const primaryFeatures = [
  {
    icon: Upload,
    title: 'Guided Image Intake',
    description: 'Accept retinal fundus images, surface upload status, and keep every scan tied to a reviewable case.',
  },
  {
    icon: Brain,
    title: 'AI Severity Scoring',
    description: 'Classify diabetic retinopathy stages with confidence values that help teams prioritize suspicious scans.',
  },
  {
    icon: Search,
    title: 'Review-First Results',
    description: 'Present model findings in a clear result view so clinicians can inspect severity, confidence, and next action.',
  },
  {
    icon: FileText,
    title: 'Structured Reports',
    description: 'Keep analysis output consistent for handoff, follow-up, and historical review.',
  },
];

const workflowFeatures = [
  'Role-aware dashboard access',
  'Case history for previous scans',
  'Confidence and status tracking',
  'Clinician support channel',
  'Reusable diagnosis workflow',
  'Audit-friendly case records',
];

const reviewSignals = [
  { label: 'Image quality', value: 'High', icon: Eye },
  { label: 'AI confidence', value: '96.8%', icon: Activity },
  { label: 'Review path', value: 'Clinician', icon: Users },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen clinical-shell">
      <Navbar />

      <main>
        <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 lg:pb-20">
          <div className="clinical-grid absolute inset-x-0 top-0 h-[560px]" />
          <div className="absolute inset-0 opacity-[0.13]">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1583912086096-8c60d75a53f9?auto=format&fit=crop&q=80&w=1400"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--clinical-cyan)] backdrop-blur-xl">
                  <ShieldCheck className="h-4 w-4" />
                  Features
                </div>
                <h1 className="text-5xl leading-[1.04] tracking-normal text-white sm:text-6xl" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Screening tools for faster diabetic retinopathy triage
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                  Diabetic EyeDx brings scan upload, AI analysis, result review, and case history into one focused workspace for medical teams.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-6 py-3 text-white shadow-xl shadow-cyan-950/25 hover:opacity-95"
                  >
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.04] px-6 py-3 text-white backdrop-blur-xl hover:bg-white/[0.07]"
                  >
                    About the Platform
                  </Link>
                </div>
              </div>

              <GlassCard className="overflow-hidden p-5">
                <div className="rounded-lg border border-[var(--glass-border)] bg-[#050a12] p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-[var(--muted-foreground)]">Triage queue</div>
                      <div className="mt-1 text-xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                        Case Review Snapshot
                      </div>
                    </div>
                    <div className="rounded-full bg-[var(--success-green)]/12 px-3 py-1 text-xs text-[var(--success-green)]">
                      Live
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {reviewSignals.map((signal) => (
                      <div key={signal.label} className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-4">
                        <signal.icon className="mb-3 h-5 w-5 text-[var(--clinical-cyan)]" />
                        <div className="text-xs text-[var(--muted-foreground)]">{signal.label}</div>
                        <div className="mt-1 text-lg text-white">{signal.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm text-white">Moderate DR probability</span>
                      <span className="text-sm text-[var(--clinical-cyan)]">72%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)]" />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[var(--success-green)]" />
                        Prioritized for clinician review
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[var(--warning-yellow)]" />
                        Report draft ready after analysis
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 max-w-3xl">
              <h2 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                Core platform capabilities
              </h2>
              <p className="mt-4 text-lg leading-8 text-[var(--muted-foreground)]">
                Each feature is designed to reduce friction around retinal scan review while keeping clinical judgment central.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {primaryFeatures.map((feature) => (
                <GlassCard key={feature.title} className="p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                    <feature.icon className="h-5 w-5 text-[var(--clinical-cyan)]" />
                  </div>
                  <h3 className="mb-2 text-lg text-white">{feature.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <GlassCard className="p-6 sm:p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                <ClipboardCheck className="h-5 w-5 text-[var(--clinical-cyan)]" />
              </div>
              <h2 className="text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                Designed around the clinical handoff
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
                The interface keeps each case organized from upload through result review, making it easier to decide what should be escalated, monitored, or documented.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {workflowFeatures.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-3 text-sm text-[var(--muted-foreground)]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success-green)]" />
                    {item}
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: BarChart3,
                  title: 'Operational visibility',
                  body: 'Dashboard summaries help users scan recent activity, case volume, and review status quickly.',
                },
                {
                  icon: Lock,
                  title: 'Controlled access',
                  body: 'Authentication protects the clinical workspace and keeps user-specific records separated.',
                },
                {
                  icon: Activity,
                  title: 'Severity context',
                  body: 'Results pair classification with confidence so the model output is easier to interpret.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Human oversight',
                  body: 'The platform supports decision-making and review instead of replacing medical diagnosis.',
                },
              ].map((item) => (
                <GlassCard key={item.title} className="p-6">
                  <item.icon className="mb-5 h-6 w-6 text-[var(--clinical-cyan)]" />
                  <h3 className="mb-2 text-lg text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{item.body}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--glass-border)] px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-[var(--muted-foreground)]">
          <p>&copy; 2026 Diabetic EyeDx. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
