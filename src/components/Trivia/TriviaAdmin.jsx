import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTriviaQuestions, createTriviaQuestion, updateTriviaQuestion, deleteTriviaQuestion,
  importTriviaQuestions, scheduleTriviaQuestions,
} from '../../api/trivia';
import { parseQuestionsText } from '../../utils/triviaImport';
import { formatTriviaDate, LETTERS } from './triviaFormat';

const SOURCES = [
  'Vision, Mission & Core Values',
  'Code of Behavior - Introduction',
  'Code of Behavior - Rules',
];

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'unscheduled', label: 'Not scheduled' },
  { id: 'past', label: 'Past' },
  { id: 'inactive', label: 'Draft / retired' },
  { id: 'all', label: 'All' },
];

const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

// First day of the month after `iso`, e.g. 2026-11-22 -> 2026-12-01
const nextMonthStart = (iso) => {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
};

const errText = (err, fallback) => err.response?.data?.error || fallback;

const StatusPill = ({ q, today }) => {
  let label = 'Not scheduled';
  let tone = 'bg-gray-100 text-gray-700';
  if (q.status === 'draft') { label = 'Draft'; tone = 'bg-yellow-100 text-yellow-800'; }
  else if (q.status === 'retired') { label = 'Retired'; tone = 'bg-red-100 text-red-800'; }
  else if (q.scheduled_date === today) { label = 'Today'; tone = 'bg-green-100 text-green-800'; }
  else if (q.scheduled_date && q.scheduled_date > today) { label = 'Scheduled'; tone = 'bg-blue-100 text-blue-800'; }
  else if (q.scheduled_date) { label = 'Asked'; tone = 'bg-purple-100 text-purple-800'; }
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>;
};

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
    <div
      className={`my-6 w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} rounded-2xl bg-white p-5 sm:p-6`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={title}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-xl leading-none text-gray-500 hover:bg-gray-100">×</button>
      </div>
      {children}
    </div>
  </div>
);

const emptyForm = { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '', source: '', status: 'approved', scheduled_date: '' };

