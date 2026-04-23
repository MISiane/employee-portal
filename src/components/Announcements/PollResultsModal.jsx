import { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { getPollVoters } from '../../api/polls';

const PollResultsModal = ({ isOpen, onClose, pollId, pollQuestion }) => {
  const [voters, setVoters] = useState([]);
  const [summary, setSummary] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState('all');

  useEffect(() => {
    if (isOpen && pollId) {
      fetchVoters();
    }
  }, [isOpen, pollId]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const data = await getPollVoters(pollId);
      setVoters(data.voters);
      setSummary(data.summary);
      setTotalVotes(data.totalVotes);
    } catch (error) {
      console.error('Error fetching voters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVoters = selectedOption === 'all' 
    ? voters 
    : voters.filter(v => v.option_id === parseInt(selectedOption));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Poll Results
              </h3>
              <p className="text-white/80 text-sm mt-1">{pollQuestion}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
              </span>
            </div>
          </div>
        </div>

        {/* Summary Chart */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Summary</h4>
          <div className="space-y-3">
            {summary.map(option => {
              const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
              return (
                <div key={option.option_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{option.option_text}</span>
                    <span className="font-medium text-gray-700">
                      {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter and Voters List */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-gray-700">Voters</h4>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Options</option>
              {summary.map(option => (
                <option key={option.option_id} value={option.option_id}>
                  {option.option_text} ({option.vote_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Voters List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading voters...</p>
            </div>
          ) : filteredVoters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No votes yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVoters.map(voter => (
                <div key={voter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-gray-800">
                      {voter.first_name} {voter.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {voter.employee_code} • {voter.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {voter.option_text}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(voter.voted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollResultsModal;