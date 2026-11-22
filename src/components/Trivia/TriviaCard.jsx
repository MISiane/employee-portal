import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayTrivia, submitTriviaAnswer } from '../../api/trivia';
import { formatTriviaDate, LETTERS } from './triviaFormat';

const StreakChip = ({ streak }) => (
  <span
    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700"
    title="Days in a row you answered"
  >
    🔥 {streak} {streak === 1 ? 'day' : 'days'} in a row
  </span>
);

// Today's question. `compact` is the dashboard version (hides itself if trivia can't load).
const TriviaCard = ({ compact = false }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setData(await getTodayTrivia());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await submitTriviaAnswer(selected);
      setData((prev) => ({
        ...prev,
        answered: true,
        my_answer: res.my_answer,
        stats: res.stats,
        question: { ...prev.question, correct_index: res.correct_index, explanation: res.explanation, source: res.source },
      }));
    } catch (err) {
      if (err.response?.status === 409) await load();
      else setError(err.response?.data?.error || 'Could not save your answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return compact ? null : <div className="rounded-2xl border border-[#e6cce6] bg-white p-6 text-gray-500">Loading today's question…</div>;
  }
  if (failed || !data) {
    return compact ? null : (
      <div className="rounded-2xl border border-[#e6cce6] bg-white p-6 text-gray-600">
        Daily trivia isn't available right now. Please try again later.
      </div>
    );
  }

  const { question, answered, my_answer: mine, stats, next_date: nextDate } = data;
  const shell = 'rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-white p-4 sm:p-6 shadow-sm';

  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base sm:text-lg font-bold text-gray-900">💡 Daily Trivia</h2>
      {stats?.current_streak > 0 && <StreakChip streak={stats.current_streak} />}
    </div>
  );

  if (!question) {
    return (
      <div className={shell}>
        {header}
        <p className="text-sm text-gray-700">
          {nextDate
            ? stats?.questions_so_far > 0
              ? `No question today. The next one is on ${formatTriviaDate(nextDate)}.`
              : `Daily trivia starts on ${formatTriviaDate(nextDate)}. Get ready to test what you know about our hotel!`
            : 'There is no question today. Check back tomorrow.'}
        </p>
      </div>
    );
  }

  return (
    <div className={shell}>
      {header}
      <p className="mb-4 text-sm sm:text-base font-medium text-gray-900 break-words">{question.question}</p>

      <div className="space-y-2" role="radiogroup" aria-label="Answers">
        {question.options.map((opt, i) => {
          const isCorrect = answered && i === question.correct_index;
          const isWrongPick = answered && i === mine?.answer_index && i !== question.correct_index;
          const isSelected = !answered && selected === i;
          let tone = 'border-gray-300 bg-white text-gray-800 hover:border-[#800080] hover:bg-purple-50';
          if (isSelected) tone = 'border-[#800080] bg-purple-50 text-gray-900 ring-2 ring-[#800080]/30';
          if (isCorrect) tone = 'border-green-400 bg-green-50 text-green-900';
          if (isWrongPick) tone = 'border-red-400 bg-red-50 text-red-900';
          if (answered && !isCorrect && !isWrongPick) tone = 'border-gray-200 bg-white text-gray-500';
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected || (answered && i === mine?.answer_index)}
              disabled={answered || submitting}
              onClick={() => setSelected(i)}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${tone} disabled:cursor-default`}
            >
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                {isCorrect ? '✓' : isWrongPick ? '✗' : LETTERS[i]}
              </span>
              <span className="min-w-0 break-words">{opt}</span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="mt-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected === null || submitting}
            className="rounded-xl bg-[#800080] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#660066] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Submit answer'}
          </button>
          <p className="mt-2 text-xs text-gray-500">You get one try, so choose carefully.</p>
        </div>
      )}

      {answered && (
        <div className={`mt-4 rounded-xl p-4 text-sm ${mine?.is_correct ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}>
          <p className="font-semibold">
            {mine?.is_correct
              ? 'Correct! 🎉'
              : `Not quite. The answer is ${LETTERS[question.correct_index]}.`}
          </p>
          {question.explanation && <p className="mt-1 break-words">{question.explanation}</p>}
          {question.source && <p className="mt-2 text-xs opacity-80">From: {question.source}</p>}
        </div>
      )}

      {answered && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
          <span>
            Score: <strong>{stats.correct}</strong> correct of {stats.answered} answered · Best streak:{' '}
            <strong>{stats.best_streak}</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate('/trivia?tab=leaderboard')}
            className="font-medium text-[#800080] hover:underline"
          >
            See the leaderboard →
          </button>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-500">A new question appears every day. Come back tomorrow!</p>
    </div>
  );
};

export default TriviaCard;