const QuestionForm = ({ initial, onSaved, onClose }) => {
  const editing = !!initial?.id;
  const [form, setForm] = useState(
    initial
      ? { ...emptyForm, ...initial, options: [...initial.options], scheduled_date: initial.scheduled_date || '', explanation: initial.explanation || '', source: initial.source || '' }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const locked = editing && initial.answered_count > 0;

  const setOption = (i, value) => setForm((f) => ({ ...f, options: f.options.map((o, k) => (k === i ? value : o)) }));
  const addOption = () => setForm((f) => (f.options.length < 4 ? { ...f, options: [...f.options, ''] } : f));
  const removeOption = (i) =>
    setForm((f) => {
      if (f.options.length <= 2) return f;
      const options = f.options.filter((_, k) => k !== i);
      const correct = f.correct_index === i ? 0 : f.correct_index > i ? f.correct_index - 1 : f.correct_index;
      return { ...f, options, correct_index: correct };
    });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, scheduled_date: form.scheduled_date || null };
      if (editing) await updateTriviaQuestion(initial.id, payload);
      else await createTriviaQuestion(payload);
      await onSaved();
    } catch (err) {
      setError(errText(err, 'Could not save the question.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const msg = initial.answered_count > 0
      ? 'Staff have already answered this question, so it will be retired (kept for scores and streaks) instead of deleted. Continue?'
      : 'Delete this question? This cannot be undone.';
    if (!confirm(msg)) return;
    try {
      await deleteTriviaQuestion(initial.id);
      await onSaved();
    } catch (err) {
      setError(errText(err, 'Could not delete the question.'));
    }
  };

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <form onSubmit={save} className="space-y-4">
      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {locked && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {initial.answered_count} {initial.answered_count === 1 ? 'person has' : 'people have'} answered this. You can fix wording or the answer key (earlier answers are regraded), but not add or remove options.
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
        <textarea className={input} rows={3} maxLength={500} required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Answer choices (select the correct one)</label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={form.correct_index === i} onChange={() => setForm({ ...form, correct_index: i })} aria-label={`Option ${LETTERS[i]} is correct`} className="h-4 w-4 accent-[#800080]" />
              <span className="w-5 text-sm font-semibold text-gray-600">{LETTERS[i]}</span>
              <input className={input} value={opt} maxLength={200} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${LETTERS[i]}`} />
              {form.options.length > 2 && !locked && (
                <button type="button" onClick={() => removeOption(i)} className="px-2 text-gray-500 hover:text-red-600" aria-label={`Remove option ${LETTERS[i]}`}>×</button>
              )}
            </div>
          ))}
        </div>
        {form.options.length < 4 && !locked && (
          <button type="button" onClick={addOption} className="mt-2 text-sm font-medium text-[#800080] hover:underline">+ Add option</button>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Why is it correct? (shown after answering)</label>
        <textarea className={input} rows={2} maxLength={400} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Handbook section</label>
          <input className={input} list="trivia-sources" maxLength={160} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <datalist id="trivia-sources">{SOURCES.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Show on date</label>
          <input type="date" className={input} value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="approved">Approved (can be shown)</option>
            <option value="draft">Draft (not shown)</option>
            <option value="retired">Retired (not shown)</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div>{editing && <button type="button" onClick={remove} className="text-sm font-medium text-red-600 hover:underline">Delete</button>}</div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#800080] px-4 py-2 text-sm font-medium text-white hover:bg-[#660066] disabled:opacity-50">{saving ? 'Saving…' : 'Save question'}</button>
        </div>
      </div>
    </form>
  );
};

const ImportForm = ({ onDone, onClose }) => {
  const [text, setText] = useState('');
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsed = useMemo(() => parseQuestionsText(text), [text]);
  const good = parsed.filter((p) => p.question);
  const bad = parsed.filter((p) => p.error);

  const readFile = async (file) => {
    if (!file) return;
    setText(await file.text());
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    setServerErrors([]);
    try {
      const res = await importTriviaQuestions(good.map((p) => p.question));
      await onDone(res.imported);
    } catch (err) {
      setError(errText(err, 'Could not import the questions.'));
      setServerErrors(err.response?.data?.errors || []);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-purple-50 p-3 text-sm text-gray-700">
        <p className="font-medium">How to import</p>
        <p className="mt-1">Copy the rows from your spreadsheet (no need to include the header) and paste them below, or choose a CSV file. Columns in this order:</p>
        <p className="mt-1 font-mono text-xs break-words">Question | A | B | C | D | Correct answer | Explanation | Handbook section</p>
        <p className="mt-1 text-xs text-gray-600">Correct answer can be a letter (A–D), a number (1–4) or the exact text of the option. Leave C and D empty for two-option questions. Imported questions are added as approved but not scheduled.</p>
      </div>
      <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(e) => readFile(e.target.files?.[0])} className="block text-sm" />
      <textarea className="h-44 w-full rounded-lg border border-gray-300 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Paste rows here…" value={text} onChange={(e) => setText(e.target.value)} />
      {text.trim() && (
        <div className="text-sm">
          <p><strong>{good.length}</strong> ready to import{bad.length > 0 && <>, <strong className="text-red-600">{bad.length}</strong> need fixing</>}</p>
          {bad.length > 0 && (
            <ul className="mt-2 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs text-red-700">
              {bad.map((b) => <li key={b.row}>Row {b.row}: {b.error}</li>)}
            </ul>
          )}
        </div>
      )}
      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}
        {serverErrors.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs">{serverErrors.map((e) => <li key={e.row}>Question {e.row}: {e.error}</li>)}</ul>}
      </div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={submit} disabled={saving || good.length === 0 || bad.length > 0} className="rounded-lg bg-[#800080] px-4 py-2 text-sm font-medium text-white hover:bg-[#660066] disabled:opacity-50">
          {saving ? 'Importing…' : `Import ${good.length || ''} question${good.length === 1 ? '' : 's'}`}
        </button>
      </div>
      {bad.length > 0 && <p className="text-right text-xs text-gray-500">Fix the rows above first. Nothing is imported until every row is valid.</p>}
    </div>
  );
};

const ScheduleForm = ({ defaultDate, count, onDone, onClose }) => {
  const [start, setStart] = useState(defaultDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setSaving(true);
    setError('');
    try {
      await onDone(await scheduleTriviaQuestions(start));
    } catch (err) {
      setError(errText(err, 'Could not schedule the questions.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        This gives each of the <strong>{count}</strong> unscheduled approved questions its own day, one per day in the order they were added, starting on the date below. Days that already have a question are skipped.
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">First day</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        {start && count > 0 && <p className="mt-1 text-xs text-gray-500">The last of these would be around {formatTriviaDate(addDays(start, count - 1))} (later if some days are already taken).</p>}
      </div>
      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={go} disabled={saving || !start || count === 0} className="rounded-lg bg-[#800080] px-4 py-2 text-sm font-medium text-white hover:bg-[#660066] disabled:opacity-50">{saving ? 'Scheduling…' : 'Schedule questions'}</button>
      </div>
    </div>
  );
};

const TriviaAdmin = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [editing, setEditing] = useState(null); // null | 'new' | question
  const [importing, setImporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await getTriviaQuestions());
    } catch (err) {
      setError(errText(err, 'Could not load the questions.'));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 5000); };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;

  const { today, questions, summary } = data;
  const active = (q) => q.status === 'approved';
  const visible = questions.filter((q) => {
    if (filter === 'upcoming') return active(q) && q.scheduled_date && q.scheduled_date >= today;
    if (filter === 'unscheduled') return active(q) && !q.scheduled_date;
    if (filter === 'past') return active(q) && q.scheduled_date && q.scheduled_date < today;
    if (filter === 'inactive') return !active(q);
    return true;
  });
  const daysLeft = summary.upcoming;
  const scheduleDefault = summary.last_scheduled_date ? addDays(summary.last_scheduled_date, 1) : nextMonthStart(today);

  return (
    <div className="space-y-4">
      {notice && <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</div>}

      <div className="rounded-xl border border-[#e6cce6] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-700">
              <strong>{summary.total}</strong> questions · <strong>{daysLeft}</strong> scheduled from today on · <strong>{summary.unscheduled}</strong> not scheduled
            </p>
            {summary.last_scheduled_date && <p className="mt-0.5 text-xs text-gray-500">Scheduled through {formatTriviaDate(summary.last_scheduled_date)}</p>}
            {daysLeft < 14 && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                {daysLeft === 0 ? 'No upcoming questions are scheduled.' : `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} of questions left.`} Add and schedule more so staff don't hit an empty day.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing('new')} className="rounded-lg bg-[#800080] px-3 py-2 text-sm font-medium text-white hover:bg-[#660066]">Add question</button>
            <button type="button" onClick={() => setImporting(true)} className="rounded-lg border border-[#800080] px-3 py-2 text-sm font-medium text-[#800080] hover:bg-purple-50">Import</button>
            <button type="button" onClick={() => setScheduling(true)} disabled={summary.unscheduled === 0} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Schedule…</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${filter === f.id ? 'bg-[#800080] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          {questions.length === 0 ? 'No questions yet. Use Import to add the HR-approved list, then Schedule.' : 'Nothing in this view.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((q) => (
            <li key={q.id}>
              <button type="button" onClick={() => setEditing(q)} className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-[#800080] sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-500">{q.scheduled_date ? formatTriviaDate(q.scheduled_date) : 'No date yet'}</span>
                  <StatusPill q={q} today={today} />
                </div>
                <p className="mt-1 break-words text-sm font-medium text-gray-900">{q.question}</p>
                <p className="mt-1 break-words text-xs text-gray-600">Answer: {LETTERS[q.correct_index]}. {q.options[q.correct_index]}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {q.source ? `${q.source} · ` : ''}
                  {q.answered_count > 0 ? `${q.correct_count} of ${q.answered_count} answered correctly (${Math.round((q.correct_count / q.answered_count) * 100)}%)` : 'No answers yet'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add question' : 'Edit question'} onClose={() => setEditing(null)}>
          <QuestionForm
            initial={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await load(); flash('Saved.'); }}
          />
        </Modal>
      )}
      {importing && (
        <Modal title="Import questions" wide onClose={() => setImporting(false)}>
          <ImportForm
            onClose={() => setImporting(false)}
            onDone={async (n) => { setImporting(false); await load(); flash(`Imported ${n} questions. Use Schedule to give them dates.`); }}
          />
        </Modal>
      )}
      {scheduling && (
        <Modal title="Schedule questions" onClose={() => setScheduling(false)}>
          <ScheduleForm
            defaultDate={scheduleDefault}
            count={summary.unscheduled}
            onClose={() => setScheduling(false)}
            onDone={async (r) => { setScheduling(false); await load(); flash(r.scheduled ? `Scheduled ${r.scheduled} questions from ${formatTriviaDate(r.first_date)} to ${formatTriviaDate(r.last_date)}.` : 'Nothing to schedule.'); }}
          />
        </Modal>
      )}
    </div>
  );
};

export default TriviaAdmin;
