import { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '../../api/config';

const LeaveRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    leave_pay_type: 'with_pay',
    medical_certificate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const [isProbationary, setIsProbationary] = useState(false);
  const [probationaryMessage, setProbationaryMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLeaveBalances();
    }
  }, [isOpen]);

  const fetchLeaveBalances = async () => {
    setFetchingBalance(true);
    setBalanceError('');
    try {
      const response = await api.get('/leave/balances');
      setLeaveBalances(response.data);
      
      // Check if balances are zero to determine probationary status
      if (response.data && 
          response.data.vacation_leave === 0 && 
          response.data.sick_leave === 0 && 
          response.data.emergency_leave === 0) {
        setIsProbationary(true);
        setProbationaryMessage('You appear to be on probationary status with zero leave balances.');
        setFormData(prev => ({ ...prev, leave_pay_type: 'without_pay' }));
      } else {
        setIsProbationary(false);
        setProbationaryMessage('');
      }
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

  const getRemainingAfterRequest = () => {
    const currentBalance = getCurrentBalance();
    const daysRequested = calculateDays();
    return currentBalance - daysRequested;
  };

  const hasSufficientBalance = () => {
    if (!formData.leave_type) return true;
    const currentBalance = getCurrentBalance();
    const daysRequested = calculateDays();
    return currentBalance >= daysRequested;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Only check balance for regular employees with "with pay" option
  // Probationary employees automatically get without pay and don't need balance check
  if (!isProbationary && formData.leave_pay_type === 'with_pay' && !hasSufficientBalance()) {
    setError(`Insufficient balance. You only have ${getCurrentBalance()} days available for ${formData.leave_type}.`);
    return;
  }
  
  setLoading(true);
  setError('');
  
  try {
    await api.post('/leave/requests', formData);
    onSuccess();
  } catch (err) {
    setError(err.response?.data?.error || 'Error submitting request. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  const daysRequested = calculateDays();
  const currentBalance = getCurrentBalance();
  const remainingBalance = getRemainingAfterRequest();
  const sufficientBalance = hasSufficientBalance();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">New Leave Request</h2>
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

          {/* Probationary Employee Notice */}
          {isProbationary && (
            <div className="mb-4 bg-yellow-50 border border-yellow-400 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Probationary Employee</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {probationaryMessage || 'As a probationary employee, your leave will be processed as WITHOUT PAY.'}
                  </p>
                </div>
              </div>
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

            {/* Pay Type Selection */}
            {formData.leave_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="leave_pay_type"
                      value="with_pay"
                      checked={formData.leave_pay_type === 'with_pay'}
                      onChange={handleChange}
                      disabled={isProbationary}
                      className="h-4 w-4 text-blue-600 disabled:opacity-50"
                    />
                    <span className={`ml-2 text-sm ${isProbationary ? 'text-gray-400' : 'text-gray-700'}`}>
                      With Pay
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="leave_pay_type"
                      value="without_pay"
                      checked={formData.leave_pay_type === 'without_pay'}
                      onChange={handleChange}
                      className="h-4 w-4 text-yellow-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Without Pay</span>
                  </label>
                </div>
                {isProbationary && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Probationary employees are automatically on leave without pay.
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Note:</strong> Leave days are deducted from your balance regardless of pay type. 
                  The difference is whether you receive salary during the leave period.
                </p>
              </div>
            )}

            {/* Medical Certificate Option */}
            {formData.leave_type === 'Sick Leave' && (
              <div className="border-t pt-3">
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

            {/* Leave Balance Display - Only show for regular employees */}
{!isProbationary && fetchingBalance ? (
  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
    <span className="text-sm text-gray-500">Loading balance...</span>
  </div>
) : !isProbationary && leaveBalances && formData.leave_type && (
  <div className={`rounded-lg p-3 ${sufficientBalance ? 'bg-blue-50' : 'bg-red-50'}`}>
    <div className="flex items-start space-x-2">
      <InformationCircleIcon className={`h-5 w-5 mt-0.5 ${sufficientBalance ? 'text-blue-500' : 'text-red-500'}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${sufficientBalance ? 'text-blue-800' : 'text-red-800'}`}>
          Current {formData.leave_type} Balance
        </p>
        <p className={`text-lg font-bold ${sufficientBalance ? 'text-blue-600' : 'text-red-600'}`}>
          {currentBalance} days
        </p>
        {formData.start_date && formData.end_date && (
          <>
            <p className={`text-sm mt-2 ${sufficientBalance ? 'text-blue-700' : 'text-red-700'}`}>
              After this request: <strong>{remainingBalance} days</strong>
              {remainingBalance < 0 && (
                <span className="block text-xs text-red-600 mt-1">
                  ⚠️ This will exceed your available balance!
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formData.leave_pay_type === 'with_pay' 
                ? '✓ You will receive salary during this leave period.' 
                : '⚠️ You will NOT receive salary during this leave period.'}
              Leave days are deducted from your balance in either case.
            </p>
          </>
        )}
      </div>
    </div>
  </div>
)}

{/* For probationary employees, show a different message */}
{isProbationary && (
  <div className="bg-green-50 rounded-lg p-3">
    <div className="flex items-start space-x-2">
      <InformationCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800">Probationary Employee</p>
        <p className="text-xs text-green-700 mt-1">
          As a probationary employee, you can apply for leave even with zero balance.
          Your leave will be processed as <strong>WITHOUT PAY</strong>.
        </p>
        {formData.start_date && formData.end_date && (
          <p className="text-xs text-green-600 mt-2">
            You are requesting {daysRequested} day{daysRequested !== 1 ? 's' : ''} of leave.
            This will be recorded as <strong>Without Pay</strong>.
          </p>
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
                  min={new Date().toISOString().split('T')[0]}
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
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Days Calculation */}
            {formData.start_date && formData.end_date && (
              <div className={`rounded-lg p-3 ${sufficientBalance ? 'bg-blue-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${sufficientBalance ? 'text-blue-700' : 'text-red-700'}`}>
                    Total days requested:
                  </span>
                  <span className={`text-lg font-bold ${sufficientBalance ? 'text-blue-700' : 'text-red-700'}`}>
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

          {/* Warning if insufficient balance */}
          {formData.leave_type && formData.start_date && formData.end_date && !sufficientBalance && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">⚠️ Insufficient Leave Balance</p>
              <p className="text-sm mt-1">
                You have {currentBalance} days available, but you're requesting {daysRequested} days.
                Please adjust your request.
              </p>
            </div>
          )}

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
  disabled={loading || (!isProbationary && formData.leave_pay_type === 'with_pay' && formData.leave_type && formData.start_date && formData.end_date && !sufficientBalance)}
  className={`flex-1 px-4 py-2 rounded-lg text-white ${
    loading || (!isProbationary && formData.leave_pay_type === 'with_pay' && formData.leave_type && formData.start_date && formData.end_date && !sufficientBalance)
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700'
  }`}
>
  {loading ? 'Submitting...' : 'Submit Request'}
</button>
          </div>

          {/* Info Note */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Leave requests require approval. You will be notified once your request is processed.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal;