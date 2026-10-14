import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  getPayslips,
  deletePayslip,
  deletePayslipsByPeriod,
} from "../api/payslips";
import { getEmployees } from "../api/employees";
import CreatePayslipModal from "../components/Payslips/CreatePayslipModal";
import BulkUploadModal from "../components/Payslips/BulkUploadModal";
import ViewPayslipModal from "../components/Payslips/ViewPayslipModal";
import EditPayslipModal from "../components/Payslips/EditPayslipModal";

// Helper component for Cutoff Detail View
const CutoffDetailView = ({ startDate, endDate, onBack, employees }) => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const fetchCutoffPayslips = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 25,
        period_start: startDate,
        period_end: endDate,
      };

      // Add filters
      if (searchTerm && searchTerm !== "") params.search = searchTerm;
      if (selectedEmployee && selectedEmployee !== "")
        params.user_id = selectedEmployee;
      if (selectedStatus && selectedStatus !== "")
        params.status = selectedStatus;

      const data = await getPayslips(params);
      setPayslips(data.payslips || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching cutoff payslips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCutoffPayslips();
  }, [
    currentPage,
    startDate,
    endDate,
    searchTerm,
    selectedEmployee,
    selectedStatus,
  ]);

  const handleView = (payslip) => {
    setSelectedPayslip(payslip);
    setShowViewModal(true);
  };

  const handleEdit = (payslip) => {
    setSelectedPayslip(payslip);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payslip?")) {
      try {
        await deletePayslip(id);
        fetchCutoffPayslips();
      } catch (error) {
        console.error("Error deleting payslip:", error);
        alert("Error deleting payslip");
      }
    }
  };

  const handleEditFromView = (payslip) => {
    setShowViewModal(false);
    setSelectedPayslip(payslip);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPayslip(null);
    fetchCutoffPayslips();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedEmployee || selectedStatus;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    if (dateString.includes("T")) {
      const [year, month, day] = dateString.split("T")[0].split("-");
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split("-");
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          icon: ClockIcon,
          label: "DRAFT",
        };
      case "approved":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          icon: CheckCircleIcon,
          label: "APPROVED",
        };
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          icon: XCircleIcon,
          label: "REJECTED",
        };
      default:
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          icon: ClockIcon,
          label: "GENERATED",
        };
    }
  };

  const totalNet = payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0);

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to all cutoffs
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-2xl text-white shadow-md">
        <h2 className="text-xl font-bold">
          📅 {formatDate(startDate)} - {formatDate(endDate)}
        </h2>
        <div className="flex flex-wrap gap-4 mt-2">
          <p className="text-blue-100">{pagination.total} payslip/s</p>
          {hasActiveFilters && (
            <p className="text-blue-200 text-sm">
              Filtered: {payslips.length} of {pagination.total}
            </p>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {
                  [searchTerm, selectedEmployee, selectedStatus].filter(Boolean)
                    .length
                }
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <XMarkIcon className="h-5 w-5" />
              Clear All
            </button>
          )}
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table (same as before) */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Mobile view */}
        <div className="block md:hidden divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : payslips.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No payslips found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear filters to see all payslips
                </button>
              )}
            </div>
          ) : (
            payslips.map((payslip) => {
              const statusBadge = getStatusBadge(payslip.status);
              const StatusIcon = statusBadge.icon;
              return (
                <div key={payslip.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {payslip.first_name?.charAt(0)}
                          {payslip.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {payslip.first_name} {payslip.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payslip.employee_code}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Net Salary</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(payslip.net_salary)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pay Date</p>
                      <p className="text-gray-600">
                        {formatDate(payslip.pay_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleView(payslip)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(payslip)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(payslip.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pay Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gross
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Net
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No payslips found</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Clear filters to see all payslips
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                payslips.map((payslip) => {
                  const statusBadge = getStatusBadge(payslip.status);
                  const StatusIcon = statusBadge.icon;
                  return (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {payslip.first_name?.charAt(0)}
                              {payslip.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {payslip.first_name} {payslip.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payslip.employee_code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(payslip.pay_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCurrency(payslip.gross_salary)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(payslip.net_salary)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleView(payslip)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg mx-0.5"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(payslip)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded-lg mx-0.5"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payslip.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg mx-0.5"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewPayslipModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        payslip={selectedPayslip}
        onEdit={handleEditFromView}
      />
      <EditPayslipModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPayslip(null);
        }}
        onSuccess={handleEditSuccess}
        payslip={selectedPayslip}
      />
    </div>
  );
};

// Main AdminPayslips Component
const AdminPayslips = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodStart = searchParams.get("period_start");
  const periodEnd = searchParams.get("period_end");

  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [sortField, setSortField] = useState("pay_period_start");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [deleteMenuPeriod, setDeleteMenuPeriod] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFilter, setDeleteFilter] = useState("all");
  const [deleting, setDeleting] = useState(false);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL payslips that match the filter criteria (no pagination for grouping)
      const params = {
        limit: 1000, // Get enough to group properly
        sort: sortField,
        order: sortDirection,
      };

      if (selectedYear && selectedYear !== "") params.year = selectedYear;
      if (selectedDepartment && selectedDepartment !== "")
        params.department = selectedDepartment;

      // For status filter - we need to find periods that contain this status
      // We fetch all and then filter periods client-side
      if (selectedStatus && selectedStatus !== "") {
        params.status = selectedStatus;
      }

      const [payslipsData, employeesData] = await Promise.all([
        getPayslips(params),
        getEmployees({ limit: 100 }),
      ]);

      let filteredPayslips = payslipsData.payslips || [];

      // If status filter is applied, we already filtered at API level
      setPayslips(filteredPayslips);
      setPagination({
        total: filteredPayslips.length,
        totalPages: 1,
        page: 1,
        limit: filteredPayslips.length,
      });
      setEmployees(employeesData.employees || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const params = { status: "draft", limit: 1 };
      const data = await getPayslips(params);
      setPendingCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPendingCount();
  }, [
    selectedYear,
    selectedMonth,
    selectedEmployee,
    selectedStatus,
    selectedDepartment,
    currentPage,
    sortField,
    sortDirection,
    searchTerm,
  ]);

  const convertToLocalDate = (isoDate) => {
    if (!isoDate) return "";
    // If it's already in YYYY-MM-DD format
    if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return isoDate;
    }
    // Convert ISO string to local date
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const groupPayslipsByPeriod = (payslips) => {
    const groups = {};
    payslips.forEach((payslip) => {
      // Convert ISO date to local YYYY-MM-DD
      const startDate = convertToLocalDate(payslip.pay_period_start);
      const endDate = convertToLocalDate(payslip.pay_period_end);

      const key = `${startDate}|${endDate}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          startDate: startDate,
          endDate: endDate,
          payslips: [],
          totalNet: 0,
          statusCounts: {
            draft: 0,
            approved: 0,
            paid: 0,
            sent: 0,
            rejected: 0,
          },
        };
      }
      groups[key].payslips.push(payslip);
      groups[key].totalNet += payslip.net_salary || 0;
      const status = payslip.status || "draft";
      groups[key].statusCounts[status] =
        (groups[key].statusCounts[status] || 0) + 1;
    });
    return Object.values(groups).sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
  };

  const formatDateForUrl = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const getUniqueDepartments = () => {
    const departments = employees.map((emp) => emp.department).filter(Boolean);
    return ["", ...new Set(departments)].sort();
  };

  const clearFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedEmployee("");
    setSelectedStatus("");
    setSelectedDepartment("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedYear ||
    selectedMonth ||
    selectedEmployee ||
    selectedStatus ||
    searchTerm;

  const years = [
    "",
    ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
  ];
  const months = [
    { value: "", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const periods = groupPayslipsByPeriod(payslips);

  if (periodStart && periodEnd) {
    return (
      <CutoffDetailView
        startDate={periodStart}
        endDate={periodEnd}
        onBack={() => navigate("/payslips")}
        employees={employees}
      />
    );
  }

  // Open delete menu for a period
const handleDeleteClick = (period, e) => {
  e.stopPropagation(); // Prevent navigation to detail view
  setDeleteMenuPeriod(period);
};

// Select filter and show confirmation
const handleDeleteOption = (filter) => {
  setDeleteFilter(filter);
  setShowDeleteConfirm(true);
};

// Close delete menu
const closeDeleteMenu = () => {
  setDeleteMenuPeriod(null);
  setShowDeleteConfirm(false);
  setDeleteFilter('all');
};

// Confirm and execute delete
const confirmDelete = async () => {
  if (!deleteMenuPeriod) return;
  
  setDeleting(true);
  try {
    const response = await deletePayslipsByPeriod(
      deleteMenuPeriod.startDate,
      deleteMenuPeriod.endDate,
      deleteFilter
    );
    
    if (response.success) {
      alert(`✅ ${response.message}`);
      closeDeleteMenu();
      await fetchData();
      await fetchPendingCount();
    } else {
      alert('❌ ' + response.message);
    }
  } catch (error) {
    console.error('Error deleting payslips:', error);
    alert('Error: ' + (error.response?.data?.error || error.message));
  } finally {
    setDeleting(false);
  }
};

// Calculate how many will be deleted based on filter
const getDeleteCount = (period, filter) => {
  if (!period) return 0;
  if (filter === 'all') return period.payslips.length;
  return period.statusCounts[filter] || 0;
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Payslip Management</h1>
          <p className="text-blue-100 mt-1">
            Manage and view payslips by cutoff period
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/pending-payslips")}
            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors shadow-sm relative"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Pending Review
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-sm"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Generate Payslip
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total Payslips</p>
          <p className="text-2xl font-bold text-blue-700">{pagination.total}</p>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium">Cutoff Periods</p>
          <p className="text-2xl font-bold text-gray-700">{periods.length}</p>
        </div>
      </div>

      {/* Simplified Filters for Period Cards */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {years.map(
                  (year) =>
                    year && (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ),
                )}
              </select>
            </div>

            {/* Department Filter - Filters periods that have payslips from this department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {getUniqueDepartments().map(
                  (dept) =>
                    dept && (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ),
                )}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Show periods with payslips from this department
              </p>
            </div>

            {/* Status Filter - Shows periods that have payslips with this status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Has Draft</option>
                <option value="approved">Has Approved</option>
                <option value="rejected">Has Rejected</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Show periods containing this status
              </p>
            </div>

            {/* Reset Button */}
            {(selectedYear || selectedDepartment || selectedStatus) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : periods.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">No payslips found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {periods.map((period) => {
  const statusBadges = [];
  if (period.statusCounts.draft > 0) statusBadges.push(`📄 Draft: ${period.statusCounts.draft}`);
  if (period.statusCounts.approved > 0) statusBadges.push(`✅ Approved: ${period.statusCounts.approved}`);
  if (period.statusCounts.rejected > 0) statusBadges.push(`❌ Rejected: ${period.statusCounts.rejected}`);

  return (
    <div
      key={period.id}
      onClick={() => navigate(`/payslips?period_start=${period.startDate}&period_end=${period.endDate}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative"
    >
      {/* Period Header */}
      <div className="text-center mb-3">
        <div className="text-lg font-bold text-gray-800">
          {formatDate(period.startDate)} - {formatDate(period.endDate)}
        </div>
        <div className="text-xs text-gray-400 mt-1">Pay Period</div>
      </div>

      {/* Stats */}
      <div className="flex justify-around border-t border-b border-gray-100 py-3 mb-3">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{period.payslips.length}</div>
          <div className="text-xs text-gray-500">Payslips</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(period.totalNet)}
          </div>
          <div className="text-xs text-gray-500">Total Net</div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="space-y-1 mb-3">
        {statusBadges.map((badge, idx) => (
          <div key={idx} className="text-xs text-gray-500 text-center">
            {badge}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/payslips?period_start=${period.startDate}&period_end=${period.endDate}`);
          }}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </button>

        {/* Delete Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => handleDeleteClick(period, e)}
            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
            <ChevronDownIcon className="h-3 w-3 ml-1" />
          </button>

          {/* Dropdown Menu */}
          {deleteMenuPeriod?.id === period.id && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  closeDeleteMenu();
                }}
              />
              
              <div 
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500">Delete payslips</p>
                </div>
                
                {/* All option */}
                <button
                  onClick={() => handleDeleteOption('all')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="font-medium">All</span>
                  <span className="text-xs text-gray-500">
                    {period.payslips.length} payslip(s)
                  </span>
                </button>

                {/* Approved option */}
                <button
                  onClick={() => handleDeleteOption('approved')}
                  disabled={!period.statusCounts.approved}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                    period.statusCounts.approved 
                      ? 'hover:bg-gray-50 text-gray-700' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    Approved only
                  </span>
                  <span className="text-xs text-gray-500">
                    {period.statusCounts.approved || 0}
                  </span>
                </button>

                {/* Rejected option */}
                <button
                  onClick={() => handleDeleteOption('rejected')}
                  disabled={!period.statusCounts.rejected}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                    period.statusCounts.rejected 
                      ? 'hover:bg-gray-50 text-gray-700' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                    Rejected only
                  </span>
                  <span className="text-xs text-gray-500">
                    {period.statusCounts.rejected || 0}
                  </span>
                </button>

                {/* Draft option (bonus) */}
                <button
                  onClick={() => handleDeleteOption('draft')}
                  disabled={!period.statusCounts.draft}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between border-t border-gray-100 ${
                    period.statusCounts.draft 
                      ? 'hover:bg-gray-50 text-gray-700' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-600" />
                    Draft only
                  </span>
                  <span className="text-xs text-gray-500">
                    {period.statusCounts.draft || 0}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
})}
        </div>
      )}

      {/* Pagination for main page */}
      {pagination.totalPages > 1 && !loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePayslipModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
        }}
        employees={employees}
      />
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          setShowBulkUploadModal(false);
          fetchData();
        }}
      />
      {/* Delete Confirmation Modal */}
{showDeleteConfirm && deleteMenuPeriod && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={closeDeleteMenu}
  >
    <div 
      className="bg-white rounded-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Confirm Delete</h3>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-600">
          You are about to delete{' '}
          <span className="font-bold text-red-600">
            {getDeleteCount(deleteMenuPeriod, deleteFilter)}{' '}
            {deleteFilter === 'all' ? '' : deleteFilter} payslip(s)
          </span>{' '}
          for the period:
        </p>
        <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg">
          📅 {formatDate(deleteMenuPeriod.startDate)} - {formatDate(deleteMenuPeriod.endDate)}
        </p>
        {deleteFilter === 'all' && deleteMenuPeriod.statusCounts.approved > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ Warning: {deleteMenuPeriod.statusCounts.approved} approved payslip(s) will also be deleted!
            </p>
          </div>
        )}
        <p className="text-xs text-gray-500">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={closeDeleteMenu}
          disabled={deleting}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={confirmDelete}
          disabled={deleting}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {deleting ? 'Deleting...' : `Delete ${deleteFilter === 'all' ? 'All' : deleteFilter}`}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminPayslips;
