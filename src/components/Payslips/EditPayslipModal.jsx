import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { updatePayslip } from '../../api/payslips';

const EditPayslipModal = ({ isOpen, onClose, onSuccess, payslip }) => {
  const [formData, setFormData] = useState({
    // Basic Info
    basic_salary_monthly: 0,
    basic_salary_semi_monthly: 0,
    basic_salary_daily: 0,
    basic_salary_hourly: 0,
    
    // Attendance Related (Direct Amounts)
    absences_days: 0,
    absences_amount: 0,
    paid_leave_days: 0,
    paid_leave_amount: 0,
    late_undertime_amount: 0,
    night_differential_amount: 0,
    night_differential_ot_amount: 0,
    
    // Overtime (Direct Amounts)
    ot_regular_amount: 0,
    ot_restday_amount: 0,
    ot_special_holiday_amount: 0,
    ot_regular_holiday_amount: 0,
    
    // Special Duty (Direct Amounts)
    restday_duty_amount: 0,
    holiday_premium_100_amount: 0,
    holiday_premium_30_amount: 0,
    
    // Adjustments
    adjustment_amount: 0,
    adjustment_description: '',
    
    // Deductions
    sss_deduction: 0,
    philhealth_deduction: 0,
    pagibig_deduction: 0,
    income_tax: 0,
    sss_loan: 0,
    cash_advance: 0,
    employee_ledger: 0,
    pagibig_loan: 0,
    hmo_deduction: 0,
    other_deductions: 0,
    other_deductions_description: '',
    
    // Allowance
    allowance_amount: 0,
    allowance_description: '',
    
    // Attendance Summary
    days_present: 0,
    days_late: 0,
    
    // Calculated Fields (editable)
    gross_salary: 0,
    total_deductions: 0,
    net_amount: 0,
    net_salary: 0,
    amount_subject_to_tax: 0,
    
    status: 'generated'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Load payslip data when modal opens
  useEffect(() => {
    if (payslip) {
      setFormData({
        // Basic Info
        basic_salary_monthly: payslip.basic_salary_monthly || 0,
        basic_salary_semi_monthly: payslip.basic_salary_semi_monthly || 0,
        basic_salary_daily: payslip.basic_salary_daily || 0,
        basic_salary_hourly: payslip.basic_salary_hourly || 0,
        
        // Attendance Related
        absences_days: payslip.absences_days || 0,
        absences_amount: payslip.absences_amount || 0,
        paid_leave_days: payslip.paid_leave_days || 0,
        paid_leave_amount: payslip.paid_leave_amount || 0,
        late_undertime_amount: payslip.late_undertime_amount || 0,
        night_differential_amount: payslip.night_differential_amount || 0,
        night_differential_ot_amount: payslip.night_differential_ot_amount || 0,
        
        // Overtime
        ot_regular_amount: payslip.ot_regular_amount || 0,
        ot_restday_amount: payslip.ot_restday_amount || 0,
        ot_special_holiday_amount: payslip.ot_special_holiday_amount || 0,
        ot_regular_holiday_amount: payslip.ot_regular_holiday_amount || 0,
        
        // Special Duty
        restday_duty_amount: payslip.restday_duty_amount || 0,
        holiday_premium_100_amount: payslip.holiday_premium_100_amount || 0,
        holiday_premium_30_amount: payslip.holiday_premium_30_amount || 0,
        
        // Adjustments
        adjustment_amount: payslip.adjustment_amount || 0,
        adjustment_description: payslip.adjustment_description || '',
        
        // Deductions
        sss_deduction: payslip.sss_deduction || 0,
        philhealth_deduction: payslip.philhealth_deduction || 0,
        pagibig_deduction: payslip.pagibig_deduction || 0,
        income_tax: payslip.income_tax || 0,
        sss_loan: payslip.sss_loan || 0,
        cash_advance: payslip.cash_advance || 0,
        employee_ledger: payslip.employee_ledger || 0,
        pagibig_loan: payslip.pagibig_loan || 0,
        hmo_deduction: payslip.hmo_deduction || 0,
        other_deductions: payslip.other_deductions || 0,
        other_deductions_description: payslip.other_deductions_description || '',
        
        // Allowance
        allowance_amount: payslip.allowance_amount || 0,
        allowance_description: payslip.allowance_description || '',
        
        // Attendance Summary
        days_present: payslip.days_present || 0,
        days_late: payslip.days_late || 0,
        
        // Calculated Fields
        gross_salary: payslip.gross_salary || 0,
        total_deductions: payslip.total_deductions || 0,
        net_amount: payslip.net_amount || 0,
        net_salary: payslip.net_salary || 0,
        amount_subject_to_tax: payslip.amount_subject_to_tax || 0,
        
        status: payslip.status || 'generated'
      });
    }
  }, [payslip]);

  // Auto-calculate totals when components change
  useEffect(() => {
    if (autoCalculate) {
      calculateTotals();
    }
  }, [
    formData.basic_salary_semi_monthly,
    formData.paid_leave_amount,
    formData.night_differential_amount,
    formData.night_differential_ot_amount,
    formData.ot_regular_amount,
    formData.ot_restday_amount,
    formData.ot_special_holiday_amount,
    formData.ot_regular_holiday_amount,
    formData.restday_duty_amount,
    formData.holiday_premium_100_amount,
    formData.holiday_premium_30_amount,
    formData.adjustment_amount,
    formData.absences_amount,
    formData.late_undertime_amount,
    formData.sss_deduction,
    formData.philhealth_deduction,
    formData.pagibig_deduction,
    formData.income_tax,
    formData.sss_loan,
    formData.cash_advance,
    formData.employee_ledger,
    formData.pagibig_loan,
    formData.hmo_deduction,
    formData.other_deductions,
    formData.allowance_amount,
    autoCalculate
  ]);

  // Calculate absence amount when days change
  useEffect(() => {
    if (autoCalculate && formData.basic_salary_daily) {
      const daily = parseFloat(formData.basic_salary_daily) || 0;
      const absencesDays = parseFloat(formData.absences_days) || 0;
      const computedAmount = absencesDays * daily;
      
      setFormData(prev => ({
        ...prev,
        absences_amount: computedAmount
      }));
    }
  }, [formData.absences_days, formData.basic_salary_daily, autoCalculate]);

  // Calculate paid leave amount when days change
  useEffect(() => {
    if (autoCalculate && formData.basic_salary_daily) {
      const daily = parseFloat(formData.basic_salary_daily) || 0;
      const paidLeaveDays = parseFloat(formData.paid_leave_days) || 0;
      const computedAmount = paidLeaveDays * daily;
      
      setFormData(prev => ({
        ...prev,
        paid_leave_amount: computedAmount
      }));
    }
  }, [formData.paid_leave_days, formData.basic_salary_daily, autoCalculate]);

  // Calculate rates when monthly salary changes
  useEffect(() => {
    if (autoCalculate) {
      const monthly = parseFloat(formData.basic_salary_monthly) || 0;
      if (monthly > 0) {
        const semiMonthly = monthly / 2;
        const daily = monthly / 22;
        const hourly = daily / 8;
        
        setFormData(prev => ({
          ...prev,
          basic_salary_semi_monthly: semiMonthly,
          basic_salary_daily: daily,
          basic_salary_hourly: hourly
        }));
      }
    }
  }, [formData.basic_salary_monthly, autoCalculate]);

  const calculateTotals = () => {
    // Calculate Gross Salary
    const earnings = [
      parseFloat(formData.basic_salary_semi_monthly) || 0,
      parseFloat(formData.paid_leave_amount) || 0,
      parseFloat(formData.night_differential_amount) || 0,
      parseFloat(formData.night_differential_ot_amount) || 0,
      parseFloat(formData.ot_regular_amount) || 0,
      parseFloat(formData.ot_restday_amount) || 0,
      parseFloat(formData.ot_special_holiday_amount) || 0,
      parseFloat(formData.ot_regular_holiday_amount) || 0,
      parseFloat(formData.restday_duty_amount) || 0,
      parseFloat(formData.holiday_premium_100_amount) || 0,
      parseFloat(formData.holiday_premium_30_amount) || 0,
      parseFloat(formData.adjustment_amount) || 0
    ];
    
    const deductionsFromEarnings = [
      parseFloat(formData.absences_amount) || 0,
      parseFloat(formData.late_undertime_amount) || 0
    ];
    
    const totalEarnings = earnings.reduce((sum, val) => sum + val, 0);
    const totalDeductionsFromEarnings = deductionsFromEarnings.reduce((sum, val) => sum + val, 0);
    const computedGrossSalary = totalEarnings - totalDeductionsFromEarnings;
    
    // Calculate Total Deductions
    const allDeductions = [
      parseFloat(formData.sss_deduction) || 0,
      parseFloat(formData.philhealth_deduction) || 0,
      parseFloat(formData.pagibig_deduction) || 0,
      parseFloat(formData.income_tax) || 0,
      parseFloat(formData.sss_loan) || 0,
      parseFloat(formData.cash_advance) || 0,
      parseFloat(formData.employee_ledger) || 0,
      parseFloat(formData.pagibig_loan) || 0,
      parseFloat(formData.hmo_deduction) || 0,
      parseFloat(formData.other_deductions) || 0
    ];
    const computedTotalDeductions = allDeductions.reduce((sum, val) => sum + val, 0);
    
    // Calculate Net Amount
    const computedNetAmount = computedGrossSalary - computedTotalDeductions;
    
    // Calculate Net Salary
    const allowance = parseFloat(formData.allowance_amount) || 0;
    const computedNetSalary = computedNetAmount + allowance;
    
    // Calculate Amount Subject to Tax
    const nonTaxableDeductions = (parseFloat(formData.sss_deduction) || 0) + 
                                  (parseFloat(formData.philhealth_deduction) || 0) + 
                                  (parseFloat(formData.pagibig_deduction) || 0);
    const computedAmountSubjectToTax = computedGrossSalary - nonTaxableDeductions;
    
    setFormData(prev => ({
      ...prev,
      gross_salary: computedGrossSalary,
      total_deductions: computedTotalDeductions,
      net_amount: computedNetAmount,
      net_salary: computedNetSalary,
      amount_subject_to_tax: computedAmountSubjectToTax
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleManualTotalChange = (e) => {
    const { name, value } = e.target;
    setAutoCalculate(false);
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleRecalculate = () => {
    setAutoCalculate(true);
    calculateTotals();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        // Ensure all required fields are present
        absences_days: formData.absences_days || 0,
        paid_leave_days: formData.paid_leave_days || 0,
        days_present: formData.days_present || 0,
        days_late: formData.days_late || 0
      };
      
      await updatePayslip(payslip.id, payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating payslip');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  const TabButton = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Payslip</h2>
            <p className="text-sm text-gray-500">
              {payslip?.first_name} {payslip?.last_name} - {payslip?.pay_period_start} to {payslip?.pay_period_end}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!autoCalculate && (
              <button
                type="button"
                onClick={handleRecalculate}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
              >
                <CalculatorIcon className="h-4 w-4 mr-1" />
                Recalculate
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!autoCalculate && (
            <div className="mb-4 bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
              <strong>Manual Mode:</strong> Totals are manually entered. Click "Recalculate" to auto-calculate based on components.
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
            <TabButton id="basic" label="Basic Info" />
            <TabButton id="attendance" label="Attendance & Leaves" />
            <TabButton id="overtime" label="Overtime & Holiday Pay" />
            <TabButton id="deductions" label="Deductions & Loans" />
            <TabButton id="totals" label="Totals & Summary" />
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Salary Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Monthly)</label>
                    <input
                      type="number"
                      name="basic_salary_monthly"
                      value={formData.basic_salary_monthly}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semi-monthly</label>
                    <input
                      type="number"
                      name="basic_salary_semi_monthly"
                      value={formData.basic_salary_semi_monthly}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
                    <input
                      type="number"
                      name="basic_salary_daily"
                      value={formData.basic_salary_daily}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                    <input
                      type="number"
                      name="basic_salary_hourly"
                      value={formData.basic_salary_hourly}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance & Leaves Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Present</label>
                  <input
                    type="number"
                    name="days_present"
                    value={formData.days_present}
                    onChange={handleNumberChange}
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Absent</label>
                  <input
                    type="number"
                    name="absences_days"
                    value={formData.absences_days}
                    onChange={handleNumberChange}
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-red-600 mt-1">Amount: {formatCurrency(formData.absences_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Leave Days (VL/SL)</label>
                  <input
                    type="number"
                    name="paid_leave_days"
                    value={formData.paid_leave_days}
                    onChange={handleNumberChange}
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-green-600 mt-1">Amount: {formatCurrency(formData.paid_leave_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late/Undertime Amount</label>
                  <input
                    type="number"
                    name="late_undertime_amount"
                    value={formData.late_undertime_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Night Differential Amount</label>
                  <input
                    type="number"
                    name="night_differential_amount"
                    value={formData.night_differential_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Night Differential OT Amount</label>
                  <input
                    type="number"
                    name="night_differential_ot_amount"
                    value={formData.night_differential_ot_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Overtime & Holiday Pay Tab */}
          {activeTab === 'overtime' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Enter the actual computed amounts for overtime and holiday pay.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OT Regular Amount</label>
                  <input
                    type="number"
                    name="ot_regular_amount"
                    value={formData.ot_regular_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OT Restday Amount</label>
                  <input
                    type="number"
                    name="ot_restday_amount"
                    value={formData.ot_restday_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OT Special Holiday Amount</label>
                  <input
                    type="number"
                    name="ot_special_holiday_amount"
                    value={formData.ot_special_holiday_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OT Regular Holiday Amount</label>
                  <input
                    type="number"
                    name="ot_regular_holiday_amount"
                    value={formData.ot_regular_holiday_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restday Duty Amount</label>
                  <input
                    type="number"
                    name="restday_duty_amount"
                    value={formData.restday_duty_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Premium 100% Amount</label>
                  <input
                    type="number"
                    name="holiday_premium_100_amount"
                    value={formData.holiday_premium_100_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Premium 30% Amount</label>
                  <input
                    type="number"
                    name="holiday_premium_30_amount"
                    value={formData.holiday_premium_30_amount}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Deductions & Loans Tab */}
          {activeTab === 'deductions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSS Deduction</label>
                  <input
                    type="number"
                    name="sss_deduction"
                    value={formData.sss_deduction}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PhilHealth Deduction</label>
                  <input
                    type="number"
                    name="philhealth_deduction"
                    value={formData.philhealth_deduction}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pag-IBIG Deduction</label>
                  <input
                    type="number"
                    name="pagibig_deduction"
                    value={formData.pagibig_deduction}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax</label>
                  <input
                    type="number"
                    name="income_tax"
                    value={formData.income_tax}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSS Loan</label>
                  <input
                    type="number"
                    name="sss_loan"
                    value={formData.sss_loan}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Advance</label>
                  <input
                    type="number"
                    name="cash_advance"
                    value={formData.cash_advance}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Ledger</label>
                  <input
                    type="number"
                    name="employee_ledger"
                    value={formData.employee_ledger}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pag-IBIG Loan</label>
                  <input
                    type="number"
                    name="pagibig_loan"
                    value={formData.pagibig_loan}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HMO Deduction</label>
                  <input
                    type="number"
                    name="hmo_deduction"
                    value={formData.hmo_deduction}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions</label>
                  <input
                    type="number"
                    name="other_deductions"
                    value={formData.other_deductions}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions Description</label>
                  <input
                    type="text"
                    name="other_deductions_description"
                    value={formData.other_deductions_description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Totals & Summary Tab */}
          {activeTab === 'totals' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowance Amount</label>
                <input
                  type="number"
                  name="allowance_amount"
                  value={formData.allowance_amount}
                  onChange={handleNumberChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowance Description</label>
                <input
                  type="text"
                  name="allowance_description"
                  value={formData.allowance_description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Amount</label>
                <input
                  type="number"
                  name="adjustment_amount"
                  value={formData.adjustment_amount}
                  onChange={handleNumberChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Description</label>
                <input
                  type="text"
                  name="adjustment_description"
                  value={formData.adjustment_description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Totals (Editable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
                    <input
                      type="number"
                      name="gross_salary"
                      value={formData.gross_salary}
                      onChange={handleManualTotalChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Deductions</label>
                    <input
                      type="number"
                      name="total_deductions"
                      value={formData.total_deductions}
                      onChange={handleManualTotalChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
                    <input
                      type="number"
                      name="net_amount"
                      value={formData.net_amount}
                      onChange={handleManualTotalChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (with Allowance)</label>
                    <input
                      type="number"
                      name="net_salary"
                      value={formData.net_salary}
                      onChange={handleManualTotalChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Subject to Tax</label>
                    <input
                      type="number"
                      name="amount_subject_to_tax"
                      value={formData.amount_subject_to_tax}
                      onChange={handleManualTotalChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="bg-yellow-50 px-1">Yellow fields</span> are totals that can be manually edited.
                  {!autoCalculate && " You are currently in manual mode. Click 'Recalculate' to auto-calculate based on components."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="generated">Generated</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex space-x-3 mt-8 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Payslip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPayslipModal;