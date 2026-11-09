// Payroll cutoff periods: the 11th to the 25th, and the 26th to the 10th of the
// next month. A period is identified by "YYYY-MM-A" (11th-25th of that month) or
// "YYYY-MM-B" (26th of that month to the 10th of the next). A leave request belongs
// to the period its start date falls in.

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])-([AB])$/;

// First and last day (inclusive, "YYYY-MM-DD") of a period key, or null if invalid.
const rangeOfPeriod = (key) => {
  const m = PERIOD_RE.exec(String(key || ''));
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (m[3] === 'A') return { start: ymd(year, month, 11), end: ymd(year, month, 25) };
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return { start: ymd(year, month, 26), end: ymd(nextYear, nextMonth, 10) };
};

// The period key a "YYYY-MM-DD" date falls in.
const periodOfDate = (dateStr) => {
  const [y, mo, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  if (d >= 26) return `${y}-${pad(mo)}-B`;
  if (d >= 11) return `${y}-${pad(mo)}-A`;
  const prevYear = mo === 1 ? y - 1 : y;
  const prevMonth = mo === 1 ? 12 : mo - 1;
  return `${prevYear}-${pad(prevMonth)}-B`;
};

module.exports = { rangeOfPeriod, periodOfDate, PERIOD_RE };
