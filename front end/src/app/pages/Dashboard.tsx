import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Users,
  Upload,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router';
import { fetchScans, type ScanSummary } from '../lib/analysisApi';
import { useAuth } from '../lib/auth';

function getDoctorName(user: { email?: string; firstName?: string; lastName?: string } | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return `Dr. ${fullName}`;

  const emailName = user?.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (emailName) return `Dr. ${emailName}`;

  return 'Doctor';
}

export function Dashboard() {
  const auth = useAuth();
  const [recentScans, setRecentScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadScans() {
      try {
        setLoading(true);
        setError(null);
        const scans = await fetchScans(5);
        if (mounted) {
          setRecentScans(scans);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load recent scans.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadScans();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalScans = recentScans.length;
    const activePatients = new Set(
      recentScans.map((scan) => scan.patientName || scan.patientId).filter(Boolean),
    ).size;
    const pendingReviews = recentScans.filter((scan) => scan.status === 'review').length;
    const detectionRate =
      totalScans > 0
        ? (recentScans.filter((scan) => scan.severity !== 'No DR').length / totalScans) * 100
        : 0;

    return [
      {
        label: 'Total Scans',
        value: totalScans.toString(),
        change: 'Live',
        trend: 'up',
        icon: Eye,
        color: 'from-[var(--clinical-blue)] to-[var(--clinical-cyan)]',
      },
      {
        label: 'Active Patients',
        value: activePatients.toString(),
        change: 'Live',
        trend: 'up',
        icon: Users,
        color: 'from-[var(--clinical-indigo)] to-[var(--clinical-blue)]',
      },
      {
        label: 'Pending Reviews',
        value: pendingReviews.toString(),
        change: 'Live',
        trend: pendingReviews > 0 ? 'down' : 'up',
        icon: Clock,
        color: 'from-[var(--warning-yellow)] to-amber-300',
      },
      {
        label: 'Detection Rate',
        value: `${detectionRate.toFixed(1)}%`,
        change: 'Live',
        trend: 'up',
        icon: Activity,
        color: 'from-[var(--clinical-teal)] to-emerald-300',
      },
    ];
  }, [recentScans]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'No DR':
        return 'text-[var(--success-green)] bg-[var(--success-green)]/10';
      case 'Mild':
        return 'text-[var(--info-blue)] bg-[var(--info-blue)]/10';
      case 'Moderate':
        return 'text-[var(--warning-yellow)] bg-[var(--warning-yellow)]/10';
      case 'Severe':
        return 'text-[var(--error-red)] bg-[var(--error-red)]/10';
      default:
        return 'text-[var(--muted-foreground)] bg-[var(--muted)]/10';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-green)]/10 text-[var(--success-green)] text-xs">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </div>
        );
      case 'review':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--warning-yellow)]/10 text-[var(--warning-yellow)] text-xs">
            <Clock className="w-3 h-3" />
            Review
          </div>
        );
      case 'urgent':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--error-red)]/10 text-[var(--error-red)] text-xs">
            <AlertTriangle className="w-3 h-3" />
            Urgent
          </div>
        );
      default:
        return null;
    }
  };

  const displayRecentScans = recentScans.map((scan) => ({
    id: scan.scanId,
    patient: scan.patientName || scan.patientId || scan.patient || 'Unknown patient',
    date: `${scan.date} ${scan.time}`,
    severity: scan.severity,
    confidence: Number(scan.confidence),
    status: scan.status,
  }));
  const doctorName = getDoctorName(auth.user);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white/[0.035] px-3 py-1 text-xs text-[var(--muted-foreground)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-green)]" />
            Live clinic overview
          </div>
          <h1 className="text-3xl text-white sm:text-4xl" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
            Dashboard Overview
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Welcome back, {doctorName}. Today’s review queue is ready.</p>
        </div>
        <Link
          to="/app/upload"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2.5 text-sm text-white hover:opacity-95"
        >
          Upload scan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={i} className="overflow-hidden p-5">
              <div className="mb-5 flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br ${stat.color}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                    stat.trend === 'up'
                      ? 'bg-[var(--success-green)]/10 text-[var(--success-green)]'
                      : 'bg-[var(--error-red)]/10 text-[var(--error-red)]'
                  }`}
                >
                  <TrendingUp
                    className={`w-3 h-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`}
                  />
                  {stat.change}
                </div>
              </div>
              <div className="mb-1 text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                {stat.value}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">{stat.label}</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.045]">
                <div className={`h-full rounded-full bg-gradient-to-r ${stat.color}`} style={{ width: `${72 + i * 5}%` }} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Link to="/app/upload" className="group">
          <GlassCard className="p-5 hover:border-cyan-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)]">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-white">Upload New Scan</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Analyze retinal images
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-white" />
            </div>
          </GlassCard>
        </Link>

        <Link to="/app/history" className="group">
          <GlassCard className="p-5 hover:border-cyan-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-indigo)] to-[var(--clinical-blue)]">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-white">View History</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Browse past scans
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-white" />
            </div>
          </GlassCard>
        </Link>

        <Link to="/app/users" className="group">
          <GlassCard className="p-5 hover:border-cyan-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-teal)] to-emerald-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-white">Doctor Profile</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Doctor account
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-white" />
            </div>
          </GlassCard>
        </Link>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div>
            <h2 className="text-xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
              Recent Scans
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Latest AI-assisted retinal screening activity</p>
          </div>
          <Link
            to="/app/history"
            className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-white/[0.06]"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-white/[0.02]">
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Scan ID
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Patient
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Date & Time
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Severity
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Confidence
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-[var(--muted-foreground)]" colSpan={6}>
                    Loading recent scans...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-[var(--error-red)]" colSpan={6}>
                    {error}
                  </td>
                </tr>
              ) : displayRecentScans.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-[var(--muted-foreground)]" colSpan={6}>
                    No scans have been saved yet.
                  </td>
                </tr>
              ) : displayRecentScans.map((scan) => (
                <tr
                  key={scan.id}
                  className="cursor-pointer border-b border-[var(--glass-border)]/50 hover:bg-white/[0.035]"
                  onClick={() => (window.location.href = `/app/analysis/${scan.id}`)}
                >
                  <td className="px-5 py-4">
                    <span className="text-sm text-[var(--clinical-blue)]">{scan.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-white">{scan.patient}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-[var(--muted-foreground)]">{scan.date}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${getSeverityColor(scan.severity)}`}>
                      {scan.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)]"
                          style={{ width: `${scan.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {scan.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(scan.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
