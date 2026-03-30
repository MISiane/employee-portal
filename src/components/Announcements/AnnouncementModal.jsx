import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createAnnouncement, updateAnnouncement } from '../../api/announcements';

const AnnouncementModal = ({ isOpen, onClose, announcement, mode }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expires_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (announcement && mode === 'edit') {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        expires_at: ''
      });
    }
  }, [announcement, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'add') {
        await createAnnouncement(formData);
        alert('Announcement created successfully!');
      } else {
        await updateAnnouncement(announcement.id, formData);
        alert('Announcement updated successfully!');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'add' ? 'Post New Announcement' : 'Edit Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your announcement content here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if this announcement doesn't expire
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Post Announcement' : 'Update Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;