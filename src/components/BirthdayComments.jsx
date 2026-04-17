import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChatBubbleLeftIcon, 
  HeartIcon, 
  TrashIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { getBirthdayComments, addBirthdayComment, deleteBirthdayComment } from '../api/employees';


const BirthdayComments = ({ birthdayPersonId, birthdayPersonName, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState({});

  useEffect(() => {
    fetchComments();
  }, [birthdayPersonId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await getBirthdayComments(birthdayPersonId);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await addBirthdayComment(birthdayPersonId, newComment);
      setComments([response.comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await deleteBirthdayComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment.');
    }
  };


const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  // Extract just the time part from the database string
  const timeMatch = dateString.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }
  
  return dateString;
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-lg w-full max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HeartSolidIcon className="h-5 w-5 text-yellow-300" />
                Birthday Wishes for {birthdayPersonName}
              </h3>
              <p className="text-sm text-white/80 mt-1">
                {comments.length} {comments.length === 1 ? 'wish' : 'wishes'} received
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading wishes...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No wishes yet. Be the first to greet!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <UserCircleIcon className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">
                          {comment.commenter_first_name} {comment.commenter_last_name}
                        </span>
                        <span className="text-xs text-gray-400">
  {formatDateTime(comment.created_at)}
</span>
                      </div>
                      <p className="text-gray-700 text-sm mt-1">{comment.comment}</p>
                    </div>
                  </div>
                  
                  {/* Delete button - only for admin or commenter */}
                  {(user?.role === 'admin' || comment.commenter_id === user?.id) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Write a birthday wish for ${birthdayPersonName}... 🎂`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              maxLength="500"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? 'Sending...' : 'Send Wish 🎁'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            {newComment.length}/500 characters
          </p>
        </form>
      </div>
    </div>
  );
};

export default BirthdayComments;