import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Activity,
  BarChart3,
  Database,
  Download,
  Eye,
  FileText,
  LogOut,
  Pencil,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

type AdminSection = 'dashboard' | 'users' | 'data';

type DoctorUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organization?: string | null;
  createdAt?: string;
};

type ScanRecord = {
  scanId: string;
  patientId: string;
  patientName?: string | null;
  patient?: string;
  date: string;
  time: string;
  eye: string;
  scanType?: string;
  notes?: string | null;
  severity: string;
  status: string;
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  password: string;
};

type ScanForm = {
  patientId: string;
  patientName: string;
  scanType: string;
  eye: string;
  severity: string;
  notes: string;
};

const emptyUserForm: UserForm = {
  firstName: '',
  lastName: '',
  email: '',
  organization: '',
  password: '',
};

const emptyScanForm: ScanForm = {
  patientId: '',
  patientName: '',
  scanType: 'Fundus Photography',
  eye: 'Left Eye (OS)',
  severity: 'No DR',
  notes: '',
};

const severityOptions = ['No DR', 'Mild', 'Moderate', 'Severe'];
const scanTypeOptions = ['Fundus Photography', 'OCT Scan', 'Fluorescein Angiography'];
const eyeOptions = ['Left Eye (OS)', 'Right Eye (OD)'];

