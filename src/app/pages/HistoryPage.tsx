import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Search, Filter, Download, Eye, Calendar } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';
import { fetchScans, type ScanSummary } from '../lib/analysisApi';

export function HistoryPage() {
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadScans() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchScans(500);
        if (mounted) {
          setScans(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load scan history.');
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
        return <span className="text-xs text-[var(--success-green)]">Completed</span>;
      case 'review':
        return <span className="text-xs text-[var(--warning-yellow)]">Review</span>;
      case 'urgent':
        return <span className="text-xs text-[var(--error-red)]">Urgent</span>;
      default:
        return null;
    }
  };

  const filteredScans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return scans.filter((scan) => {
      if (filterSeverity !== 'all' && scan.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && scan.status !== filterStatus) return false;

      if (term) {
        const patientName = (scan.patientName || scan.patient || '').toLowerCase();
        const patientId = (scan.patientId || '').toLowerCase();
        const scanId = (scan.scanId || '').toLowerCase();
        if (!patientName.includes(term) && !patientId.includes(term) && !scanId.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [filterSeverity, filterStatus, scans, searchTerm]);

  const averageConfidence =
    filteredScans.length > 0
      ? filteredScans.reduce((sum, scan) => sum + Number(scan.confidence || 0), 0) / filteredScans.length
      : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
          Scan History
        </h1>
        <p className="text-[var(--muted-foreground)]">
          View and manage all previous retinal scans
        </p>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search by patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-[var(--input-background)] border-[var(--glass-border)] h-11"
          />
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="h-11 px-3 rounded-lg bg-[var(--input-background)] border border-[var(--glass-border)] text-sm"
        >
          <option value="all">All Severities</option>
          <option value="No DR">No DR</option>
          <option value="Mild">Mild</option>
          <option value="Moderate">Moderate</option>
          <option value="Severe">Severe</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 px-3 rounded-lg bg-[var(--input-background)] border border-[var(--glass-border)] text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="review">Review</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Scans</div>
          <div className="text-2xl" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            {loading ? '—' : scans.length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">No DR</div>
          <div className="text-2xl text-[var(--success-green)]" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            {loading ? '—' : scans.filter((s) => s.severity === 'No DR').length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Moderate/Severe</div>
          <div className="text-2xl text-[var(--warning-yellow)]" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            {loading ? '—' : scans.filter((s) => s.severity === 'Moderate' || s.severity === 'Severe').length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Avg. Confidence</div>
          <div className="text-2xl text-[var(--clinical-blue)]" style={{ fontFamily: 'Outfit', fontWeight: 600 }}>
            {loading ? '—' : `${averageConfidence.toFixed(1)}%`}
          </div>
        </GlassCard>
      </div>

      {/* Scans Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Scan ID
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Patient
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Date & Time
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Eye
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Scan Type
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Severity
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Confidence
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm text-[var(--muted-foreground)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-[var(--muted-foreground)]" colSpan={8}>
                    Loading scan history...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-[var(--error-red)]" colSpan={8}>
                    {error}
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-[var(--muted-foreground)]" colSpan={8}>
                    No scans match the current filters.
                  </td>
                </tr>
              ) : filteredScans.map((scan) => (
                <tr
                  key={scan.scanId}
                  className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/analysis/${scan.scanId}`)}
                >
                  <td className="py-4 px-6">
                    <span className="text-sm text-[var(--clinical-blue)]">{scan.scanId}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-sm">{scan.patientName || scan.patient || scan.patientId}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {scan.patientId}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Calendar className="w-3 h-3" />
                      {scan.date} {scan.time}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-3 h-3 text-[var(--muted-foreground)]" />
                      {scan.eye}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-[var(--muted-foreground)]">
                    {scan.scanType || 'Fundus Photography'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${getSeverityColor(scan.severity)}`}>
                      {scan.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
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
                  <td className="py-4 px-6">{getStatusBadge(scan.status)}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--glass-border)]">
          <div className="text-sm text-[var(--muted-foreground)]">
            Showing {filteredScans.length} of {scans.length} scans
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm hover:bg-[var(--glass-bg)]/80 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-cyan)] text-white text-sm">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm hover:bg-[var(--glass-bg)]/80 transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm hover:bg-[var(--glass-bg)]/80 transition-colors">
              Next
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
