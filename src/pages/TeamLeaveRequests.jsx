import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getSupervisorRequests, decideAsSupervisor } from '../api/leave';

const TABS = [
  { key: 'pending_supervisor', label: 'Waiting for me' },
  { key: 'decided', label: 'Decided by me' },
  { key: 'all', label: 'All' },
];

const BALANCE_FIELD = {
  'Vacation Leave': 'vacation_leave',
  'Sick Leave': 'sick_leave',
  'Emergency Leave': 'emergency_leave',
  'Special Leave': 'special_leave',
};

const formatDate = (value) => {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Inclusive calendar days, same rule the server uses
const countDays = (start, end) => {
  const [y1, m1, d1] = String(start).slice(0, 10).split('-').map(Number);
  const [y2, m2, d2] = String(end).slice(0, 10).split('-').map(Number);
  return Math.floor((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
};

// Where the request is now, in words a supervisor understands
const stageOf = (r) => {
  if (r.status === 'pending_supervisor') return { label: 'Waiting for you', tone: 'amber' };
  if (r.status === 'pending') return { label: 'Approved by you, waiting for admin', tone: 'blue' };
  if (r.status === 'approved') {
    return r.admin_override && !r.supervisor_decision
      ? { label: 'Approved by admin', tone: 'green' }
      : { label: 'Approved', tone: 'green' };
  }
  if (r.status === 'rejected') {
    return r.supervisor_decision === 'rejected'
      ? { label: 'Rejected by supervisor', tone: 'red' }
      : { label: 'Rejected by admin', tone: 'red' };
  }
  return { label: r.status, tone: 'gray' };
};

const TONES = {
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
};

const getFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${fileUrl}`;
};

const TeamLeaveRequests = () => {
  const { user } = useAuth();
  const isSupervisor = (user?.supervised_departments?.length || 0) > 0;

  const [tab, setTab] = useState('pending_supervisor');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getSupervisorRequests({ status: tab, search, page, limit: 10 });
      setRequests(data.leaveRequests || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      setRequests([]);
      setLoadError(
        error.response?.status === 503
          ? 'Supervisor approval is not available on the server yet. Please try again in a few minutes.'
          : error.response?.data?.error || 'Could not load leave requests.'
      );
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => {
    if (isSupervisor) load();
  }, [isSupervisor, load]);

  // Search as the person types, without a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openRequest = (request) => {
    setSelected(request);
    setNotes('');
    setModalError('');
  };

  const closeModal = () => {
    if (saving) return;
    setSelected(null);
  };

  // Escape closes the dialog
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, saving]);

  const decide = async (decision) => {
    if (decision === 'reject' && !notes.trim()) {
      setModalError('Please write a short reason. The employee will see it.');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      const result = await decideAsSupervisor(selected.id, decision, notes.trim());
      setSelected(null);
      setFlash(result.message || 'Done.');
      setTimeout(() => setFlash(''), 6000);
      await load();
    } catch (error) {
      setModalError(error.response?.data?.error || 'Could not save your decision.');
      if (error.response?.status === 409) {
        // Someone else decided it first: refresh the list behind the dialog
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isSupervisor) {
    return (
      <div className="rounded-[24px] border border-[#e6cce6] bg-white p-8 text-center text-gray-600">
        You are not a supervisor of any department.
      </div>
    );
  }

  const balanceFor = (r) => {
    const field = BALANCE_FIELD[r.leave_type];
    const value = field ? r[field] : null;
    return value === null || value === undefined ? null : Number(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Leave Requests</h1>
        <p className="mt-1 text-sm text-gray-600">
          Requests from {user.supervised_departments.join(', ')}. Approve to send a request on to
          the admin, or reject it with a reason.
        </p>
      </div>

      {flash && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </div>
      )}

      <div className="rounded-[24px] border border-[#e6cce6] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === t.key
                    ? 'bg-[#800080] text-white'
                    : 'bg-[#faf5fb] text-[#800080] hover:bg-[#f3e6f3]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a07aa0]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or employee code"
              className="w-full rounded-xl border border-[#e6cce6] bg-[#faf5fb] py-2 pl-10 pr-4 text-gray-700 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[24px] border border-[#e6cce6] bg-white p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : loadError ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {loadError}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[24px] border border-[#e6cce6] bg-white p-8 text-center text-gray-500">
            {tab === 'pending_supervisor'
              ? 'Nothing is waiting for your approval.'
              : 'No leave requests found.'}
          </div>
        ) : (
          requests.map((r) => {
            const stage = stageOf(r);
            return (
              <button
                key={r.id}
                onClick={() => openRequest(r)}
                className="w-full rounded-[24px] border border-[#e6cce6] bg-white p-4 text-left shadow-sm transition hover:border-[#800080]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {r.first_name} {r.last_name}
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        {r.employee_code} · {r.department}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {r.leave_type} · {formatDate(r.start_date)}
                      {r.start_date !== r.end_date && ` – ${formatDate(r.end_date)}`} ·{' '}
                      {countDays(r.start_date, r.end_date)} day(s)
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${TONES[stage.tone]}`}
                  >
                    {stage.label}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} requests
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#e6cce6] px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#e6cce6] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selected.first_name} {selected.last_name}
                </h2>
                <p className="text-xs text-gray-500">
                  {selected.employee_code} · {selected.department}
                </p>
              </div>
              <button onClick={closeModal} aria-label="Close">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Leave type</dt>
                <dd className="font-medium text-gray-900">{selected.leave_type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Dates</dt>
                <dd className="text-right font-medium text-gray-900">
                  {formatDate(selected.start_date)} – {formatDate(selected.end_date)}
                  <br />
                  <span className="text-xs font-normal text-gray-500">
                    {countDays(selected.start_date, selected.end_date)} day(s)
                  </span>
                </dd>
              </div>
              {selected.regular_days_off && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Regular days off</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {selected.regular_days_off}
                  </dd>
                </div>
              )}
              {balanceFor(selected) !== null && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Balance for {selected.leave_type}</dt>
                  <dd className="font-medium text-gray-900">{balanceFor(selected)} day(s)</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Reason</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-[#faf5fb] p-3 text-gray-800">
                  {selected.reason || 'No reason given.'}
                </dd>
              </div>
              {selected.medical_certificate_url && (
                <div>
                  <a
                    href={getFileUrl(selected.medical_certificate_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#800080] underline"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    {selected.medical_certificate_filename || 'Medical certificate'}
                  </a>
                </div>
              )}
            </dl>

            {selected.status === 'pending_supervisor' ? (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Note (required when rejecting)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-xl border border-[#e6cce6] px-3 py-2 text-gray-700 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                  placeholder="Visible to the employee and the admin"
                />
                {modalError && <p className="mt-2 text-sm text-red-600">{modalError}</p>}
                <div className="mt-4 flex gap-3">
                  <button
                    disabled={saving}
                    onClick={() => decide('reject')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircleIcon className="h-5 w-5" /> Reject
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => decide('approve')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#800080] px-4 py-2 font-medium text-white hover:bg-[#6b006b] disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-5 w-5" /> Approve
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Approving sends the request to the admin, who makes the final decision and
                  decides whether it is with or without pay.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-[#faf5fb] p-3 text-sm text-gray-700">
                <p className="flex items-center gap-2 font-medium">
                  <ClockIcon className="h-5 w-5" /> {stageOf(selected).label}
                </p>
                {selected.supervisor_decision && (
                  <p className="mt-1">
                    Decided by {selected.supervisor_first_name} {selected.supervisor_last_name}
                    {selected.supervisor_decided_at && ` on ${formatDate(selected.supervisor_decided_at)}`}
                    {selected.supervisor_notes && `: "${selected.supervisor_notes}"`}
                  </p>
                )}
                {selected.admin_override && (
                  <p className="mt-1">The admin decided this before a supervisor did.</p>
                )}
                {modalError && <p className="mt-2 text-red-600">{modalError}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaveRequests;