export function AdminPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [doctorUsers, setDoctorUsers] = useState<DoctorUser[]>([]);
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [recordsError, setRecordsError] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<DoctorUser | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ScanRecord | null>(null);
  const [scanForm, setScanForm] = useState<ScanForm>(emptyScanForm);
  const [scanFormError, setScanFormError] = useState('');
  const [scanFormLoading, setScanFormLoading] = useState(false);
  const [deletingScanId, setDeletingScanId] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  async function readBody(response: Response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function getAdminToken() {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login', { replace: true });
    return token;
  }

  async function adminFetch(path: string, options: RequestInit = {}) {
    const token = getAdminToken();
    if (!token) throw new Error('Admin session expired.');

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const body = await readBody(response);

    if (response.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login', { replace: true });
    }

    if (!response.ok) throw new Error(body.message || 'Request failed.');
    return body;
  }

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError('');
    try {
      const users = await adminFetch('/api/admin/users');
      setDoctorUsers(users);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadRecords() {
    setRecordsLoading(true);
    setRecordsError('');
    try {
      const response = await fetch(`${apiBase}/api/scans?limit=100`);
      const body = await readBody(response);
      if (!response.ok) throw new Error(body.message || 'Failed to load records.');
      setRecords(body);
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'Failed to load records.');
    } finally {
      setRecordsLoading(false);
    }
  }

  async function refreshAdminData() {
    await Promise.all([loadUsers(), loadRecords()]);
  }

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login', { replace: true });
      return;
    }

    refreshAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    if (!search) return doctorUsers;

    return doctorUsers.filter((user) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
      return `${name} ${user.email} ${user.organization || ''}`.toLowerCase().includes(search);
    });
  }, [doctorUsers, userSearch]);

  const reviewAlerts = records.filter((record) =>
    ['review', 'urgent'].includes(String(record.status).toLowerCase()),
  ).length;

  const stats = [
    { label: 'Uploaded Cases', value: String(records.length), icon: FileText, tone: 'from-[var(--clinical-blue)] to-[var(--clinical-cyan)]' },
    { label: 'Active Users', value: String(doctorUsers.length), icon: Users, tone: 'from-[var(--clinical-indigo)] to-[var(--clinical-blue)]' },
    { label: 'Predictions', value: String(records.length), icon: Activity, tone: 'from-[var(--clinical-teal)] to-emerald-300' },
    { label: 'Review Alerts', value: String(reviewAlerts), icon: ShieldCheck, tone: 'from-[var(--warning-yellow)] to-amber-300' },
  ];

  const sectionMeta = {
    dashboard: {
      title: 'Platform Management',
      description: 'Monitor doctor accounts, uploaded retinal cases, and model activity.',
    },
    users: {
      title: 'User Management',
      description: 'Add, update, and remove doctor accounts.',
    },
    data: {
      title: 'Data Management',
      description: 'Review retinal image and prediction records.',
    },
  }[activeSection];

  function getDoctorName(user: DoctorUser) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName ? `Dr. ${fullName}` : user.email;
  }

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }

  function openCreateUser() {
    setModalMode('create');
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setFormError('');
  }

  function openEditUser(user: DoctorUser) {
    setModalMode('edit');
    setEditingUser(user);
    setUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      organization: user.organization || '',
      password: '',
    });
    setFormError('');
  }

  function closeUserModal() {
    if (formLoading) return;
    setModalMode(null);
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setFormError('');
  }

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    if (!userForm.email.trim()) {
      setFormError('Email is required.');
      return;
    }

    if (modalMode === 'create' && !userForm.password.trim()) {
      setFormError('Password is required for new doctors.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        firstName: userForm.firstName.trim(),
        lastName: userForm.lastName.trim(),
        email: userForm.email.trim(),
        organization: userForm.organization.trim(),
        password: userForm.password,
      };
      const path = modalMode === 'edit' && editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = modalMode === 'edit' ? 'PATCH' : 'POST';
      const savedUser = await adminFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      setDoctorUsers((current) => {
        if (modalMode === 'edit') {
          return current.map((user) => (user.id === savedUser.id ? savedUser : user));
        }
        return [savedUser, ...current];
      });
      closeUserModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save doctor account.');
    } finally {
      setFormLoading(false);
    }
  }

  async function deleteDoctor(user: DoctorUser) {
    const confirmed = window.confirm(`Delete ${getDoctorName(user)}? This doctor will no longer be able to sign in.`);
    if (!confirmed) return;

    setDeletingId(user.id);
    try {
      await adminFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      setDoctorUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Unable to delete doctor account.');
    } finally {
      setDeletingId(null);
    }
  }

  function openEditRecord(record: ScanRecord) {
    setEditingRecord(record);
    setScanForm({
      patientId: record.patientId || '',
      patientName: record.patientName || '',
      scanType: record.scanType || 'Fundus Photography',
      eye: record.eye || 'Left Eye (OS)',
      severity: severityOptions.includes(record.severity) ? record.severity : 'No DR',
      notes: record.notes || '',
    });
    setScanFormError('');
    setScanModalOpen(true);
  }

  function closeScanModal() {
    if (scanFormLoading) return;
    setScanModalOpen(false);
    setEditingRecord(null);
    setScanForm(emptyScanForm);
    setScanFormError('');
  }

  async function submitScan(event: FormEvent) {
    event.preventDefault();
    setScanFormError('');

    if (!editingRecord) {
      setScanFormError('No scan record selected.');
      return;
    }

    if (!scanForm.patientId.trim()) {
      setScanFormError('Patient ID is required.');
      return;
    }

    setScanFormLoading(true);
    try {
      const savedRecord = await adminFetch(`/api/admin/scans/${editingRecord.scanId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          patientId: scanForm.patientId.trim(),
          patientName: scanForm.patientName.trim(),
          scanType: scanForm.scanType,
          eye: scanForm.eye,
          severity: scanForm.severity,
          notes: scanForm.notes.trim(),
        }),
      });

      setRecords((current) => current.map((record) => (
        record.scanId === savedRecord.scanId ? savedRecord : record
      )));
      closeScanModal();
    } catch (error) {
      setScanFormError(error instanceof Error ? error.message : 'Unable to update scan record.');
    } finally {
      setScanFormLoading(false);
    }
  }

  async function deleteRecord(record: ScanRecord) {
    const confirmed = window.confirm(`Delete scan ${record.scanId}? This will remove the scan record permanently.`);
    if (!confirmed) return;

    setDeletingScanId(record.scanId);
    setRecordsError('');
    try {
      await adminFetch(`/api/admin/scans/${record.scanId}`, { method: 'DELETE' });
      setRecords((current) => current.filter((item) => item.scanId !== record.scanId));
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'Unable to delete scan record.');
    } finally {
      setDeletingScanId(null);
    }
  }

  function exportRecords() {
    const headers = ['Scan ID', 'Patient', 'Severity', 'Status', 'Date', 'Time', 'Eye'];
    const rows = records.map((record) => [
      record.scanId,
      record.patientName || record.patient || record.patientId,
      record.severity,
      record.status,
      record.date,
      record.time,
      record.eye,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'retinal-records.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const userPanel = (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
            User Management
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Add, edit, and monitor doctor accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.035] text-[var(--muted-foreground)] hover:text-white"
            aria-label="Refresh users"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            onClick={openCreateUser}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2 text-sm text-white hover:opacity-95"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--glass-border)] bg-white/[0.035] pl-10 pr-3 text-sm"
            placeholder="Search users"
          />
        </div>
        <div className="space-y-3">
          {usersLoading && (
            <div className="rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4 text-sm text-[var(--muted-foreground)]">
              Loading doctor accounts...
            </div>
          )}
          {usersError && (
            <div className="rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 p-4 text-sm text-[var(--error-red)]">
              {usersError}
            </div>
          )}
          {!usersLoading && !usersError && filteredUsers.length === 0 && (
            <div className="rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4 text-sm text-[var(--muted-foreground)]">
              No doctor accounts found.
            </div>
          )}
          {!usersLoading && !usersError && filteredUsers.map((user) => (
            <div key={user.id} className="grid gap-3 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-sm text-white">{getDoctorName(user)}</div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">{user.email}</div>
                {user.organization && (
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">{user.organization}</div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--clinical-cyan)]/10 px-2.5 py-1 text-xs text-[var(--clinical-cyan)]">
                  Doctor
                </span>
                <span className="rounded-full bg-[var(--success-green)]/10 px-2.5 py-1 text-xs text-[var(--success-green)]">
                  Active
                </span>
                <button
                  onClick={() => openEditUser(user)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.035] text-[var(--muted-foreground)] hover:text-white"
                  aria-label={`Edit ${getDoctorName(user)}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteDoctor(user)}
                  disabled={deletingId === user.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 text-[var(--error-red)] hover:bg-[var(--error-red)]/20 disabled:opacity-50"
                  aria-label={`Delete ${getDoctorName(user)}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );

  const dataPanel = (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
        <div>
          <h2 className="text-lg text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
            Data Management
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Retinal image and prediction records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadRecords}
            className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-2 text-[var(--muted-foreground)] hover:text-white"
            aria-label="Refresh records"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            onClick={exportRecords}
            disabled={records.length === 0}
            className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-2 text-[var(--muted-foreground)] hover:text-white disabled:opacity-50"
            aria-label="Export records"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {recordsLoading && (
            <div className="rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4 text-sm text-[var(--muted-foreground)]">
              Loading records...
            </div>
          )}
          {recordsError && (
            <div className="rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 p-4 text-sm text-[var(--error-red)]">
              {recordsError}
            </div>
          )}
          {!recordsLoading && !recordsError && records.length === 0 && (
            <div className="rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4 text-sm text-[var(--muted-foreground)]">
              No scan records yet.
            </div>
          )}
          {!recordsLoading && !recordsError && records.map((record) => (
            <div key={record.scanId} className="rounded-lg border border-[var(--glass-border)] bg-white/[0.03] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-[var(--clinical-blue)]">{record.scanId}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
                    {record.status}
                  </span>
                  <button
                    onClick={() => openEditRecord(record)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.035] text-[var(--muted-foreground)] hover:text-white"
                    aria-label={`Edit scan ${record.scanId}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteRecord(record)}
                    disabled={deletingScanId === record.scanId}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 text-[var(--error-red)] hover:bg-[var(--error-red)]/20 disabled:opacity-50"
                    aria-label={`Delete scan ${record.scanId}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-[var(--muted-foreground)] sm:grid-cols-4">
                <div>
                  <div>Patient</div>
                  <div className="mt-1 text-white">{record.patientName || record.patient || record.patientId}</div>
                </div>
                <div>
                  <div>Severity</div>
                  <div className="mt-1 text-white">{record.severity}</div>
                </div>
                <div>
                  <div>Date</div>
                  <div className="mt-1 text-white">{record.date}</div>
                </div>
                <div>
                  <div>Eye</div>
                  <div className="mt-1 text-white">{record.eye}</div>
                </div>
                <div>
                  <div>Scan Type</div>
                  <div className="mt-1 text-white">{record.scanType || 'Fundus Photography'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] lg:flex">
          <div className="border-b border-[var(--sidebar-border)] p-5">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--clinical-blue)] to-[var(--clinical-teal)]">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-base text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  Admin Panel
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">Diabetic EyeDx</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {[
              { icon: BarChart3, label: 'Dashboard', value: 'dashboard' as const },
              { icon: Users, label: 'User Management', value: 'users' as const },
              { icon: Database, label: 'Data Management', value: 'data' as const },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveSection(item.value)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm ${
                  activeSection === item.value
                    ? 'bg-[var(--sidebar-accent)] text-[var(--clinical-cyan)] shadow-[inset_3px_0_0_var(--clinical-cyan)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-[var(--sidebar-border)] p-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 clinical-shell">
          <div className="border-b border-[var(--glass-border)] bg-[var(--surface-strong)]/82 px-4 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white/[0.035] px-3 py-1 text-xs text-[var(--clinical-cyan)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Administrator workspace
                </div>
                <h1 className="text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  {sectionMeta.title}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {sectionMeta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={refreshAdminData}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--glass-border)] bg-white/[0.035] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-white"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--glass-border)] bg-white/[0.035] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-white lg:hidden"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <GlassCard key={stat.label} className="p-5">
                  <div className="mb-5 flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${stat.tone}`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="rounded-full bg-[var(--success-green)]/10 px-2.5 py-1 text-xs text-[var(--success-green)]">
                      Live
                    </span>
                  </div>
                  <div className="text-3xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">{stat.label}</div>
                </GlassCard>
              ))}
            </div>

            {activeSection === 'dashboard' && (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                {userPanel}
                {dataPanel}
              </div>
            )}
            {activeSection === 'users' && userPanel}
            {activeSection === 'data' && dataPanel}
          </div>
        </main>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={submitUser}
            className="w-full max-w-xl rounded-lg border border-[var(--glass-border)] bg-[var(--surface-strong)] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  {modalMode === 'create' ? 'Add Doctor' : 'Update Doctor'}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {modalMode === 'create' ? 'Create a doctor login account.' : 'Edit doctor account details.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeUserModal}
                className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-2 text-[var(--muted-foreground)] hover:text-white"
                aria-label="Close user form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-[var(--muted-foreground)]">First Name</span>
                <input
                  value={userForm.firstName}
                  onChange={(event) => setUserForm((form) => ({ ...form, firstName: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder="Mohamed"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Last Name</span>
                <input
                  value={userForm.lastName}
                  onChange={(event) => setUserForm((form) => ({ ...form, lastName: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder="Ben Mim"
                />
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-[var(--muted-foreground)]">Email</span>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((form) => ({ ...form, email: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder="doctor@hospital.com"
                />
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-[var(--muted-foreground)]">Organization</span>
                <input
                  value={userForm.organization}
                  onChange={(event) => setUserForm((form) => ({ ...form, organization: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder="Sousse"
                />
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-[var(--muted-foreground)]">
                  {modalMode === 'create' ? 'Password' : 'New Password'}
                </span>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((form) => ({ ...form, password: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder={modalMode === 'create' ? 'Required' : 'Leave empty to keep current password'}
                />
              </label>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 px-3 py-2 text-sm text-[var(--error-red)]">
                {formError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeUserModal}
                className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : modalMode === 'create' ? 'Add User' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {scanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={submitScan}
            className="w-full max-w-2xl rounded-lg border border-[var(--glass-border)] bg-[var(--surface-strong)] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl text-white" style={{ fontFamily: 'Outfit', fontWeight: 650 }}>
                  Update Scan Record
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Edit patient metadata and diagnosis for {editingRecord?.scanId}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeScanModal}
                className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] p-2 text-[var(--muted-foreground)] hover:text-white"
                aria-label="Close scan form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Patient ID</span>
                <input
                  value={scanForm.patientId}
                  onChange={(event) => setScanForm((form) => ({ ...form, patientId: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder="PAT-12345"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Patient Name</span>
                <input
                  value={scanForm.patientName}
                  onChange={(event) => setScanForm((form) => ({ ...form, patientName: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                  placeholder="Sarah Johnson"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Scan Type</span>
                <select
                  value={scanForm.scanType}
                  onChange={(event) => setScanForm((form) => ({ ...form, scanType: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                >
                  {scanTypeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Eye</span>
                <select
                  value={scanForm.eye}
                  onChange={(event) => setScanForm((form) => ({ ...form, eye: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                >
                  {eyeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-[var(--muted-foreground)]">Severity</span>
                <select
                  value={scanForm.severity}
                  onChange={(event) => setScanForm((form) => ({ ...form, severity: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3"
                >
                  {severityOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-[var(--muted-foreground)]">Clinical Notes</span>
                <textarea
                  value={scanForm.notes}
                  onChange={(event) => setScanForm((form) => ({ ...form, notes: event.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--input-background)] px-3 py-2"
                  placeholder="Optional notes"
                />
              </label>
            </div>

            {scanFormError && (
              <div className="mt-4 rounded-lg border border-[var(--error-red)]/30 bg-[var(--error-red)]/10 px-3 py-2 text-sm text-[var(--error-red)]">
                {scanFormError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeScanModal}
                className="rounded-lg border border-[var(--glass-border)] bg-white/[0.035] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scanFormLoading}
                className="rounded-lg bg-gradient-to-r from-[var(--clinical-blue)] to-[var(--clinical-teal)] px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-50"
              >
                {scanFormLoading ? 'Saving...' : 'Update Record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
