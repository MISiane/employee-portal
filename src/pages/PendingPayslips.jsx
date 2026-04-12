import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserCircleIcon,
  BanknotesIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { getDraftPayslips, approvePayslip, approveAllPayslips, rejectPayslip } from '../api/payslips';
import ViewPayslipModal from '../components/Payslips/ViewPayslipModal';

const PendingPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchDraftPayslips();
  }, [pagination.page]);

  const fetchDraftPayslips = async () => {
    setLoading(true);
    try {
      const data = await getDraftPayslips({ page: pagination.page, limit: 20 });
      setPayslips(data.payslips);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching draft payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await approvePayslip(id);
      fetchDraftPayslips();
      alert('Payslip approved successfully!');
    } catch (error) {
      console.error('Error approving payslip:', error);
      alert('Error approving payslip');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Are you sure you want to approve all ${payslips.length} pending payslips?`)) return;
    
    setProcessing(true);
    try {
      await approveAllPayslips();
      fetchDraftPayslips();
      alert('All payslips approved successfully!');
    } catch (error) {
      console.error('Error approving all payslips:', error);
      alert('Error approving all payslips');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayslip) return;
    
    setProcessing(true);
    try {
      await rejectPayslip(selectedPayslip.id, rejectionReason);
      setShowRejectModal(false);
      setSelectedPayslip(null);
      setRejectionReason('');
      fetchDraftPayslips();
      alert('Payslip rejected successfully');
    } catch (error) {
      console.error('Error rejecting payslip:', error);
      alert('Error rejecting payslip');
    } finally {
      setProcessing(false);
    }
  };

  const handleView = (payslip) => {
    setSelectedPayslip(payslip);
    setShowViewModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <ClipboardDocumentCheckIcon className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Pending Payslips</h1>
            </div>
            <p className="text-orange-100">
              Review and approve bulk uploaded payslips before employees can see them
            </p>
          </div>
          {payslips.length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={processing}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium"
            >
              Approve All ({payslips.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-700">{pagination.total}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Awaiting Approval</p>
          <p className="text-2xl font-bold text-blue-700">{payslips.length}</p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                    <p className="mt-2">Loading pending payslips...</p>
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No pending payslips to review</p>
                  </td>
                </tr>
              ) : (
                payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">
                            {payslip.first_name?.charAt(0)}{payslip.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {payslip.first_name} {payslip.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{payslip.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatCurrency(payslip.gross_salary)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(payslip.net_salary)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(payslip.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleView(payslip)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleApprove(payslip.id)}
                        disabled={processing}
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        title="Approve"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayslip(payslip);
                          setShowRejectModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        title="Reject"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
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
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* View Payslip Modal */}
      <ViewPayslipModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPayslip(null);
        }}
        payslip={selectedPayslip}
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Reject Payslip</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject payslip for <strong>{selectedPayslip?.first_name} {selectedPayslip?.last_name}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPayslips;