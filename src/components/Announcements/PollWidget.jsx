import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPollByAnnouncement, votePoll } from '../../api/polls';
import { ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const PollWidget = ({ announcementId, onPollUpdate }) => {
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [announcementId]);

  const fetchPoll = async () => {
    setLoading(true);
    try {
      const data = await getPollByAnnouncement(announcementId);
      setPoll(data);
      if (data.hasPoll && data.poll.hasVoted) {
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setVoting(true);
    try {
      const result = await votePoll(poll.poll.id, selectedOption);
      setPoll({
        ...poll,
        poll: {
          ...poll.poll,
          options: result.options,
          totalVotes: result.totalVotes,
          hasVoted: true,
          userVote: result.userVote
        }
      });
      setShowResults(true);
      if (onPollUpdate) onPollUpdate();
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.response?.data?.error || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (voteCount) => {
    if (!poll?.poll?.totalVotes || poll.poll.totalVotes === 0) return 0;
    return Math.round((voteCount / poll.poll.totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!poll?.hasPoll) return null;

  const { poll: pollData } = poll;
  const isExpired = pollData.is_expired;

  return (
    <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartBarIcon className="h-5 w-5 text-purple-600" />
        <h4 className="font-semibold text-gray-800">Quick Poll</h4>
        
        {pollData.totalVotes > 0 && (
          <span className="text-xs text-gray-500 ml-auto">
            {pollData.totalVotes} vote{pollData.totalVotes !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-3 font-medium">{pollData.question}</p>

      {isExpired ? (
        <div className="text-center py-3">
          <p className="text-sm text-orange-600">This poll has ended</p>
          <button
            onClick={() => setShowResults(!showResults)}
            className="mt-2 text-xs text-purple-600 hover:text-purple-700"
          >
            {showResults ? 'Hide Results' : 'View Results'}
          </button>
        </div>
      ) : showResults || pollData.hasVoted ? (
        // Show results
        <div className="space-y-3">
          {pollData.options.map((option) => {
            const percentage = getPercentage(option.vote_count);
            const isUserVote = pollData.userVote === option.id;
            
            return (
              <div key={option.id} className="relative">
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1">
                    {isUserVote && (
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    )}
                    {option.option_text}
                  </span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUserVote ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
          {!isExpired && (
            <button
              onClick={() => setShowResults(false)}
              className="text-xs text-purple-600 hover:text-purple-700 mt-2"
            >
              Back to vote
            </button>
          )}
        </div>
      ) : (
        // Show voting options
        <div className="space-y-2">
          {pollData.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-purple-100 transition"
            >
              <input
                type="radio"
                name="poll-option"
                value={option.id}
                onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">{option.option_text}</span>
            </label>
          ))}
          <button
            onClick={handleVote}
            disabled={!selectedOption || voting}
            className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {voting ? 'Submitting...' : 'Vote'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PollWidget;