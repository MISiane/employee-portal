import { useState, useEffect } from 'react';
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
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getPayslips, deletePayslip } from '../api/payslips';
import { getEmployees } from '../api/employees';
import CreatePayslipModal from '../components/Payslips/CreatePayslipModal';
import BulkUploadModal from '../components/Payslips/BulkUploadModal';
import ViewPayslipModal from '../components/Payslips/ViewPayslipModal';
import EditPayslipModal from '../components/Payslips/EditPayslipModal';

const AdminPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Sorting states
  const [sortField, setSortField] = useState('pay_period_start');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, selectedEmployee, selectedStatus, currentPage, sortField, sortDirection, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        sort: sortField,
        order: sortDirection
      };
      
      if (selectedYear && selectedYear !== '') params.year = selectedYear;
      if (selectedMonth && selectedMonth !== '') params.month = selectedMonth;
      if (selectedEmployee && selectedEmployee !== '') params.user_id = selectedEmployee;
      if (selectedStatus && selectedStatus !== '') params.status = selectedStatus;
      if (searchTerm && searchTerm !== '') params.search = searchTerm;
      
      const [payslipsData, employeesData] = await Promise.all([
        getPayslips(params),
        getEmployees({ limit: 100 })
      ]);
      
      setPayslips(payslipsData.payslips || []);
      setPagination(payslipsData.pagination);
      setEmployees(employeesData.employees || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payslip?')) {
      try {
        await deletePayslip(id);
        alert('Payslip deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting payslip:', error);
        alert('Error deleting payslip: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleView = (payslip) => {
    setSelectedPayslip(payslip);
    setShowViewModal(true);
  };

  const handleEdit = (payslip) => {
    setSelectedPayslip(payslip);
    setShowEditModal(true);
  };

  const handleEditFromView = (payslip) => {
    setShowViewModal(false);
    setSelectedPayslip(payslip);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPayslip(null);
    alert('Payslip updated successfully!');
    fetchData();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    alert('Payslip created successfully!');
    fetchData();
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleBulkUploadSuccess = (result) => {
    setShowBulkUploadModal(false);
    if (result.results.success.length > 0) {
      alert(`Successfully created ${result.results.success.length} payslips!`);
      setSelectedYear('');
      setSelectedMonth('');
      setSelectedEmployee('');
      setSelectedStatus('');
      setSearchTerm('');
      setCurrentPage(1);
      fetchData();
    } else if (result.results.failed.length > 0) {
      alert(`Upload completed but ${result.results.failed.length} records failed. Check console for details.`);
      console.log('Failed records:', result.results.failed);
    }
  };

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedEmployee('');
    setSelectedStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 ml-1 inline text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 ml-1 inline text-blue-600" />
      : <ArrowDownIcon className="h-4 w-4 ml-1 inline text-blue-600" />;
  };

  const years = ['', ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)];
  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const statuses = [
    { value: '', label: 'All Status' },
    { value: 'generated', label: 'Generated' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' }
  ];

  const hasActiveFilters = selectedYear || selectedMonth || selectedEmployee || selectedStatus || searchTerm;

  // Filtered employees for search
  const filteredEmployees = employees.filter(emp => 
    emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Payslip Management</h1>
          <p className="text-blue-100 mt-1">Generate and manage employee payslips</p>
          {hasActiveFilters && (
            <p className="text-blue-200 text-sm mt-2">
              Showing {payslips.length} of {pagination.total} payslips
            </p>
          )}
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {Object.values({selectedYear, selectedMonth, selectedEmployee, selectedStatus}).filter(Boolean).length}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map(year => (
                    <option key={year || 'all'} value={year}>{year || 'All Years'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
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
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Payslips</p>
              <p className="text-2xl font-bold text-blue-700">{pagination.total}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Current Page</p>
              <p className="text-2xl font-bold text-green-700">{currentPage} / {pagination.totalPages}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Showing</p>
              <p className="text-2xl font-bold text-purple-700">{payslips.length} records</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Total Net Salary</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0))}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Mobile view - Card layout */}
        <div className="block md:hidden divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="mt-2 text-gray-500">Loading payslips...</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No payslips found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                  Clear filters to see all payslips
                </button>
              )}
            </div>
          ) : (
            payslips.map((payslip) => (
              <div key={payslip.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {payslip.first_name?.charAt(0)}{payslip.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payslip.first_name} {payslip.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{payslip.employee_code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payslip.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payslip.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payslip.status?.toUpperCase() || 'GENERATED'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Period</p>
                    <p className="font-medium text-gray-800 text-sm">
                      {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pay Date</p>
                    <p className="font-medium text-gray-800 text-sm">
                      {formatDate(payslip.pay_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gross Salary</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {formatCurrency(payslip.gross_salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Salary</p>
                    <p className="font-semibold text-green-600 text-sm">
                      {formatCurrency(payslip.net_salary)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleView(payslip)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                    title="View Payslip"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(payslip)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                    title="Edit Payslip"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(payslip.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                    title="Delete Payslip"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop view - Table with sorting */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => handleSort('first_name')}
                >
                  Employee {getSortIcon('first_name')}
                </th>
                <th 
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => handleSort('pay_period_start')}
                >
                  Period {getSortIcon('pay_period_start')}
                </th>
                <th 
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => handleSort('pay_date')}
                >
                  Pay Date {getSortIcon('pay_date')}
                </th>
                <th 
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => handleSort('gross_salary')}
                >
                  Gross Salary {getSortIcon('gross_salary')}
                </th>
                <th 
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => handleSort('net_salary')}
                >
                  Net Salary {getSortIcon('net_salary')}
                </th>
                <th 
                  className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Loading payslips...</p>
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No payslips found</p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="mt-2 text-blue-600 hover:text-blue-700">
                        Clear filters to see all payslips
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {payslip.first_name?.charAt(0)}{payslip.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {payslip.first_name} {payslip.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[100px] lg:max-w-none">
                            {payslip.employee_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatShortDate(payslip.pay_period_start)} - {formatShortDate(payslip.pay_period_end)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatShortDate(payslip.pay_date)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(payslip.gross_salary)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(payslip.net_salary)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payslip.status === 'paid' ? 'bg-green-100 text-green-800' :
                        payslip.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payslip.status?.toUpperCase() || 'GENERATED'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleView(payslip)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition mx-0.5"
                        title="View Payslip"
                      >
                        <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(payslip)}
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition mx-0.5"
                        title="Edit Payslip"
                      >
                        <PencilIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(payslip.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition mx-0.5"
                        title="Delete Payslip"
                      >
                        <TrashIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 lg:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing page {currentPage} of {pagination.totalPages} ({pagination.total} total payslips)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm hidden sm:inline-block">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePayslipModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        employees={employees}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={handleBulkUploadSuccess}
      />

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

export default AdminPayslips;