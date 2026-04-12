import { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '../../api/config';

const EditLeaveRequestModal = ({ isOpen, onClose, onSuccess, leaveRequest }) => {
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    medical_certificate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Function to format ISO date to YYYY-MM-DD for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Create a date object and adjust for timezone
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Get local date components to avoid timezone shift
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen && leaveRequest) {
      setFormData({
        leave_type: leaveRequest.leave_type || '',
        start_date: formatDateForInput(leaveRequest.start_date),
        end_date: formatDateForInput(leaveRequest.end_date),
        reason: leaveRequest.reason || '',
        medical_certificate: leaveRequest.medical_certificate || false
      });
      fetchLeaveBalances();
    }
  }, [isOpen, leaveRequest]);

  const fetchLeaveBalances = async () => {
    setFetchingBalance(true);
    setBalanceError('');
    try {
      const response = await api.get('/leave/balances');
      setLeaveBalances(response.data);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      setBalanceError('Unable to fetch leave balance');
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (name === 'leave_type') {
      setError('');
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getCurrentBalance = () => {
    if (!leaveBalances) return 0;
    switch(formData.leave_type) {
      case 'Vacation Leave':
        return leaveBalances.vacation_leave || 0;
      case 'Sick Leave':
        return leaveBalances.sick_leave || 0;
      case 'Emergency Leave':
        return leaveBalances.emergency_leave || 0;
      case 'Special Leave':
        return leaveBalances.special_leave || 0;
      default:
        return 0;
    }
  };

  const hasSufficientBalance = () => {
    if (!formData.leave_type) return true;
    const currentBalance = getCurrentBalance();
    const daysRequested = calculateDays();
    return currentBalance >= daysRequested;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = {
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      medical_certificate: formData.medical_certificate,
      leave_pay_type: 'pending'
    };
    
    try {
      await api.put(`/leave/requests/${leaveRequest.id}/edit`, submitData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const daysRequested = calculateDays();
  const currentBalance = getCurrentBalance();
  const sufficientBalance = hasSufficientBalance();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Edit Leave Request</h2>
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

          {balanceError && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
              {balanceError}
            </div>
          )}

          <div className="space-y-4">
            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                name="leave_type"
                value={formData.leave_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select leave type</option>
                <option value="Vacation Leave">Vacation Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
                <option value="Special Leave">Special Leave</option>
              </select>
            </div>

            {/* Medical Certificate Option */}
            {formData.leave_type === 'Sick Leave' && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="medical_certificate"
                    checked={formData.medical_certificate}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I will provide a medical certificate
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Medical certificate may be required for sick leave approval.
                </p>
              </div>
            )}

            {/* Leave Balance Display */}
            {fetchingBalance ? (
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-500">Loading balance...</span>
              </div>
            ) : leaveBalances && formData.leave_type && (
              <div className={`rounded-lg p-3 ${sufficientBalance ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className={`h-5 w-5 mt-0.5 ${sufficientBalance ? 'text-blue-500' : 'text-yellow-500'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${sufficientBalance ? 'text-blue-800' : 'text-yellow-800'}`}>
                      Current {formData.leave_type} Balance
                    </p>
                    <p className={`text-lg font-bold ${sufficientBalance ? 'text-blue-600' : 'text-yellow-600'}`}>
                      {currentBalance} days
                    </p>
                    {formData.start_date && formData.end_date && (
                      <>
                        <p className={`text-sm mt-2 ${sufficientBalance ? 'text-blue-700' : 'text-yellow-700'}`}>
                          You are requesting: <strong>{daysRequested} days</strong>
                          {!sufficientBalance && (
                            <span className="block text-xs text-red-600 mt-1">
                              ⚠️ This exceeds your available balance! Admin may approve as "Without Pay".
                            </span>
                          )}
                          {sufficientBalance && (
                            <span className="block text-xs text-green-600 mt-1">
                              ✓ You have sufficient balance. Admin will decide pay type upon approval.
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Days Calculation */}
            {formData.start_date && formData.end_date && (
              <div className={`rounded-lg p-3 ${sufficientBalance ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${sufficientBalance ? 'text-blue-700' : 'text-yellow-700'}`}>
                    Total days requested:
                  </span>
                  <span className={`text-lg font-bold ${sufficientBalance ? 'text-blue-700' : 'text-yellow-700'}`}>
                    {daysRequested} day{daysRequested !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Please provide a reason for your leave request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason}
              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                loading || !formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Update Request'}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              ⚠️ <strong>Note:</strong> Your request will remain pending for approval after editing.
              {!sufficientBalance && formData.leave_type && formData.start_date && formData.end_date && (
                <span className="block text-yellow-600 mt-1">
                  Note: You have insufficient balance. Your request may be approved as WITHOUT PAY.
                </span>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeaveRequestModal;