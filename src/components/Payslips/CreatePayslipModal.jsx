import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createPayslip } from '../../api/payslips';

const CreatePayslipModal = ({ isOpen, onClose, onSuccess, employees }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    pay_period_start: '',
    pay_period_end: '',
    pay_date: '',
    
    // Salary Rates
    basic_salary_monthly: 0,
    basic_salary_semi_monthly: 0,
    basic_salary_daily: 0,
    basic_salary_hourly: 0,
    basic_salary_per_minute: 0,
    
    // Attendance Related
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
    
    status: 'generated'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Calculate rates when monthly salary changes
  useEffect(() => {
    const monthly = parseFloat(formData.basic_salary_monthly) || 0;
    if (monthly > 0) {
      const semiMonthly = monthly / 2;
      const daily = monthly / 22;
      const hourly = daily / 8;
      const perMinute = hourly / 60;
      
      setFormData(prev => ({
        ...prev,
        basic_salary_semi_monthly: semiMonthly,
        basic_salary_daily: daily,
        basic_salary_hourly: hourly,
        basic_salary_per_minute: perMinute
      }));
    }
  }, [formData.basic_salary_monthly]);

  // Calculate absence amount when days change
  useEffect(() => {
    const daily = parseFloat(formData.basic_salary_daily) || 0;
    const absencesDays = parseFloat(formData.absences_days) || 0;
    const absenceAmount = absencesDays * daily;
    
    setFormData(prev => ({
      ...prev,
      absences_amount: absenceAmount
    }));
  }, [formData.absences_days, formData.basic_salary_daily]);

  // Calculate paid leave amount when days change
  useEffect(() => {
    const daily = parseFloat(formData.basic_salary_daily) || 0;
    const paidLeaveDays = parseFloat(formData.paid_leave_days) || 0;
    const paidLeaveAmount = paidLeaveDays * daily;
    
    setFormData(prev => ({
      ...prev,
      paid_leave_amount: paidLeaveAmount
    }));
  }, [formData.paid_leave_days, formData.basic_salary_daily]);

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle pay period selection - 11th-25th and 26th-10th with pay dates 30th and 15th
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (!formData.user_id) {
      setError('Please select an employee first');
      return;
    }

    const today = new Date();
    let start, end, payDate;

    if (period === 'first') {
      // First period: 11th to 25th of current month
      start = new Date(today.getFullYear(), today.getMonth(), 11);
      end = new Date(today.getFullYear(), today.getMonth(), 25);
      payDate = new Date(today.getFullYear(), today.getMonth(), 30); // Pay on 30th
    } else {
      // Second period: 26th of current month to 10th of next month
      start = new Date(today.getFullYear(), today.getMonth(), 26);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 10);
      payDate = new Date(today.getFullYear(), today.getMonth() + 1, 15); // Pay on 15th of next month
    }

    setFormData(prev => ({
      ...prev,
      pay_period_start: formatDate(start),
      pay_period_end: formatDate(end),
      pay_date: formatDate(payDate)
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

  const handleEmployeeSelect = (e) => {
    const userId = parseInt(e.target.value);
    setFormData(prev => ({ ...prev, user_id: userId }));
    
    const selectedEmployee = employees.find(emp => emp.id === userId);
    if (selectedEmployee && selectedEmployee.salary) {
      setFormData(prev => ({ ...prev, basic_salary_monthly: parseFloat(selectedEmployee.salary) || 0 }));
    }
  };

  const calculateGrossSalary = () => {
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
    
    const deductions = [
      parseFloat(formData.absences_amount) || 0,
      parseFloat(formData.late_undertime_amount) || 0
    ];
    
    const totalEarnings = earnings.reduce((sum, val) => sum + val, 0);
    const totalDeductions = deductions.reduce((sum, val) => sum + val, 0);
    
    return totalEarnings - totalDeductions;
  };

  const calculateTotalDeductions = () => {
    const deductions = [
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
    
    return deductions.reduce((sum, val) => sum + val, 0);
  };

  const calculateNetSalary = () => {
    const gross = calculateGrossSalary();
    const deductions = calculateTotalDeductions();
    const allowance = parseFloat(formData.allowance_amount) || 0;
    return gross - deductions + allowance;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.user_id) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    if (!formData.pay_period_start || !formData.pay_period_end) {
      setError('Please select a pay period');
      setLoading(false);
      return;
    }

    try {
      const grossSalary = calculateGrossSalary();
      const totalDeductions = calculateTotalDeductions();
      const nonTaxableDeductions = (parseFloat(formData.sss_deduction) || 0) + 
                                    (parseFloat(formData.philhealth_deduction) || 0) + 
                                    (parseFloat(formData.pagibig_deduction) || 0);
      
      const payload = {
        ...formData,
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        net_amount: grossSalary - totalDeductions,
        net_salary: calculateNetSalary(),
        amount_subject_to_tax: grossSalary - nonTaxableDeductions
      };
      
      await createPayslip(payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating payslip');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-xl font-bold text-gray-800">Generate Payslip</h2>
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

          {/* Employee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
              <select
                value={formData.user_id}
                onChange={handleEmployeeSelect}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pay Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pay Period *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handlePeriodChange('first')}
                className={`p-3 border rounded-lg text-center transition-all ${
                  selectedPeriod === 'first' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">11th - 25th</div>
                <div className="text-xs text-gray-500 mt-1">
                  Pay Date: 30th
                </div>
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('second')}
                className={`p-3 border rounded-lg text-center transition-all ${
                  selectedPeriod === 'second' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">26th - 10th</div>
                <div className="text-xs text-gray-500 mt-1">
                  Pay Date: 15th of next month
                </div>
              </button>
            </div>
          </div>

          {/* Display selected period dates */}
          {formData.pay_period_start && formData.pay_period_end && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Period: <span className="font-medium">{formData.pay_period_start}</span> to{' '}
                <span className="font-medium">{formData.pay_period_end}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Pay Date: {formData.pay_date}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
            <TabButton id="basic" label="Basic Info" />
            <TabButton id="attendance" label="Attendance" />
            <TabButton id="overtime" label="Overtime & Holiday" />
            <TabButton id="deductions" label="Deductions" />
            <TabButton id="allowance" label="Allowance & Summary" />
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Salary Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Monthly) *</label>
                    <input
                      type="number"
                      name="basic_salary_monthly"
                      value={formData.basic_salary_monthly}
                      onChange={handleNumberChange}
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semi-monthly</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.basic_salary_semi_monthly)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.basic_salary_daily)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.basic_salary_hourly)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
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
                    placeholder="e.g., Uniform, Equipment, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Allowance & Summary Tab */}
          {activeTab === 'allowance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="e.g., Transportation, Meal, etc."
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
                    placeholder="e.g., Salary correction, Bonus, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600">Gross Salary</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(calculateGrossSalary())}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600">Total Deductions</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(calculateTotalDeductions())}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600">Net Amount</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(calculateGrossSalary() - calculateTotalDeductions())}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600">Net Salary (with Allowance)</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(calculateNetSalary())}</p>
                  </div>
                </div>
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
              {loading ? 'Generating...' : 'Generate Payslip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePayslipModal;