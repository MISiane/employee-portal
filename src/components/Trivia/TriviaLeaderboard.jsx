import { useEffect, useState } from 'react';
import { getTriviaLeaderboard } from '../../api/trivia';

const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

const initials = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

const Row = ({ row, isMe }) => (
  <li
    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isMe ? 'bg-purple-50 ring-1 ring-[#800080]/30' : 'bg-white'}`}
  >
    <span className="w-8 flex-shrink-0 text-center text-sm font-bold text-gray-700">{medal(row.rank) || row.rank}</span>
    {row.avatar_url ? (
      <img src={row.avatar_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
    ) : (
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
        {initials(row.name)}
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">
        {row.name}
        {isMe && <span className="ml-2 rounded-full bg-[#800080] px-2 py-0.5 text-[10px] font-semibold text-white">You</span>}
      </p>
      <p className="truncate text-xs text-gray-500">{row.department || 'General'}</p>
    </div>
    <div className="flex-shrink-0 text-right">
      <p className="text-sm font-bold text-gray-900">{row.correct}</p>
      <p className="whitespace-nowrap text-[11px] text-gray-500">
        correct{row.current_streak > 1 ? ` · 🔥${row.current_streak}` : ''}
      </p>
    </div>
  </li>
);

const TriviaLeaderboard = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(false);
    getTriviaLeaderboard(period)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [period]);

  const tabs = [
    { id: 'month', label: 'This month' },
    { id: 'all', label: 'All time' },
  ];

  const meInList = data?.leaders?.some((r) => r.user_id === data.me?.user_id);

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">🏆 Leaderboard</h2>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                period === t.id ? 'bg-white text-[#800080] shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">Could not load the leaderboard.</p>}
      {!error && !data && <p className="text-sm text-gray-500">Loading…</p>}
      {data && data.leaders.length === 0 && (
        <p className="text-sm text-gray-600">No scores yet {period === 'month' ? 'this month' : ''}. Be the first on the board!</p>
      )}
      {data && data.leaders.length > 0 && (
        <>
          <p className="mb-2 text-xs text-gray-500">Ranked by correct answers. Ties share the same rank.</p>
          <ul className="space-y-1.5">
            {data.leaders.map((r) => (
              <Row key={r.user_id} row={r} isMe={r.user_id === data.me?.user_id} />
            ))}
          </ul>
          {data.me && !meInList && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <p className="mb-1.5 text-xs text-gray-500">Your position</p>
              <ul>
                <Row row={data.me} isMe />
              </ul>
            </div>
          )}
          {!data.me && <p className="mt-3 text-xs text-gray-500">Answer a question to join the leaderboard.</p>}
        </>
      )}
    </div>
  );
};

export default TriviaLeaderboard;
