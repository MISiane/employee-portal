import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon, PencilSquareIcon, IdentificationIcon, CalendarDaysIcon,
  BriefcaseIcon, ClockIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';
import { getEmployeeById, getDepartments, resetEmployeePassword } from '../api/employees';
import EmployeeModal from '../components/Employees/EmployeeModal';
import CredentialCard from '../components/Employees/CredentialCard';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal' },
  { id: 'employment', label: 'Employment' },
  { id: 'contact', label: 'Contact & IDs' },
  { id: 'leave', label: 'Leave Balances' },
];

const fmtDate = (value) => {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtDateTime = (value) => {
  if (!value) return 'Never';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const tenure = (hire) => {
  const m = String(hire || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '—';
  const start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return 'Not started';
  if (months < 1) return 'Less than a month';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rest) parts.push(`${rest} mo`);
  return parts.join(' ');
};

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

const Field = ({ label, children }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-gray-900 break-words">{children || '—'}</dd>
  </div>
);

const Section = ({ title, children }) => (
  <section className="mb-6 last:mb-0">
    <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">{children}</dl>
  </section>
);

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
    <div className="rounded-lg bg-purple-50 p-2.5">
      <Icon className="h-5 w-5 text-purple-700" />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="truncate text-base font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [showIds, setShowIds] = useState(false);
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [departments, setDepartments] = useState([]);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await getEmployeeById(id);
      setEmp(data);
      try {
        const res = await api.get(`/leave/balances/${id}`);
        setBalances(res.data);
      } catch {
        setBalances(null);
      }
    } catch (err) {
      setError(err.response?.status === 404 ? 'Employee not found.' : 'Could not load this employee.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const fullName = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email : '';
  const initials = emp ? `${(emp.first_name || '?')[0]}${(emp.last_name || '')[0] || ''}`.toUpperCase() : '';

  const handleCard = async () => {
    if (!confirm(`Print a credential card for ${fullName}? This resets their password to a new temporary one, and the old password stops working.`)) return;
    setBusy(true);
    try {
      const res = await resetEmployeePassword(emp.id);
      if (res.success) setCard({ password: res.temporary_password });
    } catch (err) {
      alert('Error resetting password: ' + (err.response?.data?.error || 'Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading employee…</div>;
  if (error || !emp) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/employees')} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Employees
        </button>
        <p className="text-red-600">{error || 'Employee not found.'}</p>
      </div>
    );
  }

  const mask = (v) => (!v ? '—' : showIds ? v : '•'.repeat(Math.max(4, String(v).length - 3)) + String(v).slice(-3));
  const address = [emp.address, emp.city, emp.state, emp.zip_code].filter(Boolean).join(', ');
  const leaveRows = balances
    ? [
        ['Vacation leave', balances.vacation_leave],
        ['Sick leave', balances.sick_leave],
        ['Emergency leave', balances.emergency_leave],
        ['Special leave', balances.special_leave],
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <button onClick={() => navigate('/employees')} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Employees
      </button>

      <div className="rounded-2xl bg-gradient-to-r from-[#800080] to-[#a22ca2] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="h-24 w-24 rounded-xl border-2 border-white/60 object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-white/60 bg-white/20 text-3xl font-bold">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="mt-0.5 text-white/90">{[emp.position, emp.department].filter(Boolean).join(' • ') || 'No position set'}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {emp.employee_code && <span className="rounded bg-white/20 px-2 py-1 font-mono">{emp.employee_code}</span>}
              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 font-medium ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {emp.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="whitespace-nowrap rounded-full bg-white/20 px-2.5 py-1">{titleCase(emp.employment_status)}</span>
              <span className="whitespace-nowrap rounded-full bg-white/20 px-2.5 py-1">{titleCase(emp.role)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col">
            <button onClick={() => setEditing(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#800080] hover:bg-purple-50">
              <PencilSquareIcon className="h-4 w-4" /> Edit
            </button>
            <button onClick={handleCard} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 disabled:opacity-60">
              <IdentificationIcon className="h-4 w-4" /> {busy ? 'Working…' : 'Credential card'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDaysIcon} label="Years of service" value={tenure(emp.hire_date)} />
        <StatCard icon={BriefcaseIcon} label="Employment status" value={titleCase(emp.employment_status)} />
        <StatCard icon={CalendarDaysIcon} label="Vacation leave left" value={balances ? `${balances.vacation_leave} days` : '—'} />
        <StatCard icon={ClockIcon} label="Last login" value={fmtDateTime(emp.last_login)} />
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white">
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-3 pt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium ${tab === t.id ? 'bg-purple-50 text-[#800080]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {tab === 'overview' && (
            <>
              <Section title="Summary">
                <Field label="Email">{emp.email}</Field>
                <Field label="Phone">{emp.phone}</Field>
                <Field label="Department">{emp.department}</Field>
                <Field label="Position">{emp.position}</Field>
                <Field label="Date hired">{fmtDate(emp.hire_date)}</Field>
                <Field label="Birth date">{fmtDate(emp.date_of_birth)}</Field>
              </Section>
              <Section title="Account">
                <Field label="Account created">{fmtDate(emp.created_at)}</Field>
                <Field label="Last updated">{fmtDateTime(emp.updated_at)}</Field>
              </Section>
            </>
          )}

          {tab === 'personal' && (
            <Section title="Personal information">
              <Field label="First name">{emp.first_name}</Field>
              <Field label="Last name">{emp.last_name}</Field>
              <Field label="Birth date">{fmtDate(emp.date_of_birth)}</Field>
              <Field label="Email">{emp.email}</Field>
              <Field label="Phone">{emp.phone}</Field>
            </Section>
          )}

          {tab === 'employment' && (
            <Section title="Employment details">
              <Field label="Employee code">{emp.employee_code}</Field>
              <Field label="Department">{emp.department}</Field>
              <Field label="Position">{emp.position}</Field>
              <Field label="Employment status">{titleCase(emp.employment_status)}</Field>
              <Field label="Date hired">{fmtDate(emp.hire_date)}</Field>
              <Field label="Probation ends">{fmtDate(emp.probationary_end_date)}</Field>
              <Field label="Regularization date">{fmtDate(emp.regularization_date)}</Field>
              <Field label="Portal role">{titleCase(emp.role)}</Field>
            </Section>
          )}

          {tab === 'contact' && (
            <>
              <Section title="Address">
                <Field label="Full address">{address}</Field>
              </Section>
              <Section title="Emergency contact">
                <Field label="Name">{emp.emergency_contact_name}</Field>
                <Field label="Phone">{emp.emergency_contact_phone}</Field>
              </Section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Government IDs</h3>
                <button onClick={() => setShowIds((v) => !v)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                  {showIds ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />} {showIds ? 'Hide' : 'Show'}
                </button>
              </div>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Field label="SSS">{mask(emp.sss_number)}</Field>
                <Field label="PhilHealth">{mask(emp.philhealth_number)}</Field>
                <Field label="Pag-IBIG">{mask(emp.pagibig_number)}</Field>
                <Field label="TIN">{mask(emp.tin_number)}</Field>
              </dl>
            </>
          )}

          {tab === 'leave' && (
            <>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Leave balances for {balances?.year || new Date().getFullYear()}</h3>
              {balances ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {leaveRows.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-200 p-4">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900">{value ?? 0}</div>
                      <div className="text-xs text-gray-500">days left</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No leave balance record for this employee.</p>
              )}
              <p className="mt-4 text-xs text-gray-500">To adjust balances, use Edit and open the Leave Balances tab.</p>
            </>
          )}
        </div>
      </div>

      <EmployeeModal
        isOpen={editing}
        onClose={() => {
          setEditing(false);
          load();
        }}
        employee={emp}
        mode="edit"
        departments={departments}
      />

      <CredentialCard
        isOpen={!!card}
        onClose={() => {
          setCard(null);
          load();
        }}
        employee={{ name: fullName, email: emp.email, department: emp.department, employee_code: emp.employee_code }}
        password={card?.password}
      />
    </div>
  );
};

export default EmployeeProfile;
