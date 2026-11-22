import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TriviaCard from '../components/Trivia/TriviaCard';
import TriviaLeaderboard from '../components/Trivia/TriviaLeaderboard';
import TriviaAdmin from '../components/Trivia/TriviaAdmin';

const Trivia = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'leaderboard', label: 'Leaderboard' },
    ...(isAdmin ? [{ id: 'manage', label: 'Manage questions' }] : []),
  ];
  const requested = params.get('tab');
  const tab = tabs.some((t) => t.id === requested) ? requested : 'today';

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-1 sm:p-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daily Trivia</h1>
        <p className="text-sm text-gray-600">One question a day about our hotel, our values and our handbook.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setParams(t.id === 'today' ? {} : { tab: t.id }, { replace: true })}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium ${tab === t.id ? 'bg-purple-50 text-[#800080]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && <TriviaCard />}
      {tab === 'leaderboard' && <TriviaLeaderboard />}
      {tab === 'manage' && isAdmin && <TriviaAdmin />}
    </div>
  );
};

export default Trivia;
