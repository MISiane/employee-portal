import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, LightBulbIcon, BugAntIcon, QuestionMarkCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { submitFeedback } from '../../api/feedback';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: BugAntIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'suggestion', label: 'Suggestion', icon: LightBulbIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'issue', label: 'System Issue', icon: ExclamationTriangleIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'question', label: 'Question', icon: QuestionMarkCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await submitFeedback({
        type: feedbackType,
        title,
        description,
        url: window.location.href,
        user_agent: navigator.userAgent
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setTitle('');
        setDescription('');
        setFeedbackType('bug');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.response?.data?.error || 'Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Submit Feedback</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Thank You!</h3>
            <p className="text-gray-600">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Feedback Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id)}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition ${
                      feedbackType === type.id
                        ? `${type.bg} border-purple-300 ring-2 ring-purple-200`
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <type.icon className={`h-4 w-4 ${feedbackType === type.id ? type.color : 'text-gray-400'}`} />
                    <span className={`text-sm ${feedbackType === type.id ? 'text-gray-800' : 'text-gray-600'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Brief summary of your feedback"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="5"
                placeholder="Please provide detailed information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Info Note */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p>📍 Page: {window.location.pathname}</p>
              <p className="mt-1">⚠️ Your feedback helps us improve the system!</p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;