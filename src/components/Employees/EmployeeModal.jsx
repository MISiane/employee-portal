import { useState, useEffect } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createEmployee, updateEmployee } from '../../api/employees';
import api from '../../api/config';

const EmployeeModal = ({ isOpen, onClose, employee, mode, departments }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    employee_code: '',
    department: '',
    position: '',
    phone: '',
    hire_date: '',
    date_of_birth: '',  // Added birth date field
    salary: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    sss_number: '',
    philhealth_number: '',
    pagibig_number: '',
    tin_number: '',
    employment_status: 'regular',
    regularization_date: '',
    probationary_end_date: '',
    role: 'employee'
  });
  
  const [leaveBalances, setLeaveBalances] = useState({
    vacation_leave: 15,
    sick_leave: 10,
    emergency_leave: 5,
    special_leave: 0,
    year: new Date().getFullYear()
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [updatingLeave, setUpdatingLeave] = useState(false);
  
  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [copied, setCopied] = useState(false);

useEffect(() => {
  if (employee && mode !== 'add') {
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      employee_code: employee.employee_code || '',
      department: employee.department || '',
      position: employee.position || '',
      phone: employee.phone || '',
      hire_date: employee.hire_date || '',
      date_of_birth: employee.date_of_birth || '',
      salary: employee.salary || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      sss_number: employee.sss_number || '',
      philhealth_number: employee.philhealth_number || '',
      pagibig_number: employee.pagibig_number || '',
      tin_number: employee.tin_number || '',
      employment_status: employee.employment_status || 'regular',
      regularization_date: employee.regularization_date || '',
      probationary_end_date: employee.probationary_end_date || '',
      role: employee.role || 'employee'
    });
    
    if (mode !== 'add') {
      fetchLeaveBalances(employee.id);
    }
  } else {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      employee_code: '',
      department: '',
      position: '',
      phone: '',
      hire_date: '',
      date_of_birth: '',
      salary: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      sss_number: '',
      philhealth_number: '',
      pagibig_number: '',
      tin_number: '',
      employment_status: 'regular',
      regularization_date: '',
      probationary_end_date: '',
      role: 'employee'
    });
  }
}, [employee, mode]);

  const fetchLeaveBalances = async (userId) => {
    try {
      const response = await api.get(`/leave/balances/${userId}`);
      setLeaveBalances(response.data);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaveBalanceChange = (e) => {
    const { name, value } = e.target;
    setLeaveBalances(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const updateLeaveBalances = async () => {
    if (!employee || mode === 'add') {
      alert('Please save the employee first before updating leave balances.');
      return;
    }
    
    setUpdatingLeave(true);
    try {
      await api.put(`/leave/balances/${employee.id}`, {
        ...leaveBalances,
        year: new Date().getFullYear()
      });
      alert('Leave balances updated successfully!');
    } catch (error) {
      console.error('Error updating leave balances:', error);
      alert('Error updating leave balances');
    } finally {
      setUpdatingLeave(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setCopied(false);
    setLoading(false);
    // Reset form data for next use
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      employee_code: '',
      department: '',
      position: '',
      phone: '',
      hire_date: '',
      date_of_birth: '',
      salary: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      sss_number: '',
      philhealth_number: '',
      pagibig_number: '',
      tin_number: '',
      employment_status: 'regular',
      regularization_date: '',
      probationary_end_date: '',
      role: 'employee'
    });
    onClose();
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Create a copy of formData
  const submitData = { ...formData };
  
  // Ensure date_of_birth is in correct format without timezone
  if (submitData.date_of_birth) {
    // The input type="date" gives YYYY-MM-DD
    // Keep it exactly as is
    submitData.date_of_birth = submitData.date_of_birth;
  }

  try {
    if (mode === 'add') {
      const response = await createEmployee(submitData);
      setLoading(false);
      setNewPassword(response.tempPassword);
      setNewEmployeeName(`${response.profile.first_name} ${response.profile.last_name}`);
      setNewEmployeeEmail(response.user.email);
      setShowPasswordModal(true);
    } else {
      await updateEmployee(employee.id, submitData);
      alert('Employee updated successfully!');
      setLoading(false);
      onClose();
    }
  } catch (err) {
    setError(err.response?.data?.error || 'An error occurred');
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <>
      {/* Main Employee Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'add' ? 'Add New Employee' : mode === 'edit' ? 'Edit Employee' : 'View Employee'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Simple tabs without icons to avoid import issues */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'personal' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Personal Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('employment')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'employment' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Employment
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'address' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ids')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'ids' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                IDs & Contact
              </button>
              {mode !== 'add' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('leave')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'leave' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Leave Balances
                </button>
              )}
            </div>

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
                  <input type="text" name="employee_code" value={formData.employee_code} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                  <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            )}

            {/* Employment Tab */}
            {activeTab === 'employment' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Department</option>
                    {departments && departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input type="text" name="position" value={formData.position} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
                  <select name="employment_status" value={formData.employment_status} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="probationary">Probationary</option>
                    <option value="regular">Regular</option>
                  </select>
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                  <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            )}

            {/* IDs & Contact Tab */}
            {activeTab === 'ids' && (
              <div className="space-y-6">
                {/* Emergency Contact */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                      <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} disabled={mode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Government IDs */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Government IDs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SSS Number</label>
                      <input type="text" name="sss_number" value={formData.sss_number} onChange={handleChange} disabled={mode === 'view'} placeholder="XX-XXXXXXX-X" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      <p className="text-xs text-gray-500 mt-1">Format: 12-3456789-0</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PhilHealth Number</label>
                      <input type="text" name="philhealth_number" value={formData.philhealth_number} onChange={handleChange} disabled={mode === 'view'} placeholder="XX-XXXXXXXXX-X" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      <p className="text-xs text-gray-500 mt-1">Format: 12-345678910-1</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pag-IBIG Number</label>
                      <input type="text" name="pagibig_number" value={formData.pagibig_number} onChange={handleChange} disabled={mode === 'view'} placeholder="XXXXXXXXXXXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      <p className="text-xs text-gray-500 mt-1">Format: 123456789012 (12 digits)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
                      <input type="text" name="tin_number" value={formData.tin_number} onChange={handleChange} disabled={mode === 'view'} placeholder="XXX-XXX-XXX-XXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      <p className="text-xs text-gray-500 mt-1">Format: 123-456-789-000</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Balances Tab */}
            {activeTab === 'leave' && mode !== 'add' && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800"><strong>Leave Balances for {leaveBalances.year}</strong></p>
                  <p className="text-xs text-blue-600 mt-1">These balances are automatically deducted when leave requests are approved.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vacation Leave (days)</label>
                    <input type="number" name="vacation_leave" value={leaveBalances.vacation_leave} onChange={handleLeaveBalanceChange} disabled={mode === 'view'} step="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sick Leave (days)</label>
                    <input type="number" name="sick_leave" value={leaveBalances.sick_leave} onChange={handleLeaveBalanceChange} disabled={mode === 'view'} step="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Leave (days)</label>
                    <input type="number" name="emergency_leave" value={leaveBalances.emergency_leave} onChange={handleLeaveBalanceChange} disabled={mode === 'view'} step="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Leave (days)</label>
                    <input type="number" name="special_leave" value={leaveBalances.special_leave} onChange={handleLeaveBalanceChange} disabled={mode === 'view'} step="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input type="number" value={leaveBalances.year} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  </div>
                </div>
                {mode !== 'view' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={updateLeaveBalances} disabled={updatingLeave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      {updatingLeave ? 'Updating...' : 'Update Leave Balances'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode !== 'view' && (
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : mode === 'add' ? 'Create Employee' : 'Update Employee'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Password Display Modal (only shows after creating a new employee) */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Employee Account Created!</h3>
              <button
                onClick={handlePasswordModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                New employee account created for <strong>{newEmployeeName}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Email: <strong>{newEmployeeEmail}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Temporary password:
              </p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg mb-4 flex items-center justify-between">
              <code className="text-lg font-mono font-bold text-yellow-800 break-all">
                {newPassword}
              </code>
              <button
                onClick={handleCopyPassword}
                className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition ml-2 flex-shrink-0"
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Important:</strong> Please save this password now and provide it to the employee. 
                This is the only time it will be displayed. The employee will be prompted to change it on first login.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCopyPassword}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                Copy Password
              </button>
              <button
                onClick={handlePasswordModalClose}
                className="flex-1 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#660066] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeModal;