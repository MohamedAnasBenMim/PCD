import { Link } from 'react-router';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Eye,
  FileSearch,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard } from '../components/GlassCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const principles = [
  {
    icon: Stethoscope,
    title: 'Clinician-centered',
    description: 'AI output is framed as triage support so medical professionals remain in control of interpretation and follow-up.',
  },
  {
    icon: Eye,
    title: 'Retina-specific',
    description: 'The product experience focuses on retinal fundus screening instead of a generic document or image workflow.',
  },
  {
    icon: ShieldCheck,
    title: 'Responsible by design',
    description: 'Clear confidence values, review status, and case history reduce ambiguity around model-assisted decisions.',
  },
];

const lifecycle = [
  {
    step: '01',
    title: 'Image Intake',
    text: 'Retinal scans are uploaded into a controlled workspace and attached to a reviewable analysis case.',
  },
  {
    step: '02',
    title: 'Model Analysis',
    text: 'The AI service evaluates the scan and returns a severity class with a confidence score.',
  },
  {
    step: '03',
    title: 'Clinical Review',
    text: 'Results are surfaced for human review, reporting, and follow-up decisions.',
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen clinical-shell">
      <Navbar />

      <main>
        <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 lg:pb-20">
          <div className="clinical-grid absolute inset-x-0 top-0 h-[560px]" />
          <div className="absolute inset-0 opacity-[0.14]">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&q=80&w=1400"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--clinical-cyan)] backdrop-blur-xl">
                  <HeartPulse className="h-4 w-4" />
                  About Diabetic EyeDx
                </div>
                <h1 className="text-5xl leading-[1.04] tracking-normal text-white sm:text-6xl" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Practical AI support for earlier retinal screening action
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                  Diabetic EyeDx is built to help care teams move from retinal image capture to informed review with less delay, clearer case context, and accountable AI output.
                </p>
              </div>

              <GlassCard className="p-6 sm:p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                  <Users className="h-6 w-6 text-[var(--clinical-cyan)]" />
                </div>
                <h2 className="text-2xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  Built for screening teams
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
                  The platform connects frontend review tools, a Node API, an AI inference service, and patient-safe workflow patterns into a single clinical interface.
                </p>
                <div className="mt-7 grid gap-3">
                  {['Retinal image upload', 'AI-assisted severity scoring', 'Doctor-facing review history'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--success-green)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 max-w-3xl">
              <h2 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                What guides the platform
              </h2>
              <p className="mt-4 text-lg leading-8 text-[var(--muted-foreground)]">
                The experience is intentionally narrow: help medical users review diabetic retinopathy screening cases with speed, clarity, and oversight.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {principles.map((item) => (
                <GlassCard key={item.title} className="p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                    <item.icon className="h-5 w-5 text-[var(--clinical-cyan)]" />
                  </div>
                  <h3 className="mb-2 text-lg text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <GlassCard className="p-6 sm:p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                <Brain className="h-6 w-6 text-[var(--clinical-cyan)]" />
              </div>
              <h2 className="text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                From model output to accountable review
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
                Diabetic EyeDx separates model assistance from clinical authority. The AI result helps prioritize attention, while doctors retain responsibility for diagnosis and treatment decisions.
              </p>
              <Link
                to="/features"
                className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-5 py-3 text-sm text-white hover:opacity-95"
              >
                Explore Features
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>

            <div className="grid gap-4 md:grid-cols-3">
              {lifecycle.map((item) => (
                <GlassCard key={item.step} className="p-6">
                  <div className="mb-5 text-sm text-[var(--clinical-cyan)]" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-xl text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{item.text}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <GlassCard className="grid gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                  <FileSearch className="h-6 w-6 text-[var(--clinical-cyan)]" />
                </div>
                <h2 className="text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  Transparent clinical context
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
                  The interface emphasizes case state, severity, confidence, and historical records so teams can understand what happened before taking the next step.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: '4', label: 'DR severity stages' },
                  { value: '<2s', label: 'Target response time' },
                  { value: '24/7', label: 'Support workflow' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-5">
                    <div className="text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm leading-5 text-[var(--muted-foreground)]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
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
