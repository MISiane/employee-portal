import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { getEmployees, deleteEmployee, getDepartments, updateEmployee } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import EmployeeModal from '../components/Employees/EmployeeModal';
import DeleteConfirmModal from '../components/Employees/DeleteConfirmModal';
import ReactivateConfirmModal from '../components/Employees/ReactivateConfirmModal';
import { getDepartmentStyle } from '../utils/departments';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  // Sorting state
  const [sortField, setSortField] = useState('employee_code'); // Default sort by employee code
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalMode, setModalMode] = useState('add');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [currentPage, selectedDepartment, selectedStatus, sortField, sortDirection, isAdmin]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sort: sortField,
        order: sortDirection,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      };
      const data = await getEmployees(params);
      setEmployees(data.employees);
      setTotalPages(data.pagination.totalPages);
      setTotalEmployees(data.pagination.total);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 ml-1 inline text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 ml-1 inline text-purple-600" />
      : <ArrowDownIcon className="h-4 w-4 ml-1 inline text-purple-600" />;
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      fetchEmployees();
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleReactivate = (employee) => {
    setSelectedEmployee(employee);
    setShowReactivateModal(true);
  };

  const confirmReactivate = async () => {
    if (!selectedEmployee) return;
    try {
      await updateEmployee(selectedEmployee.id, { is_active: true });
      alert('Employee reactivated successfully!');
      fetchEmployees();
      setShowReactivateModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error reactivating employee:', error);
      alert('Error reactivating employee');
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setShowEmployeeModal(true);
  };

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setModalMode('view');
    setShowEmployeeModal(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setModalMode('add');
    setShowEmployeeModal(true);
  };

  const handleModalClose = () => {
    setShowEmployeeModal(false);
    setSelectedEmployee(null);
    fetchEmployees();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedDepartment || selectedStatus;

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        Inactive
      </span>
    );
  };

  // Function to check for duplicate employee codes
  const checkForDuplicates = () => {
    const codes = employees.map(emp => emp.employee_code).filter(code => code);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicates.length > 0) {
      console.warn('Duplicate employee codes found:', [...new Set(duplicates)]);
      return duplicates;
    }
    return [];
  };

  // Check for duplicates on load
  useEffect(() => {
    if (employees.length > 0) {
      const duplicates = checkForDuplicates();
      if (duplicates.length > 0) {
        console.warn(`Found ${duplicates.length} duplicate employee codes`);
      }
    }
  }, [employees]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <UserCircleIcon className="h-16 w-16 text-purple-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 rounded-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#800080] p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-purple-100 mt-1">Manage your team members</p>
          {hasActiveFilters && (
            <p className="text-purple-200 text-sm mt-2">
              Filtered: {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-white text-[#800080] rounded-xl font-medium hover:bg-[#f5e6f7] transition"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl transition-colors ${
              showFilters 
  ? 'bg-[#800080] text-white border-[#800080]' 
  : 'border-[#e6cce6] hover:bg-[#f5e6f7]'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-[#800080] text-white rounded-xl hover:bg-[#660066] transition"
          >
            Search
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

     {/* Table - Responsive with horizontal scroll on mobile */}
<div className="bg-white border border-purple-100 rounded-2xl shadow-sm overflow-hidden">
  {/* Mobile view - Card layout for small screens (optional alternative) */}
  <div className="block md:hidden divide-y divide-gray-200">
    {loading ? (
      <div className="p-6 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
        <p className="mt-2 text-gray-500">Loading employees...</p>
      </div>
    ) : employees.length === 0 ? (
      <div className="p-6 text-center text-gray-400">
        <UserCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No employees found</p>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="mt-2 text-purple-600 hover:text-purple-700 text-sm">
            Clear filters to see all employees
          </button>
        )}
      </div>
    ) : (
      employees.map((emp) => (
        <div key={emp.id} className="p-4 hover:bg-purple-50 transition-colors">
          {/* Employee Info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow ring-2 ring-purple-200">
                {emp.first_name?.[0]}{emp.last_name?.[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {emp.first_name} {emp.last_name}
                </p>
                <p className="text-xs text-gray-500">{emp.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleView(emp)} 
                className="p-1.5 text-purple-600 hover:text-purple-800 transition rounded-lg hover:bg-purple-50"
                title="View"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleEdit(emp)} 
                className="p-1.5 text-indigo-600 hover:text-indigo-800 transition rounded-lg hover:bg-indigo-50"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              {emp.is_active ? (
                <button 
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setShowDeleteModal(true);
                  }} 
                  className="p-1.5 text-rose-500 hover:text-rose-700 transition rounded-lg hover:bg-rose-50"
                  title="Deactivate"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={() => handleReactivate(emp)} 
                  className="p-1.5 text-green-600 hover:text-green-800 transition rounded-lg hover:bg-green-50"
                  title="Reactivate"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Employee Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Employee Code</p>
              <p className="font-medium text-gray-800">{emp.employee_code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              {emp.department ? (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getDepartmentStyle(emp.department).color}`}>
                  {emp.department}
                </span>
              ) : (
                <p className="font-medium text-gray-800">-</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Position</p>
              <p className="font-medium text-gray-800">{emp.position || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              {getStatusBadge(emp.is_active)}
            </div>
          </div>
        </div>
      ))
    )}
  </div>

  {/* Desktop view - Table for larger screens */}
  <div className="hidden md:block overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-purple-50">
        <tr>
          <th 
            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-purple-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition whitespace-nowrap"
            onClick={() => handleSort('first_name')}
          >
            Employee {getSortIcon('first_name')}
          </th>
          <th 
            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-purple-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition whitespace-nowrap"
            onClick={() => handleSort('employee_code')}
          >
            Code {getSortIcon('employee_code')}
          </th>
          <th 
            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-purple-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition whitespace-nowrap"
            onClick={() => handleSort('department')}
          >
            Department {getSortIcon('department')}
          </th>
          <th 
            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-purple-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition whitespace-nowrap"
            onClick={() => handleSort('position')}
          >
            Position {getSortIcon('position')}
          </th>
          <th 
            className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-purple-500 uppercase tracking-wider cursor-pointer hover:bg-purple-100 transition whitespace-nowrap"
            onClick={() => handleSort('is_active')}
          >
            Status {getSortIcon('is_active')}
          </th>
          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-purple-500 uppercase tracking-wider whitespace-nowrap">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan="6" className="px-6 py-8 text-center">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
              <p className="mt-2 text-gray-500">Loading employees...</p>
            </td>
          </tr>
        ) : employees.length === 0 ? (
          <tr>
            <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
              <UserCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No employees found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-purple-600 hover:text-purple-700 text-sm">
                  Clear filters to see all employees
                </button>
              )}
            </td>
          </tr>
        ) : (
          employees.map(emp => (
            <tr key={emp.id} className="hover:bg-purple-50 transition">
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow ring-2 ring-purple-200">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px] lg:max-w-none">
                      {emp.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {emp.employee_code || '-'}
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                {emp.department ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentStyle(emp.department).color}`}>
                    {emp.department}
                  </span>
                ) : '-'}
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {emp.position || '-'}
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                {getStatusBadge(emp.is_active)}
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right space-x-1 lg:space-x-2">
                <button 
                  onClick={() => handleView(emp)} 
                  className="p-1.5 lg:p-2 text-purple-600 hover:text-purple-800 transition rounded-lg hover:bg-purple-50"
                  title="View"
                >
                  <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
                <button 
                  onClick={() => handleEdit(emp)} 
                  className="p-1.5 lg:p-2 text-indigo-600 hover:text-indigo-800 transition rounded-lg hover:bg-indigo-50"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
                
                {emp.is_active ? (
                  <button 
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowDeleteModal(true);
                    }} 
                    className="p-1.5 lg:p-2 text-rose-500 hover:text-rose-700 transition rounded-lg hover:bg-rose-50"
                    title="Deactivate"
                  >
                    <TrashIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReactivate(emp)} 
                    className="p-1.5 lg:p-2 text-green-600 hover:text-green-800 transition rounded-lg hover:bg-green-50"
                    title="Reactivate"
                  >
                    <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination - Responsive */}
  {totalPages > 1 && (
    <div className="px-4 lg:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
        Showing page {currentPage} of {totalPages} ({totalEmployees} total employees)
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-sm"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-sm hidden sm:inline-block">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )}
</div>

      {/* Modals */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={handleModalClose}
        employee={selectedEmployee}
        mode={modalMode}
        departments={departments}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleDelete}
        employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
      />

      <ReactivateConfirmModal
        isOpen={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false);
          setSelectedEmployee(null);
        }}
        onConfirm={confirmReactivate}
        employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
      />
    </div>
  );
};

export default Employees;