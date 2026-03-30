import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LeaveRequestModal from '../components/LeaveRequests/LeaveRequestModal';
import api from '../api/config';

const MyLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leave/requests');
      setLeaveRequests(response.data.leaveRequests);

      const requests = response.data.leaveRequests;
      setStats({
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
        total: requests.length
      });
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDays = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[28px] bg-[#f5e6f7]">
        <div className="text-center">
          <ArrowPathIcon className="mx-auto mb-4 h-12 w-12 animate-spin text-[#800080]" />
          <p className="text-gray-500">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Leave Requests</h1>
          <p className="mt-1 text-gray-600">Manage and track your leave requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 inline-flex items-center rounded-xl bg-[#800080] px-4 py-2 text-white shadow-md transition hover:bg-[#660066] sm:mt-0"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          New Leave Request
        </button>
      </div>

     {/* Stats Cards - Responsive Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  <div className="rounded-2xl border border-[#d9def1] bg-[#eaf0ff] p-4 md:p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs md:text-sm font-medium text-[#800080]">Total Requests</p>
        <p className="mt-1 text-xl md:text-2xl font-bold text-[#800080]">{stats.total}</p>
      </div>
      <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-[#800080]" />
    </div>
  </div>

  <div className="rounded-2xl border border-[#ede3b2] bg-[#f8f1c9] p-4 md:p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs md:text-sm font-medium text-yellow-700">Pending</p>
        <p className="mt-1 text-xl md:text-2xl font-bold text-yellow-800">{stats.pending}</p>
      </div>
      <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
    </div>
  </div>

  <div className="rounded-2xl border border-[#cfe8d6] bg-[#dff1e4] p-4 md:p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs md:text-sm font-medium text-green-700">Approved</p>
        <p className="mt-1 text-xl md:text-2xl font-bold text-green-800">{stats.approved}</p>
      </div>
      <CheckCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
    </div>
  </div>

  <div className="rounded-2xl border border-[#f0d5d8] bg-[#fae6e7] p-4 md:p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs md:text-sm font-medium text-red-700">Rejected</p>
        <p className="mt-1 text-xl md:text-2xl font-bold text-red-800">{stats.rejected}</p>
      </div>
      <XCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
    </div>
  </div>
</div>

{/* Leave Requests Section */}
<div className="overflow-hidden rounded-2xl border border-[#e6cce6] bg-white shadow-sm">
  <div className="border-b border-[#eee5ef] bg-[#faf5fb] px-4 md:px-6 py-3 md:py-4">
    <h2 className="text-base md:text-lg font-semibold text-gray-800">Leave Request History</h2>
  </div>

  {leaveRequests.length === 0 ? (
    <div className="py-8 md:py-12 text-center">
      <CalendarIcon className="mx-auto mb-3 md:mb-4 h-10 w-10 md:h-12 md:w-12 text-[#caa5cf]" />
      <p className="text-sm md:text-base text-gray-500">No leave requests found</p>
      <button
        onClick={() => setShowModal(true)}
        className="mt-3 md:mt-4 font-medium text-[#800080] hover:text-[#660066] text-sm md:text-base"
      >
        Create your first leave request
      </button>
    </div>
  ) : (
    <>
      {/* Mobile view - Card layout */}
      <div className="block md:hidden divide-y divide-[#f1e7f2]">
        {leaveRequests.map((request) => (
          <div key={request.id} className="p-4 hover:bg-[#fcf8fc] transition-colors">
            {/* Header with Leave Type and Status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-[#800080]" />
                <span className="font-medium text-gray-900">{request.leave_type}</span>
              </div>
              {getStatusBadge(request.status)}
            </div>
            
            {/* Leave Details Grid */}
            <div className="space-y-2 mb-3">
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm text-gray-800">
                  {formatDate(request.start_date)} - {formatDate(request.end_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Days</p>
                <p className="text-sm font-medium text-gray-800">
                  {calculateDays(request.start_date, request.end_date)} days
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reason</p>
                <p className="text-sm text-gray-600 break-words">{request.reason || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date Filed</p>
                <p className="text-xs text-gray-400">{formatDate(request.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#eee5ef]">
          <thead className="bg-[#faf5fb]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Date Filed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1e7f2] bg-white">
            {leaveRequests.map((request) => (
              <tr key={request.id} className="transition hover:bg-[#fcf8fc]">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-[#800080]" />
                    <span className="text-sm text-gray-900">{request.leave_type}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm text-gray-900">
                    {calculateDays(request.start_date, request.end_date)} days
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div
                    className="max-w-xs truncate text-sm text-gray-900"
                    title={request.reason}
                  >
                    {request.reason || '-'}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {getStatusBadge(request.status)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(request.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}
</div>

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          fetchLeaveRequests();
        }}
      />
    </div>
  );
};

export default MyLeaveRequests;