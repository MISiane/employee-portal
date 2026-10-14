import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon, 
  ChartBarIcon,
  PaperClipIcon,        // ← NEW
  DocumentTextIcon,     // ← NEW
  PhotoIcon             // ← NEW
} from '@heroicons/react/24/outline';
import { createAnnouncement, updateAnnouncement } from '../../api/announcements';
import { createPoll, getPollByAnnouncement, deletePoll, updatePoll } from '../../api/polls';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AnnouncementModal = ({ isOpen, onClose, announcement, mode }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expires_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ===== ATTACHMENT STATE =====
  const [attachment, setAttachment] = useState(null);          // File object
  const [attachmentPreview, setAttachmentPreview] = useState(null);  // { url, type, filename }
  const [removeExisting, setRemoveExisting] = useState(false); // Flag to remove old attachment
  
  // Poll states
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiresAt, setPollExpiresAt] = useState('');
  const [existingPollId, setExistingPollId] = useState(null);
  const [fetchingPoll, setFetchingPoll] = useState(false);

  // Quill toolbar configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'clean'],
      ['blockquote', 'code-block']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align',
    'link', 'blockquote', 'code-block'
  ];

  useEffect(() => {
    if (announcement && mode === 'edit') {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : ''
      });
      
      // ===== Load existing attachment if any =====
      if (announcement.attachment_url) {
        setAttachmentPreview({
          url: announcement.attachment_url,
          type: announcement.attachment_type,
          filename: announcement.attachment_filename
        });
        setRemoveExisting(false);
      } else {
        setAttachmentPreview(null);
      }
      setAttachment(null); // Reset any previously selected file
      
      // Check if announcement has a poll and fetch it
      if (announcement.has_poll) {
        fetchExistingPoll(announcement.id);
      } else {
        setIncludePoll(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollExpiresAt('');
        setExistingPollId(null);
      }
    } else {
      // Reset for new announcement
      setFormData({ title: '', content: '', expires_at: '' });
      setAttachment(null);
      setAttachmentPreview(null);
      setRemoveExisting(false);
      setIncludePoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollExpiresAt('');
      setExistingPollId(null);
    }
  }, [announcement, mode]);

  const fetchExistingPoll = async (announcementId) => {
    setFetchingPoll(true);
    try {
      const response = await getPollByAnnouncement(announcementId);
      if (response.hasPoll && response.poll) {
        setIncludePoll(true);
        setPollQuestion(response.poll.question);
        setPollOptions(response.poll.options.map(opt => opt.option_text));
        setPollExpiresAt(response.poll.expires_at ? response.poll.expires_at.split('T')[0] : '');
        setExistingPollId(response.poll.id);
      }
    } catch (error) {
      console.error('Error fetching existing poll:', error);
    } finally {
      setFetchingPoll(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ===== ATTACHMENT HANDLERS =====
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB to match backend)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    // Validate type
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 
      'image/gif', 'image/webp', 'application/pdf'
    ];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed.');
      return;
    }

    setError('');
    setAttachment(file);
    setRemoveExisting(false);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview({
          url: reader.result,
          type: 'image',
          filename: file.name
        });
      };
      reader.readAsDataURL(file);
    } else {
      // PDF
      setAttachmentPreview({
        url: null,
        type: 'pdf',
        filename: file.name
      });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    setRemoveExisting(true);
    
    // Reset file input
    const fileInput = document.getElementById('announcement-attachment');
    if (fileInput) fileInput.value = '';
  };

  // ===== POLL HANDLERS =====
  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate announcement fields
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

    // Validate poll if included
    if (includePoll) {
      if (!pollQuestion.trim()) {
        setError('Poll question is required when adding a poll');
        setLoading(false);
        return;
      }
      
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError('Please add at least 2 options for the poll');
        setLoading(false);
        return;
      }
    }

    try {
      let announcementId;
      
      if (mode === 'add') {
        // ===== Build payload with attachment =====
        const payload = {
          title: formData.title,
          content: formData.content,
          expires_at: formData.expires_at || null,
        };
        
        if (attachment) {
          payload.attachment = attachment;
        }
        
        const response = await createAnnouncement(payload);
        announcementId = response.id || response.announcement?.id;
        
        if (!announcementId) {
          throw new Error('Failed to get announcement ID after creation');
        }
        
        // Create poll if included
        if (includePoll) {
          const validOptions = pollOptions.filter(opt => opt.trim());
          await createPoll(announcementId, {
            question: pollQuestion.trim(),
            options: validOptions,
            expires_at: pollExpiresAt || null
          });
        }
        
        alert('Announcement created successfully!');
      } else {
        // ===== Update existing announcement =====
        const payload = {
          title: formData.title,
          content: formData.content,
          expires_at: formData.expires_at || null,
        };
        
        if (attachment) {
          payload.attachment = attachment;
        }
        
        if (removeExisting) {
          payload.remove_attachment = true;
        }
        
        await updateAnnouncement(announcement.id, payload);
        
        // Handle poll updates
        if (includePoll) {
          const validOptions = pollOptions.filter(opt => opt.trim());
          
          if (existingPollId) {
            await updatePoll(existingPollId, {
              question: pollQuestion.trim(),
              options: validOptions,
              expires_at: pollExpiresAt || null
            });
          } else {
            await createPoll(announcement.id, {
              question: pollQuestion.trim(),
              options: validOptions,
              expires_at: pollExpiresAt || null
            });
          }
        } else if (existingPollId) {
          const confirmDelete = window.confirm(
            'Removing this poll will delete all existing votes. Are you sure?'
          );
          if (confirmDelete) {
            await deletePoll(existingPollId);
          } else {
            setIncludePoll(true);
            setLoading(false);
            return;
          }
        }
        
        alert('Announcement updated successfully!');
      }
      
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
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

          {fetchingPoll && (
            <div className="mb-4 text-center text-gray-500">
              Loading poll data...
            </div>
          )}

          <div className="space-y-4">
            {/* Announcement Fields */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your announcement content here..."
                  className="h-64"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You can format text with bold, italic, lists, colors, and more.
              </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if this announcement doesn't expire
              </p>
            </div>

            {/* ===== ATTACHMENT UPLOAD ===== */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <PaperClipIcon className="h-4 w-4 text-gray-500" />
                Attachment (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Images (JPG, PNG, GIF, WEBP) or PDF. Max 5MB.
              </p>

              {!attachmentPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PaperClipIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF, WEBP, or PDF (max 5MB)
                    </p>
                  </div>
                  <input
                    id="announcement-attachment"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  {/* Image Preview */}
                  {attachmentPreview.type === 'image' && attachmentPreview.url && (
                    <img
                      src={attachmentPreview.url}
                      alt="Preview"
                      className="mb-3 max-h-48 w-full rounded-lg object-contain bg-white"
                    />
                  )}

                  {/* PDF Preview */}
                  {attachmentPreview.type === 'pdf' && (
                    <div className="mb-3 flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-200">
                      <DocumentTextIcon className="h-10 w-10 text-red-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {attachmentPreview.filename}
                        </p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                    </div>
                  )}

                  {/* File Info + Remove Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {attachmentPreview.type === 'image' ? (
                        <PhotoIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-600 truncate">
                        {attachmentPreview.filename}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-100 transition flex-shrink-0"
                      title="Remove attachment"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Poll Option */}
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePoll}
                  onChange={(e) => {
                    if (!e.target.checked && existingPollId) {
                      const confirm = window.confirm(
                        '⚠️ WARNING: Removing this poll will delete ALL existing votes. This cannot be undone. Are you sure?'
                      );
                      if (!confirm) return;
                    }
                    setIncludePoll(e.target.checked);
                  }}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {existingPollId ? 'Edit poll' : 'Add a poll to this announcement'}
                </span>
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
              </label>
              
              {existingPollId && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  ⚠️ Editing options will preserve existing votes. Removing an option will delete its votes.
                </div>
              )}
            </div>

            {/* Poll Fields (conditional) */}
            {includePoll && (
              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-purple-600" />
                  {existingPollId ? 'Edit Poll' : 'Poll Settings'}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poll Question *
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="e.g., What feature would you like to see next?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options * (minimum 2)
                  </label>
                  <div className="space-y-2">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          maxLength="100"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Option
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {pollOptions.length}/10 options
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poll Expiration (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={pollExpiresAt}
                    onChange={(e) => setPollExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              disabled={loading || fetchingPoll}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors disabled:opacity-50"
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