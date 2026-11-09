// Payroll cutoff periods: the 11th to the 25th, and the 26th to the 10th of the
// next month. A period is identified by "YYYY-MM-A" (11th-25th of that month) or
// "YYYY-MM-B" (26th of that month to the 10th of the next). A leave request belongs
// to the period its start date falls in. (Same rules as server/utils/cutoff.js.)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// The period key a "YYYY-MM-DD" date falls in.
export const periodOfDate = (dateStr) => {
  const [y, mo, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  if (d >= 26) return `${y}-${pad(mo)}-B`;
  if (d >= 11) return `${y}-${pad(mo)}-A`;
  const prevYear = mo === 1 ? y - 1 : y;
  const prevMonth = mo === 1 ? 12 : mo - 1;
  return `${prevYear}-${pad(prevMonth)}-B`;
};

// "Nov 11 – 25, 2026" / "Nov 26 – Dec 10, 2026" / "Dec 26, 2026 – Jan 10, 2027"
export const periodLabel = (key) => {
  const [y, mo, half] = key.split('-');
  const year = Number(y);
  const month = Number(mo);
  if (half === 'A') return `${MONTHS[month - 1]} 11 – 25, ${year}`;
  if (month === 12) return `Dec 26, ${year} – Jan 10, ${year + 1}`;
  return `${MONTHS[month - 1]} 26 – ${MONTHS[month]} 10, ${year}`;
};

// The period before / after a key
const step = (key, direction) => {
  const [y, mo, half] = key.split('-');
  let year = Number(y);
  let month = Number(mo);
  if (direction > 0) {
    if (half === 'A') return `${year}-${mo}-B`;
    month += 1;
    if (month === 13) { month = 1; year += 1; }
    return `${year}-${pad(month)}-A`;
  }
  if (half === 'B') return `${year}-${mo}-A`;
  month -= 1;
  if (month === 0) { month = 12; year -= 1; }
  return `${year}-${pad(month)}-B`;
};

const todayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const currentPeriod = () => periodOfDate(todayString());

// Newest first: `ahead` periods in the future, the current one, then `back` before it
export const periodOptions = (back = 24, ahead = 2) => {
  const current = currentPeriod();
  let key = current;
  for (let i = 0; i < ahead; i++) key = step(key, 1);
  const options = [];
  for (let i = 0; i < back + ahead + 1; i++) {
    options.push({ key, label: periodLabel(key), isCurrent: key === current });
    key = step(key, -1);
  }
  return options;
};
