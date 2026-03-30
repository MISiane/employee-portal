import { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  CalendarIcon,
  UserCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, deleteAnnouncement } from '../api/announcements';
import AnnouncementModal from '../components/Announcements/AnnouncementModal';

const Announcements = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.page]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements({ page: pagination.page, limit: 10 });
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Error deleting announcement');
      }
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowModal(true);
  };

  const handleView = (announcement) => {
    setViewingAnnouncement(announcement);
    setShowViewModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDateTime(dateString);
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl sm:rounded-[28px] border border-[#e6cce6] bg-white/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#e6cce6] border-t-[#800080]" />
          <p className="text-sm sm:text-base font-medium text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 antialiased">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        {/* Header Banner */}
        <div className="overflow-hidden rounded-xl sm:rounded-[30px] bg-[#800080] p-5 sm:p-6 md:p-8 text-white shadow-[0_20px_60px_-20px_rgba(128,0,128,0.6)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm backdrop-blur">
                <MegaphoneIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                Company Updates
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Announcements</h1>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/90">
                Stay updated with the latest company news and updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="rounded-xl sm:rounded-2xl bg-white/10 px-3 sm:px-5 py-2 sm:py-4 backdrop-blur text-center sm:text-left">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/70">
                  Total Posts
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {pagination.total || announcements.length}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white px-4 sm:px-5 py-2.5 sm:py-3 font-semibold text-[#800080] shadow-lg transition hover:bg-[#f5e6f7] text-sm sm:text-base"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Post Announcement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="rounded-xl sm:rounded-[28px] border border-[#e6cce6] bg-white p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 sm:mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#f5e6f7]">
              <MegaphoneIcon className="h-8 w-8 sm:h-10 sm:w-10 text-[#800080]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">No announcements yet</h3>
            <p className="mt-1 sm:mt-2 text-sm text-gray-600">Check back later.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="relative overflow-hidden rounded-xl sm:rounded-[28px] border border-[#e6cce6] bg-white shadow-[0_10px_30px_-18px_rgba(128,0,128,0.25)]"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-[#800080]" />

                <div className="p-4 sm:p-5 md:p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f5e6f7] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#800080]">
                        <MegaphoneIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        Announcement
                      </div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                        {announcement.title}
                      </h3>

                      {/* Meta Info - Responsive Grid */}
                      <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <UserCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#800080]" />
                          <span className="truncate">
                            {announcement.first_name} {announcement.last_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#800080]" />
                          <span>{getTimeAgo(announcement.created_at)}</span>
                        </div>

                        <div className="text-gray-400 text-[10px] sm:text-xs">
                          Posted on {formatDateTime(announcement.created_at)}
                        </div>

                        {announcement.expires_at && (
                          <div className="rounded-full bg-[#f5e6f7] px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-[#800080] inline-block w-fit">
                            Expires: {formatDate(announcement.expires_at)}
                          </div>
                        )}
                      </div>

                      {/* Content Preview */}
                      <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-[#faf0fa] px-3 sm:px-4 py-3 sm:py-4">
                        <p className="text-sm leading-6 text-gray-700 line-clamp-3 sm:line-clamp-none">
                          {announcement.content.length > 150 && !showViewModal
                            ? `${announcement.content.substring(0, 150)}...`
                            : announcement.content}
                        </p>
                      </div>

                      {/* View Button */}
                      <div className="mt-3 sm:mt-4">
                        <button
                          onClick={() => handleView(announcement)}
                          className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-[#800080] px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:bg-[#660066] w-full sm:w-auto justify-center"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Full Announcement
                        </button>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 self-start shrink-0">
                        <button
                          onClick={() => handleView(announcement)}
                          className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3 text-gray-500 transition hover:border-[#e6cce6] hover:bg-[#f5e6f7] hover:text-[#800080]"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3 text-gray-500 transition hover:border-[#e6cce6] hover:bg-[#f5e6f7] hover:text-[#800080]"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination - Responsive */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="w-full sm:w-auto rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-white px-4 py-2 sm:py-2.5 font-medium text-[#800080] transition hover:bg-[#f5e6f7] disabled:cursor-not-allowed disabled:opacity-50 text-sm"
            >
              Previous
            </button>

            <div className="rounded-xl sm:rounded-2xl bg-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 shadow-sm">
              Page {pagination.page} of {pagination.totalPages}
            </div>

            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="w-full sm:w-auto rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-white px-4 py-2 sm:py-2.5 font-medium text-[#800080] transition hover:bg-[#f5e6f7] disabled:cursor-not-allowed disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnnouncementModal
        isOpen={showModal}
        onClose={handleModalClose}
        announcement={editingAnnouncement}
        mode={editingAnnouncement ? 'edit' : 'add'}
      />

      {/* View Modal - Mobile Responsive */}
      {showViewModal && viewingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl sm:rounded-[28px] border border-[#e6cce6] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6cce6] bg-white/95 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#800080]">
                  Announcement Details
                </p>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  {viewingAnnouncement.title}
                </h2>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="self-end sm:self-center rounded-xl p-2 text-gray-500 transition hover:bg-[#f5e6f7] hover:text-[#800080]"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-7">
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl sm:rounded-2xl bg-[#f5e6f7] p-3 sm:p-4">
                <div className="rounded-xl sm:rounded-2xl bg-white p-2 sm:p-3 shadow-sm self-start">
                  <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#800080]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {viewingAnnouncement.first_name} {viewingAnnouncement.last_name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Posted on {formatDateTime(viewingAnnouncement.created_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-[#faf0fa] p-4 sm:p-5">
                <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-6 sm:leading-7 text-gray-700">
                  {viewingAnnouncement.content}
                </p>
              </div>

              {viewingAnnouncement.expires_at && (
                <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-[#e6cce6] bg-[#f5e6f7] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-[#800080]">
                  This announcement expires on {formatDate(viewingAnnouncement.expires_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;