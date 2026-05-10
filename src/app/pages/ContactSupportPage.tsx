import { GlassCard } from '../components/GlassCard';
import { Mail, MessageSquare, Phone, Send, HelpCircle, Clock } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function ContactSupportPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
          Contact Support
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Get help from our technical support team
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8">
            <h2 className="text-xl mb-6" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Send us a message
            </h2>

            <form className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
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
                    placeholder="doctor@hospital.com"
                    className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Issue Category</Label>
                <select
                  id="category"
                  className="w-full h-11 px-3 rounded-lg bg-[var(--input-background)] border border-[var(--glass-border)] text-sm"
                >
                  <option>Select a category</option>
                  <option>Technical Issue</option>
                  <option>Account Management</option>
                  <option>Billing & Subscription</option>
                  <option>Feature Request</option>
                  <option>AI Model Performance</option>
                  <option>Data Privacy & Security</option>
                  <option>General Inquiry</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <select
                  id="priority"
                  className="w-full h-11 px-3 rounded-lg bg-[var(--input-background)] border border-[var(--glass-border)] text-sm"
                >
                  <option>Low - General Question</option>
                  <option>Medium - Non-urgent Issue</option>
                  <option>High - Urgent Issue</option>
                  <option>Critical - System Down</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  className="bg-[var(--input-background)] border-[var(--glass-border)] h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-[var(--muted-foreground)]" />
                  <textarea
                    id="message"
                    rows={6}
                    placeholder="Please provide detailed information about your issue..."
                    className="w-full pl-11 pr-3 py-3 rounded-lg bg-[var(--input-background)] border border-[var(--glass-border)] text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  className="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--input-background)] mt-0.5"
                />
                <label htmlFor="consent" className="text-xs text-[var(--muted-foreground)]">
                  I consent to the collection and processing of my data for support purposes
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)] hover:opacity-90"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Support Info */}
        <div className="space-y-6">
          {/* Contact Methods */}
          <GlassCard className="p-6">
            <h3 className="text-lg mb-4" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
              Other Ways to Reach Us
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-cyan)] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm mb-1">Email Support</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    support@diabeticeyedx.com
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    Response within 24 hours
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm mb-1">Phone Support</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    +1 (800) 555-EYES
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    Mon-Fri, 9am-6pm EST
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm mb-1">Live Chat</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Available during business hours
                  </div>
                  <button className="text-xs text-[var(--clinical-blue)] mt-1 hover:underline">
                    Start chat →
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Support Hours */}
          <GlassCard className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--clinical-blue)]" />
              Support Hours
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Monday - Friday</span>
                <span>9:00 AM - 6:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Saturday</span>
                <span>10:00 AM - 4:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Sunday</span>
                <span className="text-[var(--muted-foreground)]">Closed</span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-[var(--info-blue)]/10 border border-[var(--info-blue)]/20">
              <div className="text-xs text-[var(--info-blue)]">
                For critical system issues outside business hours, email support@diabeticeyedx.com
                with "URGENT" in the subject line
              </div>
            </div>
          </GlassCard>

          {/* FAQ */}
          <GlassCard className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[var(--clinical-blue)]" />
              Quick Help
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-[var(--glass-bg)] transition-colors">
                <div className="text-sm mb-1">How do I upload a scan?</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Learn about image upload requirements
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-[var(--glass-bg)] transition-colors">
                <div className="text-sm mb-1">Understanding AI results</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Interpreting confidence scores
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-[var(--glass-bg)] transition-colors">
                <div className="text-sm mb-1">Account management</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Managing users and permissions
                </div>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
