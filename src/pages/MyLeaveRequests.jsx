import { useState, useEffect } from "react";
import {
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  DocumentTextIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import LeaveRequestModal from "../components/LeaveRequests/LeaveRequestModal";
import EditLeaveRequestModal from "../components/LeaveRequests/EditLeaveRequestModal";
import api from "../api/config";

const getFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  // Cloudinary URLs are already full HTTPS URLs
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  // Fallback for local development
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${fileUrl}`;
};

// Helper function to check if medical certificate exists
const hasMedicalCertificate = (request) => {
  const url = request.medical_certificate_url;
  if (!url) return false;
  if (typeof url === "string") {
    if (
      url === "true" ||
      url === "false" ||
      url === "t" ||
      url === "f" ||
      url === "1" ||
      url === "0"
    ) {
      return false;
    }
    if (url === "" || url === "null" || url === "NULL") {
      return false;
    }
    return url.startsWith("http") || url.startsWith("/uploads");
  }
  return false;
};

const MyLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/leave/requests");
      setLeaveRequests(response.data.leaveRequests);

      const requests = response.data.leaveRequests;
      setStats({
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
        total: requests.length,
      });
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedRequest(null);
    fetchLeaveRequests();
    alert("Leave request updated successfully!");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getPayTypeBadge = (payType, status) => {
    if (status !== "approved") return null;
    if (!payType || payType === "pending") return null;

    return payType === "with_pay" ? (
      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        With Pay
      </span>
    ) : (
      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Without Pay
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDays = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getApproverName = (request) => {
    if (request.approved_by_name) {
      return request.approved_by_name;
    }
    return request.approved_by ? "Admin" : "N/A";
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
          <h1 className="text-2xl font-bold text-gray-800">
            My Leave Requests
          </h1>
          <p className="mt-1 text-gray-600">
            Manage and track your leave requests
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 inline-flex items-center rounded-xl bg-[#800080] px-4 py-2 text-white shadow-md transition hover:bg-[#660066] sm:mt-0"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          New Leave Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="rounded-2xl border border-[#d9def1] bg-[#eaf0ff] p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-[#800080]">
                Total Requests
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-[#800080]">
                {stats.total}
              </p>
            </div>
            <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-[#800080]" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#ede3b2] bg-[#f8f1c9] p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-yellow-700">
                Pending
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-yellow-800">
                {stats.pending}
              </p>
            </div>
            <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#cfe8d6] bg-[#dff1e4] p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-green-700">
                Approved
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-green-800">
                {stats.approved}
              </p>
            </div>
            <CheckCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0d5d8] bg-[#fae6e7] p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-red-700">
                Rejected
              </p>
              <p className="mt-1 text-xl md:text-2xl font-bold text-red-800">
                {stats.rejected}
              </p>
            </div>
            <XCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Leave Requests Section */}
      <div className="overflow-hidden rounded-2xl border border-[#e6cce6] bg-white shadow-sm">
        <div className="border-b border-[#eee5ef] bg-[#faf5fb] px-4 md:px-6 py-3 md:py-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            Leave Request History
          </h2>
        </div>

        {leaveRequests.length === 0 ? (
          <div className="py-8 md:py-12 text-center">
            <CalendarIcon className="mx-auto mb-3 md:mb-4 h-10 w-10 md:h-12 md:w-12 text-[#caa5cf]" />
            <p className="text-sm md:text-base text-gray-500">
              No leave requests found
            </p>
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
                <div
                  key={request.id}
                  className="p-4 hover:bg-[#fcf8fc] transition-colors"
                >
                  <div onClick={() => handleViewDetails(request)}>
                    {/* Header with Leave Type, Pay Type (if approved), and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-wrap gap-1">
                        <CalendarIcon className="h-5 w-5 text-[#800080]" />
                        <span className="font-medium text-gray-900">
                          {request.leave_type}
                        </span>
                        {getPayTypeBadge(
                          request.leave_pay_type,
                          request.status,
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Leave Details Grid */}
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm text-gray-800">
                          {formatDate(request.start_date)} -{" "}
                          {formatDate(request.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Days</p>
                        <p className="text-sm font-medium text-gray-800">
                          {calculateDays(request.start_date, request.end_date)}{" "}
                          days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reason</p>
                        <p className="text-sm text-gray-600 break-words">
                          {request.reason || "-"}
                        </p>
                      </div>
                      {/* Medical Certificate */}
                      {request.leave_type === "Sick Leave" && (
                        <div>
                          <p className="text-xs text-gray-500">
                            Medical Certificate
                          </p>
                          {hasMedicalCertificate(request) ? (
                            <a
                              href={getFileUrl(request.medical_certificate_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-green-600 hover:text-green-800 mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              View Attachment
                            </a>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">
                              Not uploaded
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show Approval Notes for Approved requests */}
                      {request.status === "approved" &&
                        request.approval_notes && (
                          <div className="mt-2 rounded-lg bg-blue-50 p-2">
                            <div className="flex items-start space-x-2">
                              <ChatBubbleLeftIcon className="mt-0.5 h-3 w-3 text-blue-500" />
                              <p className="text-xs text-blue-700">
                                {request.approval_notes}
                              </p>
                            </div>
                          </div>
                        )}

                      <div>
                        <p className="text-xs text-gray-500">Date Filed</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Outside the clickable area */}
                  <div className="flex justify-end space-x-2 pt-2 border-t border-[#f1e7f2] mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(request);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {request.status === "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(request);
                        }}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                        title="Edit Request"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view - Table */}
            {/* Desktop view - Optimized Table */}
<div className="hidden md:block overflow-x-auto">
  <table className="min-w-full divide-y divide-[#eee5ef]">
    <thead className="bg-[#faf5fb]">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Leave Details
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Duration
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Status
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Info
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[#f1e7f2] bg-white">
      {leaveRequests.map((request) => (
        <tr
          key={request.id}
          className="transition hover:bg-[#fcf8fc] cursor-pointer group"
          onClick={() => handleViewDetails(request)}
        >
          {/* Leave Details - Combined Type + Reason */}
          <td className="px-4 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                  request.leave_type === 'Sick Leave' ? 'bg-green-100' :
                  request.leave_type === 'Vacation Leave' ? 'bg-blue-100' :
                  request.leave_type === 'Emergency Leave' ? 'bg-red-100' : 'bg-purple-100'
                }`}>
                  <CalendarIcon className={`h-5 w-5 ${
                    request.leave_type === 'Sick Leave' ? 'text-green-600' :
                    request.leave_type === 'Vacation Leave' ? 'text-blue-600' :
                    request.leave_type === 'Emergency Leave' ? 'text-red-600' : 'text-purple-600'
                  }`} />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {request.leave_type}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]" title={request.reason}>
                  {request.reason || 'No reason provided'}
                </p>
                {/* Medical Certificate Indicator */}
                {request.leave_type === 'Sick Leave' && hasMedicalCertificate(request) && (
                  <span className="inline-flex items-center mt-1 text-xs text-green-600">
                    <DocumentTextIcon className="h-3 w-3 mr-0.5" />
                    Med Cert attached
                  </span>
                )}
              </div>
            </div>
          </td>
          
          {/* Duration - Start/End + Days */}
          <td className="px-4 py-4">
            <div className="text-sm text-gray-900">
              {formatDate(request.start_date)}
            </div>
            <div className="text-xs text-gray-400">
              to {formatDate(request.end_date)}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-1">
              {calculateDays(request.start_date, request.end_date)} days
            </div>
          </td>
          
          {/* Status + Pay Type */}
          <td className="px-4 py-4">
            <div>
              {getStatusBadge(request.status)}
            </div>
            {request.status === 'approved' && request.leave_pay_type && request.leave_pay_type !== 'pending' && (
              <div className="mt-1">
                {getPayTypeBadge(request.leave_pay_type, request.status)}
              </div>
            )}
          </td>
          
          {/* Info - Approval Notes + Date Filed + Pay Type */}
          <td className="px-4 py-4">
            {/* Approval Notes (if any) */}
            {request.status === 'approved' && request.approval_notes && (
              <div className="flex items-start mb-2">
                <ChatBubbleLeftIcon className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate max-w-[180px]" title={request.approval_notes}>
                  {request.approval_notes}
                </span>
              </div>
            )}
            {/* Date Filed */}
            <div className="text-xs text-gray-400">
              Filed: {formatDate(request.created_at)}
            </div>
            {/* Date adjusted indicator */}
            {request.dates_adjusted_by_admin && (
              <div className="text-xs text-amber-600 mt-1">
                Dates adjusted
              </div>
            )}
          </td>
          
          {/* Actions */}
          <td className="px-4 py-4 text-right whitespace-nowrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(request);
              }}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition mx-0.5"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {request.status === 'pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(request);
                }}
                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition mx-0.5"
                title="Edit Request"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
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

      {/* Edit Leave Request Modal */}
      <EditLeaveRequestModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRequest(null);
        }}
        onSuccess={handleEditSuccess}
        leaveRequest={selectedRequest}
      />

      {/* Details Modal for Mobile/Desktop View */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#e6cce6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Leave Request Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 transition hover:text-[#800080]"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-500">Leave Type:</div>
                <div className="font-medium text-gray-800">
                  {selectedRequest.leave_type}
                </div>

                <div className="text-gray-500">Status:</div>
                <div>{getStatusBadge(selectedRequest.status)}</div>

                {selectedRequest.status === "approved" && (
                  <>
                    <div className="text-gray-500">Pay Type:</div>
                    <div className="font-medium">
                      {selectedRequest.leave_pay_type === "with_pay" ? (
                        <span className="text-green-600">With Pay</span>
                      ) : (
                        <span className="text-gray-600">Without Pay</span>
                      )}
                    </div>
                  </>
                )}

                <div className="text-gray-500">Duration:</div>
                <div className="font-medium text-gray-800">
                  {formatDate(selectedRequest.start_date)} -{" "}
                  {formatDate(selectedRequest.end_date)}
                </div>

                <div className="text-gray-500">Total Days:</div>
                <div className="font-medium text-gray-800">
                  {calculateDays(
                    selectedRequest.start_date,
                    selectedRequest.end_date,
                  )}{" "}
                  days
                </div>

                <div className="text-gray-500">Reason:</div>
                <div className="text-gray-700 break-words">
                  {selectedRequest.reason || "No reason provided"}
                </div>

                <div className="text-gray-500">Date Filed:</div>
                <div className="text-gray-600">
                  {formatDateTime(selectedRequest.created_at)}
                </div>
              </div>

              {(selectedRequest.status === "approved" ||
                selectedRequest.status === "rejected") && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-700">
                    Approval Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <UserCircleIcon className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-500">Approved by:</span>
                        <span className="ml-2 font-medium text-gray-800">
                          {getApproverName(selectedRequest)}
                        </span>
                      </div>
                    </div>

                    {selectedRequest.updated_at &&
                      selectedRequest.status === "approved" && (
                        <div className="flex items-start">
                          <ClockIcon className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Approved on:</span>
                            <span className="ml-2 text-gray-600">
                              {formatDateTime(selectedRequest.updated_at)}
                            </span>
                          </div>
                        </div>
                      )}

                    {selectedRequest.approval_notes && (
                      <div className="mt-2 rounded-lg bg-blue-50 p-3">
                        <div className="flex items-start">
                          <DocumentTextIcon className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-700 mb-1">
                              Approval Notes:
                            </p>
                            <p className="text-sm text-blue-800">
                              {selectedRequest.approval_notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show original vs adjusted dates if dates were modified by admin */}
                    {selectedRequest.dates_adjusted_by_admin && (
                      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                        <div className="flex items-start space-x-2">
                          <CalendarIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-yellow-700 mb-1">
                              {" "}
                              Dates Adjusted by Admin
                            </p>
                            <div className="text-sm">
                              <p className="text-gray-600">
                                <span className="line-through text-gray-400">
                                  Original Request:{" "}
                                  {formatDate(
                                    selectedRequest.original_start_date,
                                  )}{" "}
                                  -{" "}
                                  {formatDate(
                                    selectedRequest.original_end_date,
                                  )}
                                </span>
                              </p>
                              <p className="text-green-700 font-medium mt-1">
                                Adjusted to:{" "}
                                {formatDate(selectedRequest.start_date)} -{" "}
                                {formatDate(selectedRequest.end_date)}
                              </p>
                              {selectedRequest.adjustment_reason && (
                                <p className="text-xs text-gray-600 mt-2">
                                  <strong>Reason for adjustment:</strong>{" "}
                                  {selectedRequest.adjustment_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedRequest.medical_certificate && (
                      <div className="mt-2 rounded-lg bg-yellow-50 p-2">
                        <p className="text-xs text-yellow-700">
                          ⚠️ Medical Certificate required for this sick leave.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Certificate Section - For Sick Leave */}
              {selectedRequest.leave_type === "Sick Leave" && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Medical Certificate
                      </p>
                      {hasMedicalCertificate(selectedRequest) ? (
                        <div className="mt-2">
                          <p className="text-xs text-blue-700 mb-2">
                            Your medical certificate has been uploaded.
                          </p>
                          <a
                            href={getFileUrl(
                              selectedRequest.medical_certificate_url,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            View Medical Certificate
                          </a>
                          {selectedRequest.medical_certificate_filename && (
                            <p className="text-xs text-gray-500 mt-2">
                              Filename:{" "}
                              {selectedRequest.medical_certificate_filename}
                              {selectedRequest.medical_certificate_size && (
                                <span className="ml-1">
                                  (
                                  {(
                                    selectedRequest.medical_certificate_size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-amber-700">
                            ⚠️ No medical certificate uploaded for this sick
                            leave.
                          </p>
                          {selectedRequest.status === "pending" && (
                            <p className="text-xs text-amber-600 mt-1">
                              You can edit this request to upload a medical
                              certificate.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-center">
                  <ClockIcon className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
                  <p className="text-sm text-yellow-700">
                    Your request is pending approval. You will be notified once
                    processed.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {selectedRequest.status === "pending" && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedRequest);
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                  <PencilIcon className="h-4 w-4 inline mr-1" />
                  Edit Request
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg bg-[#800080] px-4 py-2 text-white transition hover:bg-[#660066]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaveRequests;
