import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { downloadPayslip } from '../../api/payslips';
import { useState } from 'react'; 

const ViewPayslipModal = ({ isOpen, onClose, payslip }) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !payslip) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPayslip(payslip.id);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Error downloading payslip. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Payslip</h2>
            <p className="text-sm text-gray-500">
              {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <DocumentArrowDownIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Employee Info Header */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Employee #</p>
                <p className="font-medium text-gray-800">{payslip.employee_number || payslip.employee_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="font-medium text-gray-800">{payslip.first_name} {payslip.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium text-gray-800">{payslip.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pay Period</p>
                <p className="font-medium text-gray-800">{formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}</p>
              </div>
            </div>
          </div>

          {/* Salary Rates */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Salary Rates</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500">Monthly</p>
                <p className="font-medium text-gray-800">{formatCurrency(payslip.basic_salary_monthly)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Semi-monthly</p>
                <p className="font-medium text-gray-800">{formatCurrency(payslip.basic_salary_semi_monthly)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Daily</p>
                <p className="font-medium text-gray-800">{formatCurrency("505.00")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hourly</p>
                <p className="font-medium text-gray-800">{formatCurrency(payslip.basic_salary_hourly)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Per Minute</p>
                <p className="font-medium text-gray-800">{formatCurrency(payslip.basic_salary_per_minute)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Section */}
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Earnings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic Salary (Semi-monthly)</span>
                  <span className="font-medium">{formatCurrency(payslip.basic_salary_semi_monthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Absences</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.absences_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Leave (VL/SL)</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.paid_leave_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Late/Undertime Amount</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.late_undertime_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Night Differential Amount</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.night_differential_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Night Differential OT</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.night_differential_ot_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">OT Regular</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.ot_regular_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">OT Restday/Special Holiday</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.ot_restday_amount + payslip.ot_special_holiday_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">OT Regular Holiday</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.ot_regular_holiday_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Restday Duty</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.restday_duty_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Holiday Premium 100%</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.holiday_premium_100_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Holiday Premium 30%</span>
                  <span className="font-medium text-green-600">{formatCurrency(payslip.holiday_premium_30_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adjustment</span>
                  <span className="font-medium">{formatCurrency(payslip.adjustment_amount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>GROSS SALARY</span>
                  <span className="text-lg text-blue-600">{formatCurrency(payslip.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Deductions</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">SSS</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.sss_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PHILHEALTH</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.philhealth_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PAG-IBIG</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.pagibig_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Subject to Tax</span>
                  <span className="font-medium">{formatCurrency(payslip.amount_subject_to_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Income Tax</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.income_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SSS Loan</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.sss_loan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Advance</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.cash_advance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee Ledger</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.employee_ledger)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pag-IBIG Loan</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.pagibig_loan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HMO</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.hmo_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Others</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payslip.other_deductions)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-lg text-red-600">-{formatCurrency(payslip.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary and Allowances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-green-600 font-medium">NET AMOUNT</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(payslip.net_amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Allowance</p>
                  <p className="font-medium text-green-700">{formatCurrency(payslip.allowance_amount)}</p>
                  {payslip.allowance_description && (
                    <p className="text-xs text-gray-500">{payslip.allowance_description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">NET SALARY</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(payslip.net_salary)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">Days Present</p>
                  <p className="font-medium text-blue-700">{formatNumber(payslip.days_present)} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This is a computer-generated document. No signature required.</p>
            <p>Generated on: {new Date(payslip.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPayslipModal;