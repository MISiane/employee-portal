import { useState, useEffect } from "react";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  DocumentTextIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import api from "../api/config";

const getFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  // Cloudinary URLs are already full HTTPS URLs
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  // Fallback for local development
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${baseUrl}${fileUrl}`;
};

const LeaveRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [approvePayType, setApprovePayType] = useState("with_pay");
  const [approveMedCert, setApproveMedCert] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [editDates, setEditDates] = useState(false);
  const [adjustedStartDate, setAdjustedStartDate] = useState("");
  const [adjustedEndDate, setAdjustedEndDate] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
    leave_pay_type: "with_pay",
    status: "",
    admin_note: "",
  });

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
  }, [filterStatus, filterDepartment, searchTerm, pagination.page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 20,
      };

      if (filterStatus) params.status = filterStatus;
      if (filterDepartment) params.department = filterDepartment;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get("/leave/all-requests", { params });
      setRequests(response.data.leaveRequests);
      setPagination(response.data.pagination);

      const allRequests = response.data.leaveRequests;
      setStats({
        pending: allRequests.filter((r) => r.status === "pending").length,
        approved: allRequests.filter((r) => r.status === "approved").length,
        rejected: allRequests.filter((r) => r.status === "rejected").length,
        total: response.data.pagination.total,
      });
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/employees/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchLeaveBalance = async (userId) => {
    setCheckingBalance(true);
    try {
      const response = await api.get(`/leave/balances/${userId}`);
      setLeaveBalances(response.data);
      setBalanceError("");
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      setBalanceError("Unable to fetch leave balance");
    } finally {
      setCheckingBalance(false);
    }
  };

  const calculateDays = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Helper function to check if medical certificate actually exists
  const hasMedicalCertificate = (request) => {
    // Check if URL exists and is not a boolean string
    const url = request.medical_certificate_url;
    if (!url) return false;
    if (typeof url === "string") {
      // Reject boolean strings
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
      // Reject empty or null strings
      if (url === "" || url === "null" || url === "NULL") {
        return false;
      }
      // Valid URL should start with http or /uploads
      return url.startsWith("http") || url.startsWith("/uploads");
    }
    return false;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hasSufficientBalance = () => {
    if (!selectedRequest || !leaveBalances) return false;

    if (approvePayType === "without_pay") return true;

    const startDate =
      editDates && adjustedStartDate
        ? adjustedStartDate
        : selectedRequest.start_date;
    const endDate =
      editDates && adjustedEndDate ? adjustedEndDate : selectedRequest.end_date;
    const days = calculateDays(startDate, endDate);

    switch (selectedRequest.leave_type) {
      case "Vacation Leave":
        return leaveBalances.vacation_leave >= days;
      case "Sick Leave":
        return leaveBalances.sick_leave >= days;
      case "Emergency Leave":
        return leaveBalances.emergency_leave >= days;
      case "Special Leave":
        return leaveBalances.special_leave >= days;
      default:
        return true;
    }
  };

  const getCurrentBalance = () => {
    if (!selectedRequest || !leaveBalances) return 0;

    switch (selectedRequest.leave_type) {
      case "Vacation Leave":
        return leaveBalances.vacation_leave;
      case "Sick Leave":
        return leaveBalances.sick_leave;
      case "Emergency Leave":
        return leaveBalances.emergency_leave;
      case "Special Leave":
        return leaveBalances.special_leave;
      default:
        return 0;
    }
  };

  const getAdjustedDays = () => {
    if (editDates && adjustedStartDate && adjustedEndDate) {
      return calculateDays(adjustedStartDate, adjustedEndDate);
    }
    return calculateDays(
      selectedRequest?.start_date,
      selectedRequest?.end_date,
    );
  };

  const handleApproveClick = async (request) => {
    setSelectedRequest(request);
    await fetchLeaveBalance(request.user_id);
    setApprovePayType("with_pay");
    setEditDates(false);
    setAdjustedStartDate(formatDateForInput(request.start_date));
    setAdjustedEndDate(formatDateForInput(request.end_date));
    setAdjustmentReason("");
    if (request.leave_type === "Sick Leave") {
      setApproveMedCert(false);
    }
    setApprovalNotes("");
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (approvePayType === "with_pay" && !hasSufficientBalance()) {
      const days = getAdjustedDays();
      alert(
        `Cannot approve: Insufficient leave balance. Only ${getCurrentBalance()} days available. Requesting ${days} days.`,
      );
      return;
    }

    try {
      const updateData = {
        status: "approved",
        comments: approvalNotes,
        leave_pay_type: approvePayType,
        medical_certificate:
          selectedRequest.leave_type === "Sick Leave" ? approveMedCert : null,
        approval_notes: approvalNotes || null,
      };

      if (editDates && adjustedStartDate && adjustedEndDate) {
        updateData.start_date = adjustedStartDate;
        updateData.end_date = adjustedEndDate;
        updateData.adjustment_reason = adjustmentReason;
        updateData.dates_adjusted_by_admin = true;
      }

      await api.put(`/leave/requests/${selectedRequest.id}`, updateData);
      fetchRequests();
      setShowApproveModal(false);
      setSelectedRequest(null);
      setApprovePayType("with_pay");
      setApproveMedCert(false);
      setApprovalNotes("");
      setEditDates(false);
      setAdjustedStartDate("");
      setAdjustedEndDate("");
      setAdjustmentReason("");
      setLeaveBalances(null);

      const message =
        approvePayType === "with_pay"
          ? "Leave request approved successfully!"
          : "Leave request approved successfully (Without Pay - no balance deducted).";
      alert(message);
    } catch (error) {
      console.error("Error approving leave request:", error);
      alert(
        "Error approving leave request: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this leave request?")) {
      try {
        await api.put(`/leave/requests/${id}`, { status: "rejected" });
        fetchRequests();
        alert("Leave request rejected successfully!");
      } catch (error) {
        console.error("Error rejecting leave request:", error);
        alert("Error rejecting leave request");
      }
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  // Edit Request Handlers
  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      leave_type: request.leave_type,
      start_date: formatDateForInput(request.start_date),
      end_date: formatDateForInput(request.end_date),
      reason: request.reason || "",
      leave_pay_type: request.leave_pay_type || "with_pay",
      status: request.status,
      admin_note: "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    try {
      const updateData = {
        leave_type: editFormData.leave_type,
        start_date: editFormData.start_date,
        end_date: editFormData.end_date,
        reason: editFormData.reason,
        leave_pay_type: editFormData.leave_pay_type,
        status: editFormData.status,
      };

      if (editFormData.admin_note) {
        updateData.admin_note = editFormData.admin_note;
      }

      await api.put(`/leave/requests/${selectedRequest.id}`, updateData);
      alert("Leave request updated successfully!");
      setShowEditModal(false);
      fetchRequests();
    } catch (error) {
      console.error("Error updating leave request:", error);
      alert(
        "Error updating leave request: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const resetApproveModal = () => {
    setShowApproveModal(false);
    setSelectedRequest(null);
    setLeaveBalances(null);
    setApprovePayType("with_pay");
    setApproveMedCert(false);
    setApprovalNotes("");
    setEditDates(false);
    setAdjustedStartDate("");
    setAdjustedEndDate("");
    setAdjustmentReason("");
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

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="rounded-full bg-[#f3e8a7] px-2.5 py-1 text-xs font-medium text-[#7a5d00]">
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getPayTypeBadge = (payType) => {
    if (!payType) return null;
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

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case "Vacation Leave":
        return "bg-blue-100 text-blue-800";
      case "Sick Leave":
        return "bg-green-100 text-green-800";
      case "Emergency Leave":
        return "bg-red-100 text-red-800";
      case "Special Leave":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterDepartment("");
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filterStatus || filterDepartment || searchTerm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
        <p className="mt-1 text-gray-600">
          Manage and approve employee leave requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-[24px] border border-[#d7d8f0] bg-[#eaf0ff] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Requests
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {stats.total}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#eee2b8] bg-[#f6efc9] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#b88700]">Pending</p>
              <p className="mt-1 text-3xl font-bold text-[#8a6500]">
                {stats.pending}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-[#e0aa00]" />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#cfe8d6] bg-[#dff1e4] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="mt-1 text-3xl font-bold text-green-700">
                {stats.approved}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#f0d5d8] bg-[#fae6e7] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Rejected</p>
              <p className="mt-1 text-3xl font-bold text-red-700">
                {stats.rejected}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[24px] border border-[#e6cce6] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a07aa0]" />
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#e6cce6] bg-[#faf5fb] py-2 pl-10 pr-4 text-gray-700 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-[#e6cce6] bg-white px-3 py-2 text-gray-700 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full rounded-xl border border-[#e6cce6] bg-white px-3 py-2 text-gray-700 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full rounded-xl border border-[#e6cce6] bg-[#faf5fb] px-4 py-2 font-medium text-[#800080] transition hover:bg-[#f5e6f7]"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="overflow-hidden rounded-[24px] border border-[#e6cce6] bg-white shadow-sm">
        {/* Mobile view - Card layout */}
        <div className="block md:hidden divide-y divide-[#eee5ef]">
          {loading ? (
            <div className="p-6 text-center">
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#800080]"></div>
              </div>
              <p className="mt-2 text-gray-500">Loading leave requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No leave requests found
            </div>
          ) : (
            requests.map((request) => {
              const days = calculateDays(request.start_date, request.end_date);

              return (
                <div
                  key={request.id}
                  className="p-4 hover:bg-[#fcf8fc] transition-colors cursor-pointer"
                  onClick={() => handleView(request)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe]">
                        <span className="text-sm font-medium text-blue-600">
                          {request.first_name?.charAt(0)}
                          {request.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.first_name} {request.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.employee_code}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Leave Type</p>
                      <div className="flex items-center flex-wrap gap-1 mt-1">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getLeaveTypeColor(request.leave_type)}`}
                        >
                          {request.leave_type}
                        </span>
                        {getPayTypeBadge(request.leave_pay_type)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Days</p>
                      <p className="font-medium text-gray-800">
                        {days} day{days !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {formatDate(request.start_date)} -{" "}
                        {formatDate(request.end_date)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="text-sm text-gray-600 break-words">
                        {request.reason || "-"}
                      </p>
                    </div>

                    {/* Medical Certificate Indicator for Mobile */}
                    {request.leave_type === "Sick Leave" && (
                      <div className="col-span-2 mt-1">
                        {hasMedicalCertificate(request) ? (
                          <div className="inline-flex items-center px-2 py-1 bg-green-50 rounded-lg">
                            <DocumentTextIcon className="h-3 w-3 text-green-600 mr-1" />
                            <span className="text-xs text-green-600">
                              Medical Certificate Attached
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 bg-yellow-50 rounded-lg">
                            <svg
                              className="h-3 w-3 text-yellow-500 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <span className="text-xs text-yellow-600">
                              No Medical Certificate
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show Approval Notes for Approved requests */}
                    {request.status === "approved" &&
                      request.approval_notes && (
                        <div className="col-span-2 mt-1 rounded-lg bg-blue-50 p-2">
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
                      <p className="text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-[#f1e7f2]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(request);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRequest(request);
                      }}
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                      title={
                        request.status !== "pending"
                          ? "Admin override edit"
                          : "Edit"
                      }
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {request.status === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveClick(request);
                          }}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(request.id);
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                          title="Reject"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop view - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-[#eee5ef]">
            <thead className="bg-[#faf5fb]">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Employee / Leave Type
                </th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Period / Days
                </th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Details
                </th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1e7f2] bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#800080]"></div>
                    </div>
                    <p className="mt-2">Loading leave requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No leave requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const days = calculateDays(
                    request.start_date,
                    request.end_date,
                  );
                  const hasMedCert =
                    request.leave_type === "Sick Leave" &&
                    hasMedicalCertificate(request);
                  const noMedCert =
                    request.leave_type === "Sick Leave" &&
                    !hasMedicalCertificate(request);

                  return (
                    <tr
                      key={request.id}
                      className="transition hover:bg-[#fcf8fc]"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe]">
                            <span className="text-sm font-medium text-blue-600">
                              {request.first_name?.charAt(0)}
                              {request.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {request.first_name} {request.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.employee_code}
                            </p>
                            <span
                              className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${getLeaveTypeColor(request.leave_type)}`}
                            >
                              {request.leave_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatShortDate(request.start_date)} -{" "}
                          {formatShortDate(request.end_date)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {days} day{days !== 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div
                          className="max-w-[200px] truncate text-sm text-gray-600"
                          title={request.reason}
                        >
                          📝 {request.reason || "-"}
                        </div>
                        {/* Medical Certificate Indicator */}
                        {request.leave_type === "Sick Leave" && (
                          <div className="flex items-center mt-1">
                            {hasMedCert ? (
                              <>
                                <DocumentTextIcon className="h-3 w-3 text-green-600 mr-1" />
                                <span className="text-xs text-green-600">
                                   Med Cert attached
                                </span>
                              </>
                            ) : noMedCert ? (
                              <>
                                <svg
                                  className="h-3 w-3 text-yellow-500 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                <span className="text-xs text-yellow-600">
                                   No Med Cert
                                </span>
                              </>
                            ) : null}
                          </div>
                        )}
                        {request.approval_notes &&
                          request.status === "approved" && (
                            <div className="flex items-center mt-1">
                              <ChatBubbleLeftIcon className="h-3 w-3 text-blue-500 mr-1" />
                              <span
                                className="text-xs text-gray-500 truncate max-w-[150px]"
                                title={request.approval_notes}
                              >
                                {request.approval_notes}
                              </span>
                            </div>
                          )}
                        <div className="text-xs text-gray-400 mt-1">
                          📅 Filed: {formatShortDate(request.created_at)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {getStatusBadge(request.status)}
                        {getPayTypeBadge(request.leave_pay_type)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <button
                          onClick={() => handleView(request)}
                          className="p-1.5 mr-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditRequest(request)}
                          className="p-1.5 mr-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                          title={
                            request.status !== "pending"
                              ? "Admin override edit"
                              : "Edit"
                          }
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApproveClick(request)}
                              className="p-1.5 mr-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Responsive */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#eee5ef] px-4 lg:px-6 py-4">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="rounded-lg border border-[#e6cce6] px-3 py-1.5 text-sm text-[#800080] transition hover:bg-[#faf5fb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm hidden sm:inline-block text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="rounded-lg border border-[#e6cce6] px-3 py-1.5 text-sm text-[#800080] transition hover:bg-[#faf5fb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Request Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] border border-[#e6cce6] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Leave Request Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 transition hover:text-[#800080]"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm text-gray-500">Employee:</div>
                <div className="text-sm font-medium text-gray-800">
                  {selectedRequest.first_name} {selectedRequest.last_name}
                </div>

                <div className="text-sm text-gray-500">Department:</div>
                <div className="text-sm font-medium text-gray-800">
                  {selectedRequest.department || "N/A"}
                </div>

                <div className="text-sm text-gray-500">Leave Type:</div>
                <div className="text-sm font-medium text-gray-800">
                  {selectedRequest.leave_type}
                  {getPayTypeBadge(selectedRequest.leave_pay_type)}
                </div>

                <div className="text-sm text-gray-500">Duration:</div>
                <div className="text-sm font-medium text-gray-800">
                  {formatDate(selectedRequest.start_date)} -{" "}
                  {formatDate(selectedRequest.end_date)}
                </div>

                <div className="text-sm text-gray-500">Days:</div>
                <div className="text-sm font-medium text-gray-800">
                  {calculateDays(
                    selectedRequest.start_date,
                    selectedRequest.end_date,
                  )}{" "}
                  days
                </div>

                <div className="text-sm text-gray-500">Reason:</div>
                <div className="text-sm font-medium text-gray-800">
                  {selectedRequest.reason || "No reason provided"}
                </div>

                <div className="text-sm text-gray-500">Status:</div>
                <div className="text-sm font-medium">
                  {getStatusBadge(selectedRequest.status)}
                </div>

                <div className="text-sm text-gray-500">Date Filed:</div>
                <div className="text-sm font-medium text-gray-800">
                  {formatDateTime(selectedRequest.created_at)}
                </div>
              </div>

              {/* Approval Details Section */}
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
                          Admin
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

              {/* Medical Certificate Attachment - For Sick Leave */}
              {selectedRequest.leave_type === "Sick Leave" && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-start space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Medical Certificate Attachment
                      </p>

                      {hasMedicalCertificate(selectedRequest) ? (
                        <>
                          <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs text-blue-700">
                              📄{" "}
                              {selectedRequest.medical_certificate_filename ||
                                "Medical Certificate"}
                              {selectedRequest.medical_certificate_size && (
                                <span className="text-gray-500 ml-1">
                                  (
                                  {(
                                    selectedRequest.medical_certificate_size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB)
                                </span>
                              )}
                            </span>
                            <a
                              href={getFileUrl(
                                selectedRequest.medical_certificate_url,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              View / Download
                            </a>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            ⚠️ Verify the medical certificate before approving.
                          </p>
                        </>
                      ) : (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                            <svg
                              className="h-5 w-5 text-yellow-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                No Medical Certificate Attached
                              </p>
                              <p className="text-xs text-yellow-700">
                                No medical certificate has been uploaded for
                                this sick leave request.
                                {selectedRequest.status === "pending" && (
                                  <span className="block mt-1">
                                    The employee can still upload one by editing
                                    this request.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Show original vs adjusted dates */}
              {selectedRequest.dates_adjusted_by_admin && (
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-start space-x-2">
                    <CalendarIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-700 mb-1">
                        📅 Dates Adjusted by Admin
                      </p>
                      <div className="text-sm">
                        <p className="text-gray-600">
                          <span className="line-through text-gray-400">
                            Original:{" "}
                            {formatDate(selectedRequest.original_start_date)} -{" "}
                            {formatDate(selectedRequest.original_end_date)}
                          </span>
                        </p>
                        <p className="text-green-700 font-medium mt-1">
                          Adjusted to: {formatDate(selectedRequest.start_date)}{" "}
                          - {formatDate(selectedRequest.end_date)}
                        </p>
                        {selectedRequest.adjustment_reason && (
                          <p className="text-xs text-gray-600 mt-2">
                            <strong>Reason:</strong>{" "}
                            {selectedRequest.adjustment_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleApproveClick(selectedRequest);
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleReject(selectedRequest.id);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="rounded-lg bg-[#f5e6f7] px-4 py-2 font-medium text-[#800080] transition hover:bg-[#edd8ef]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-[#e6cce6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Approve Leave Request
              </h3>
              <button
                onClick={resetApproveModal}
                className="text-gray-500 transition hover:text-[#800080]"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {checkingBalance ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-[#800080]"></div>
                <p className="text-gray-500">Checking leave balance...</p>
              </div>
            ) : balanceError ? (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                {balanceError}
              </div>
            ) : (
              <>
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Employee:</div>
                    <div className="font-medium text-gray-800">
                      {selectedRequest.first_name} {selectedRequest.last_name}
                    </div>

                    <div className="text-gray-500">Leave Type:</div>
                    <div className="font-medium text-gray-800">
                      {selectedRequest.leave_type}
                    </div>
                  </div>

                  {/* Date Section with Edit Option */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Leave Dates
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditDates(!editDates)}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        {editDates ? "Cancel Edit" : "Edit Dates"}
                      </button>
                    </div>

                    {!editDates ? (
                      <div className="bg-gray-50 rounded-lg p-2 text-sm">
                        <p>
                          {formatDate(selectedRequest.start_date)} -{" "}
                          {formatDate(selectedRequest.end_date)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {calculateDays(
                            selectedRequest.start_date,
                            selectedRequest.end_date,
                          )}{" "}
                          days requested
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Adjusted Start Date
                          </label>
                          <input
                            type="date"
                            value={adjustedStartDate}
                            onChange={(e) =>
                              setAdjustedStartDate(e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Adjusted End Date
                          </label>
                          <input
                            type="date"
                            value={adjustedEndDate}
                            onChange={(e) => setAdjustedEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Reason for Adjustment (Optional)
                          </label>
                          <textarea
                            value={adjustmentReason}
                            onChange={(e) =>
                              setAdjustmentReason(e.target.value)
                            }
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Coverage issue, employee requested change, etc."
                          />
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2">
                          <p className="text-xs text-yellow-700">
                            ⚠️ The employee will be notified of the date change.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 border-t pt-3">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Pay Type *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={approvePayType === "with_pay"}
                          onChange={() => setApprovePayType("with_pay")}
                          className="h-4 w-4 text-[#800080]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          With Pay
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={approvePayType === "without_pay"}
                          onChange={() => setApprovePayType("without_pay")}
                          className="h-4 w-4 text-[#800080]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Without Pay
                        </span>
                      </label>
                    </div>
                    {approvePayType === "without_pay" && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ No leave balance deduction for Without Pay approvals.
                      </p>
                    )}
                  </div>

                  {/* {selectedRequest.leave_type === "Sick Leave" && (
                    <div className="mt-2 border-t pt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={approveMedCert}
                          onChange={(e) => setApproveMedCert(e.target.checked)}
                          className="h-4 w-4 rounded text-[#800080]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          With Medical Certificate
                        </span>
                      </label>
                      {approveMedCert && (
                        <p className="mt-1 text-xs text-[#800080]">
                          Employee must submit a medical certificate for this
                          sick leave.
                        </p>
                      )}
                    </div>
                  )} */}

                  {/* Show existing medical certificate attachment */}
                  {selectedRequest.leave_type === "Sick Leave" &&
                    hasMedicalCertificate(selectedRequest) && (
                      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-xs text-green-700">
                              Medical Certificate attached
                            </span>
                          </div>
                          <a
                            href={getFileUrl(
                              selectedRequest.medical_certificate_url,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            View Attachment →
                          </a>
                        </div>
                      </div>
                    )}

                  <div className="mt-3 rounded-xl bg-[#faf5fb] p-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Leave Balance & Impact:
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>
                          Current {selectedRequest.leave_type} Balance:
                        </span>
                        <span className="font-bold text-[#800080]">
                          {getCurrentBalance()} days
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Days After Adjustment:</span>
                        <span
                          className={`font-bold ${hasSufficientBalance() ? "text-green-600" : "text-red-600"}`}
                        >
                          {getAdjustedDays()} days
                        </span>
                      </div>
                      {approvePayType === "with_pay" && (
                        <div className="flex justify-between text-sm">
                          <span>Remaining After Approval:</span>
                          <span className="font-bold text-blue-600">
                            {getCurrentBalance() - getAdjustedDays()} days
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {approvePayType === "with_pay" && !hasSufficientBalance() && (
                    <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <strong>⚠️ Insufficient Balance!</strong>
                      <br />
                      Employee only has {getCurrentBalance()} days available.{" "}
                      {getAdjustedDays()} days requested.
                      <br />
                      <span className="text-xs">
                        Consider approving as "Without Pay" instead.
                      </span>
                    </div>
                  )}

                  {approvePayType === "with_pay" && hasSufficientBalance() && (
                    <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
                      <strong>✓ Sufficient Balance</strong>
                      <br />
                      After approval, {getAdjustedDays()} days will be deducted.{" "}
                      Remaining balance will be{" "}
                      {getCurrentBalance() - getAdjustedDays()} days.
                    </div>
                  )}

                  {approvePayType === "without_pay" && (
                    <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <strong>✓ Without Pay Approval</strong>
                      <br />
                      No leave balance will be deducted. Employee will not
                      receive salary for these days.
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Approval Notes{" "}
                      <span className="text-xs text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows="3"
                      className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                      placeholder="Add notes about this approval (these will be visible to the employee)..."
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      These notes will be displayed to the employee when they
                      view their leave request.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={resetApproveModal}
                    className="flex-1 rounded-lg border border-[#e6cce6] px-4 py-2 text-gray-700 transition hover:bg-[#faf5fb]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    className={`flex-1 rounded-lg px-4 py-2 text-white ${
                      approvePayType === "with_pay" && !hasSufficientBalance()
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-[#800080] hover:bg-[#660066]"
                    }`}
                  >
                    Approve
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Request Modal - Admin can edit any request */}
      {showEditModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#e6cce6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {selectedRequest.status !== "pending"
                  ? "Admin Override: Edit Leave Request"
                  : "Edit Leave Request"}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 transition hover:text-[#800080]"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Warning for approved/rejected requests */}
            {selectedRequest.status !== "pending" && (
              <div className="mb-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500 p-3">
                <div className="flex items-start gap-2">
                  <XCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Admin Override Mode
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This leave request has already been{" "}
                      {selectedRequest.status}. Editing will add an audit note
                      and may affect leave balances.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Leave Type
                </label>
                <select
                  value={editFormData.leave_type}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      leave_type: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                >
                  <option value="Vacation Leave">Vacation Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Special Leave">Special Leave</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.start_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.end_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        end_date: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  value={editFormData.reason}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, reason: e.target.value })
                  }
                  rows="3"
                  className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                  placeholder="Reason for leave..."
                />
              </div>

              {/* Pay Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pay Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={editFormData.leave_pay_type === "with_pay"}
                      onChange={() =>
                        setEditFormData({
                          ...editFormData,
                          leave_pay_type: "with_pay",
                        })
                      }
                      className="h-4 w-4 text-[#800080]"
                    />
                    <span className="ml-2 text-sm text-gray-700">With Pay</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={editFormData.leave_pay_type === "without_pay"}
                      onChange={() =>
                        setEditFormData({
                          ...editFormData,
                          leave_pay_type: "without_pay",
                        })
                      }
                      className="h-4 w-4 text-[#800080]"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Without Pay
                    </span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                {selectedRequest.status !== "pending" &&
                  editFormData.status === "pending" && (
                    <p className="mt-1 text-xs text-amber-600">
                      Setting back to pending will clear approval fields and
                      allow employee to edit.
                    </p>
                  )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Admin Notes{" "}
                  <span className="text-xs text-gray-400">
                    (will be added to audit trail)
                  </span>
                </label>
                <textarea
                  value={editFormData.admin_note}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      admin_note: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full rounded-lg border border-[#e6cce6] px-3 py-2 focus:border-[#800080] focus:outline-none focus:ring-2 focus:ring-[#800080]/20"
                  placeholder="Note why you're editing this request..."
                />
              </div>

              {/* Leave Balance Impact Preview */}
              {editFormData.leave_pay_type === "with_pay" &&
                editFormData.status === "approved" && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-800">
                      Balance Impact:
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {calculateDays(
                        editFormData.start_date,
                        editFormData.end_date,
                      )}{" "}
                      days will be deducted from {editFormData.leave_type}{" "}
                      balance.
                    </p>
                  </div>
                )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-lg border border-[#e6cce6] px-4 py-2 text-gray-700 transition hover:bg-[#faf5fb]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-lg bg-[#800080] px-4 py-2 text-white transition hover:bg-[#660066]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestsAdmin;
