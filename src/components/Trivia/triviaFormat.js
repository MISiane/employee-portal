// "2026-12-01" -> "December 1, 2026" (no time zone shifting)
export const formatTriviaDate = (value) => {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const LETTERS = ['A', 'B', 'C', 'D'];
