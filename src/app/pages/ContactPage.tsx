import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen clinical-shell">
      <Navbar />

      <main className="px-4 pb-16 pt-28 sm:px-6">
        <div className="clinical-grid absolute inset-x-0 top-0 h-[520px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--clinical-cyan)] backdrop-blur-xl">
              <MessageSquare className="h-4 w-4" />
              Contact Page
            </div>
            <h1 className="text-5xl leading-[1.04] tracking-normal text-white sm:text-6xl" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
              Contact the Diabetic EyeDx team
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
              Send feedback, report a technical issue, or request assistance with retinal image analysis workflows.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
            <GlassCard className="overflow-hidden">
              <div className="border-b border-[var(--glass-border)] px-6 py-5">
                <h2 className="text-xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  Send a Message
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Complete the form and the maintainers can review your request.
                </p>
              </div>

              <form className="space-y-5 p-6" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Full Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Dr. Sarah Johnson"
                      className="h-11 border-[var(--glass-border)] bg-[var(--input-background)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="doctor@hospital.com"
                        className="h-11 border-[var(--glass-border)] bg-[var(--input-background)] pl-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactCategory">Request Type</Label>
                    <select
                      id="contactCategory"
                      className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3 text-sm"
                    >
                      <option>Feedback</option>
                      <option>Technical Issue</option>
                      <option>Analysis Assistance</option>
                      <option>Account Support</option>
                      <option>Model Performance Concern</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPriority">Priority</Label>
                    <select
                      id="contactPriority"
                      className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3 text-sm"
                    >
                      <option>Normal</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactSubject">Subject</Label>
                  <Input
                    id="contactSubject"
                    placeholder="Briefly describe your request"
                    className="h-11 border-[var(--glass-border)] bg-[var(--input-background)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactMessage">Message</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-[var(--muted-foreground)]" />
                    <textarea
                      id="contactMessage"
                      rows={6}
                      placeholder="Write your feedback, issue report, or assistance request..."
                      className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] py-3 pl-11 pr-3 text-sm"
                    />
                  </div>
                </div>

                {submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--success-green)]/30 bg-[var(--success-green)]/10 px-3 py-2 text-sm text-[var(--success-green)]">
                    <CheckCircle2 className="h-4 w-4" />
                    Message prepared successfully for the interface demo.
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] hover:opacity-95"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Send Message
                </Button>
              </form>
            </GlassCard>

            <div className="space-y-6">
              <GlassCard className="p-6">
                <h2 className="mb-4 text-lg text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  Support Channels
                </h2>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: 'Email', value: 'support@diabeticeyedx.com' },
                    { icon: Phone, label: 'Phone', value: '+1 (800) 555-EYES' },
                    { icon: Clock, label: 'Response Time', value: 'Within 24 hours' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)]">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-white">{item.label}</div>
                        <div className="mt-1 text-xs text-[var(--muted-foreground)]">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  <AlertCircle className="h-5 w-5 text-[var(--clinical-cyan)]" />
                  Common Requests
                </h2>
                <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
                  {['Upload or analysis issue', 'Feedback about AI results', 'Account access problem', 'Request for platform assistance'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--success-green)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </GlassCard>

              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--glass-border)] bg-white/[0.04] px-5 py-3 text-sm text-white hover:bg-white/[0.07]"
              >
                Doctor Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--glass-border)] px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-[var(--muted-foreground)]">
          <p>&copy; 2026 Diabetic EyeDx. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
