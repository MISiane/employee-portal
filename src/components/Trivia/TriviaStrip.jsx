import { useCallback, useEffect, useState } from 'react';
import { getTodayTrivia } from '../../api/trivia';
import TriviaCard from './TriviaCard';
import TriviaLeaderboard from './TriviaLeaderboard';
import TriviaModal from './TriviaModal';
import { formatTriviaDate } from './triviaFormat';

// Slim strip under the dashboard greeting. The question and the leaderboard open in modals.
// It hides itself if trivia can't load (for example, before the server update is live).
const TriviaStrip = () => {
  const [info, setInfo] = useState(null);
  const [failed, setFailed] = useState(false);
  const [modal, setModal] = useState(null); // 'question' | 'leaderboard' | null

  const load = useCallback(async () => {
    try {
      setInfo(await getTodayTrivia());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (failed || !info) return null;

  const comingSoon = !!info.coming_soon;
  const hasQuestion = !!info.question;
  const needsAnswer = hasQuestion && !info.answered;

  let status = 'One question a day about our hotel and handbook.';
  if (comingSoon) status = `Starts ${formatTriviaDate(info.starts_on)}`;
  else if (needsAnswer) status = "Today's question is waiting for you.";
  else if (hasQuestion && info.answered) status = 'You answered today. See you tomorrow!';
  else status = 'No question today. Check back tomorrow.';

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-[#e6cce6] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-lg" aria-hidden="true">💡</span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-900">
              Daily Trivia
              {comingSoon && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">Coming soon</span>}
              {needsAnswer && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">New</span>}
              {!comingSoon && info.stats?.current_streak > 0 && (
                <span className="whitespace-nowrap rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">🔥 {info.stats.current_streak}</span>
              )}
            </p>
            <p className="truncate text-xs text-gray-600">{status}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setModal('question')}
            className="flex-1 whitespace-nowrap rounded-lg bg-[#800080] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#660066] sm:flex-none"
          >
            {needsAnswer ? 'Answer now' : "Today's question"}
          </button>
          <button
            type="button"
            onClick={() => setModal('leaderboard')}
            className="flex-1 whitespace-nowrap rounded-lg border border-[#800080] px-4 py-2 text-sm font-medium text-[#800080] transition hover:bg-purple-50 sm:flex-none"
          >
            Leaderboard
          </button>
        </div>
      </div>

      {modal === 'question' && (
        <TriviaModal title="Daily Trivia" onClose={() => setModal(null)}>
          <TriviaCard bare onAnswered={load} onOpenLeaderboard={() => setModal('leaderboard')} />
        </TriviaModal>
      )}
      {modal === 'leaderboard' && (
        <TriviaModal title="Leaderboard" onClose={() => setModal(null)}>
          <TriviaLeaderboard bare />
        </TriviaModal>
      )}
    </>
  );
};

export default TriviaStrip;
