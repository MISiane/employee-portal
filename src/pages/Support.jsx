import { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftIcon, 
  QuestionMarkCircleIcon,
  BugAntIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { submitFeedback, getFAQs } from '../api/feedback';
import { useAuth } from '../context/AuthContext';

const Support = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback form state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Admin FAQ management
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general' });

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: BugAntIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'suggestion', label: 'Suggestion', icon: LightBulbIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'issue', label: 'System Issue', icon: ExclamationTriangleIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'question', label: 'Question', icon: QuestionMarkCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const data = await getFAQs();
      setFaqs(data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
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
        setShowFeedbackForm(false);
        setSubmitted(false);
        setTitle('');
        setDescription('');
        setFeedbackType('bug');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'closed': return <XCircleIcon className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <ChatBubbleLeftIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>
        <p className="text-purple-100">
          Get answers to common questions or submit feedback to help us improve
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'faq'
                ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
                : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
            }`}
          >
            <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
            FAQs
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'feedback'
                ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
                : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
            }`}
          >
            <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
            Submit Feedback
          </button>
        </div>

        <div className="p-6">
          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Frequently Asked Questions
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingFaq(null);
                      setFaqForm({ question: '', answer: '', category: 'general' });
                      setShowFaqModal(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add FAQ
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">Loading FAQs...</div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No FAQs available yet.</div>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border rounded-lg overflow-hidden">
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                          <span className="font-medium text-gray-800">{faq.question}</span>
                          <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 pt-0 text-gray-600 border-t">
                          <p>{faq.answer}</p>
                          {isAdmin && (
                            <div className="flex justify-end space-x-2 mt-3 pt-2 border-t">
                              <button
                                onClick={() => {
                                  setEditingFaq(faq);
                                  setFaqForm(faq);
                                  setShowFaqModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this FAQ?')) {
                                    // Call delete API
                                    setFaqs(faqs.filter(f => f.id !== faq.id));
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div>
              {!showFeedbackForm ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftIcon className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Share Your Feedback</h3>
                  <p className="text-gray-600 mb-6">
                    Help us improve by reporting bugs or suggesting features
                  </p>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Submit Feedback
                  </button>
                </div>
              ) : submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Thank You!</h3>
                  <p className="text-gray-600">Your feedback has been submitted successfully.</p>
                  <button
                    onClick={() => {
                      setShowFeedbackForm(false);
                      setSubmitted(false);
                    }}
                    className="mt-4 text-purple-600 hover:text-purple-700"
                  >
                    Submit another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback Type *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {feedbackTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFeedbackType(type.id)}
                          className={`flex items-center justify-center space-x-2 p-2 rounded-lg border transition ${
                            feedbackType === type.id
                              ? `${type.bg} border-${type.color.split('-')[1]}-300`
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <type.icon className={`h-4 w-4 ${feedbackType === type.id ? type.color : 'text-gray-400'}`} />
                          <span className={`text-xs ${feedbackType === type.id ? 'text-gray-800' : 'text-gray-600'}`}>
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

                  {/* Info */}
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                    <p>📍 Page: {window.location.pathname}</p>
                    <p className="mt-1">⚠️ Your feedback helps us improve the system!</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="general">General</option>
                  <option value="leave">Leave</option>
                  <option value="payslip">Payslip</option>
                  <option value="profile">Profile</option>
                  <option value="account">Account</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowFaqModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingFaq) {
                    // Update FAQ
                    setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...faqForm } : f));
                  } else {
                    // Add FAQ
                    setFaqs([...faqs, { ...faqForm, id: Date.now() }]);
                  }
                  setShowFaqModal(false);
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {editingFaq ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;