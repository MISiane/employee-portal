const pool = require('../config/database');
const PDFGenerator = require('../services/pdfGenerator');

// Helper functions
const sanitizeValue = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  return value;
};

const sanitizeNumber = (value) => {
  if (value === '' || value === undefined || value === null) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

// Round to 2 decimal places
const roundTo2 = (num) => {
  return Math.round((num || 0) * 100) / 100;
};

// Calculate ACTUAL daily rate from monthly salary (26 working days per month)
const calculateActualDailyRate = (monthlySalary) => {
  return roundTo2(monthlySalary / 26);
};

// Calculate display daily rate (if HR inputs a different value for display)
const calculateDisplayDailyRate = (monthlySalary, displayDailyRate) => {
  if (displayDailyRate && displayDailyRate > 0) {
    return roundTo2(displayDailyRate);
  }
  return roundTo2(monthlySalary / 26);
};

// Calculate hourly rate from actual daily rate (8 hours)
const calculateHourlyRate = (dailyRate) => {
  return roundTo2(dailyRate / 8);
};

// Calculate per minute rate
const calculatePerMinuteRate = (hourlyRate) => {
  return roundTo2(hourlyRate / 60);
};

// Calculate gross salary based on all components
const calculateGrossSalary = (data) => {
  const earnings = [
    sanitizeNumber(data.basic_salary_semi_monthly),
    sanitizeNumber(data.paid_leave_amount),
    sanitizeNumber(data.night_differential_amount),
    sanitizeNumber(data.night_differential_ot_amount),
    sanitizeNumber(data.ot_regular_amount),
    sanitizeNumber(data.ot_restday_amount),
    sanitizeNumber(data.ot_special_holiday_amount),
    sanitizeNumber(data.ot_regular_holiday_amount),
    sanitizeNumber(data.restday_duty_amount),
    sanitizeNumber(data.holiday_premium_100_amount),
    sanitizeNumber(data.holiday_premium_30_amount),
    sanitizeNumber(data.adjustment_amount)
  ];
  
  const deductions = [
    sanitizeNumber(data.absences_amount),
    sanitizeNumber(data.late_undertime_amount)
  ];
  
  const totalEarnings = earnings.reduce((sum, val) => sum + val, 0);
  const totalDeductions = deductions.reduce((sum, val) => sum + val, 0);
  
  return roundTo2(totalEarnings - totalDeductions);
};

// Calculate total deductions
const calculateTotalDeductions = (data) => {
  const deductions = [
    sanitizeNumber(data.sss_deduction),
    sanitizeNumber(data.philhealth_deduction),
    sanitizeNumber(data.pagibig_deduction),
    sanitizeNumber(data.income_tax),
    sanitizeNumber(data.sss_loan),
    sanitizeNumber(data.cash_advance),
    sanitizeNumber(data.employee_ledger),
    sanitizeNumber(data.pagibig_loan),
    sanitizeNumber(data.hmo_deduction),
    sanitizeNumber(data.other_deductions)
  ];
  
  return roundTo2(deductions.reduce((sum, val) => sum + val, 0));
};

// Calculate net salary
const calculateNetSalary = (grossSalary, totalDeductions, allowance) => {
  return roundTo2(grossSalary - totalDeductions + sanitizeNumber(allowance));
};

// Create payslip
const createPayslip = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const data = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const employee = await client.query(
      `SELECT u.id, u.email, ep.first_name, ep.last_name, ep.employee_code, ep.department,
              ep.position, ep.salary as basic_salary
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1`,
      [data.user_id]
    );
    
    if (employee.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const emp = employee.rows[0];
    
    // Get monthly salary (from input or employee profile)
    const monthlySalary = sanitizeNumber(data.basic_salary_monthly || emp.basic_salary);
    
    // For COMPUTATION purposes - use the correct daily rate (monthly ÷ 26)
    const actualDailyRate = calculateActualDailyRate(monthlySalary);
    const hourlyRate = calculateHourlyRate(actualDailyRate);
    const perMinuteRate = calculatePerMinuteRate(hourlyRate);
    const semiMonthlyRate = roundTo2(monthlySalary / 2);
    
    // For DISPLAY purposes - use the provided daily rate (legacy value) or fallback to actual
    const displayDailyRate = sanitizeNumber(data.basic_salary_daily);
    const dailyRateForDisplay = displayDailyRate > 0 ? displayDailyRate : actualDailyRate;
    
    // Calculate amounts using ACTUAL daily rate for computation
    const absencesDays = sanitizeNumber(data.absences_days);
    const absencesAmount = roundTo2(absencesDays * actualDailyRate);
    
    const paidLeaveDays = sanitizeNumber(data.paid_leave_days);
    const paidLeaveAmount = roundTo2(paidLeaveDays * actualDailyRate);
    
    const payslipData = {
      user_id: data.user_id,
      employee_number: emp.employee_code,
      pay_period_start: data.pay_period_start,
      pay_period_end: data.pay_period_end,
      pay_date: data.pay_date || new Date(data.pay_period_end),
      
      // Store both display and actual values
      basic_salary_monthly: monthlySalary,
      basic_salary_semi_monthly: semiMonthlyRate,
      basic_salary_daily: dailyRateForDisplay,        // Display value (legacy)
      basic_salary_hourly: hourlyRate,                 // Actual for computation
      basic_salary_per_minute: perMinuteRate,          // Actual for computation
      
      // Absences and leave calculations (using actual daily rate)
      absences_days: absencesDays,
      absences_amount: data.absences_amount !== undefined ? sanitizeNumber(data.absences_amount) : absencesAmount,
      paid_leave_days: paidLeaveDays,
      paid_leave_amount: data.paid_leave_amount !== undefined ? sanitizeNumber(data.paid_leave_amount) : paidLeaveAmount,
      late_undertime_amount: sanitizeNumber(data.late_undertime_amount),
      night_differential_amount: sanitizeNumber(data.night_differential_amount),
      night_differential_ot_amount: sanitizeNumber(data.night_differential_ot_amount),
      
      ot_regular_amount: sanitizeNumber(data.ot_regular_amount),
      ot_restday_amount: sanitizeNumber(data.ot_restday_amount),
      ot_special_holiday_amount: sanitizeNumber(data.ot_special_holiday_amount),
      ot_regular_holiday_amount: sanitizeNumber(data.ot_regular_holiday_amount),
      
      restday_duty_amount: sanitizeNumber(data.restday_duty_amount),
      holiday_premium_100_amount: sanitizeNumber(data.holiday_premium_100_amount),
      holiday_premium_30_amount: sanitizeNumber(data.holiday_premium_30_amount),
      
      adjustment_amount: sanitizeNumber(data.adjustment_amount),
      adjustment_description: sanitizeValue(data.adjustment_description),
      
      // Deductions
      sss_deduction: sanitizeNumber(data.sss_deduction),
      philhealth_deduction: sanitizeNumber(data.philhealth_deduction),
      pagibig_deduction: sanitizeNumber(data.pagibig_deduction),
      income_tax: sanitizeNumber(data.income_tax),
      sss_loan: sanitizeNumber(data.sss_loan),
      cash_advance: sanitizeNumber(data.cash_advance),
      employee_ledger: sanitizeNumber(data.employee_ledger),
      pagibig_loan: sanitizeNumber(data.pagibig_loan),
      hmo_deduction: sanitizeNumber(data.hmo_deduction),
      other_deductions: sanitizeNumber(data.other_deductions),
      other_deductions_description: sanitizeValue(data.other_deductions_description),
      
      allowance_amount: sanitizeNumber(data.allowance_amount),
      allowance_description: sanitizeValue(data.allowance_description),
      
      days_present: sanitizeNumber(data.days_present),
      days_late: sanitizeNumber(data.days_late),
      
      created_by: req.user.id,
      status: data.status || 'generated'
    };
    
    // Calculate gross salary
    payslipData.gross_salary = calculateGrossSalary(payslipData);
    
    // Calculate taxable amount
    const nonTaxableDeductions = payslipData.sss_deduction + 
                                  payslipData.philhealth_deduction + 
                                  payslipData.pagibig_deduction;
    payslipData.amount_subject_to_tax = roundTo2(payslipData.gross_salary - nonTaxableDeductions);
    
    // Calculate totals
    payslipData.total_deductions = calculateTotalDeductions(payslipData);
    payslipData.net_salary = calculateNetSalary(
      payslipData.gross_salary, 
      payslipData.total_deductions, 
      payslipData.allowance_amount
    );
    
    // Insert payslip
    const result = await client.query(
      `INSERT INTO payslips (
        user_id, employee_number, pay_period_start, pay_period_end, pay_date,
        basic_salary_monthly, basic_salary_semi_monthly, basic_salary_daily,
        basic_salary_hourly, basic_salary_per_minute,
        absences_days, absences_amount, paid_leave_days, paid_leave_amount,
        late_undertime_amount, night_differential_amount, night_differential_ot_amount,
        ot_regular_amount, ot_restday_amount, ot_special_holiday_amount, ot_regular_holiday_amount,
        restday_duty_amount, holiday_premium_100_amount, holiday_premium_30_amount,
        adjustment_amount, adjustment_description,
        gross_salary, sss_deduction, philhealth_deduction, pagibig_deduction,
        amount_subject_to_tax, income_tax, sss_loan, cash_advance, employee_ledger,
        pagibig_loan, hmo_deduction, other_deductions, other_deductions_description,
        total_deductions, net_amount, allowance_amount, allowance_description, net_salary,
        days_present, days_late, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
                $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48)
      RETURNING *`,
      [
        payslipData.user_id, payslipData.employee_number, payslipData.pay_period_start,
        payslipData.pay_period_end, payslipData.pay_date, payslipData.basic_salary_monthly,
        payslipData.basic_salary_semi_monthly, payslipData.basic_salary_daily,
        payslipData.basic_salary_hourly, payslipData.basic_salary_per_minute,
        payslipData.absences_days, payslipData.absences_amount, payslipData.paid_leave_days,
        payslipData.paid_leave_amount, payslipData.late_undertime_amount,
        payslipData.night_differential_amount, payslipData.night_differential_ot_amount,
        payslipData.ot_regular_amount, payslipData.ot_restday_amount,
        payslipData.ot_special_holiday_amount, payslipData.ot_regular_holiday_amount,
        payslipData.restday_duty_amount, payslipData.holiday_premium_100_amount,
        payslipData.holiday_premium_30_amount, payslipData.adjustment_amount,
        payslipData.adjustment_description, payslipData.gross_salary,
        payslipData.sss_deduction, payslipData.philhealth_deduction, payslipData.pagibig_deduction,
        payslipData.amount_subject_to_tax, payslipData.income_tax, payslipData.sss_loan,
        payslipData.cash_advance, payslipData.employee_ledger, payslipData.pagibig_loan,
        payslipData.hmo_deduction, payslipData.other_deductions, payslipData.other_deductions_description,
        payslipData.total_deductions, payslipData.net_salary, payslipData.allowance_amount,
        payslipData.allowance_description, payslipData.net_salary, payslipData.days_present,
        payslipData.days_late, payslipData.status, payslipData.created_by
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Payslip created successfully',
      payslip: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payslip:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
};

// Get payslips with employee details
const getPayslips = async (req, res) => {
  const { user_id, year, month, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT p.*, u.email, ep.first_name, ep.last_name, ep.department, ep.position,
             ep.employee_code
      FROM payslips p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;
    
    if (req.user.role !== 'admin') {
      query += ` AND p.user_id = $${paramCount}`;
      values.push(req.user.id);
      paramCount++;
    } else if (user_id && user_id !== '') {
      query += ` AND p.user_id = $${paramCount}`;
      values.push(user_id);
      paramCount++;
    }
    
    if (year && year !== '' && year !== 'undefined') {
      query += ` AND EXTRACT(YEAR FROM p.pay_period_start) = $${paramCount}`;
      values.push(parseInt(year));
      paramCount++;
    }
    
    if (month && month !== '' && month !== 'undefined') {
      query += ` AND EXTRACT(MONTH FROM p.pay_period_start) = $${paramCount}`;
      values.push(parseInt(month));
      paramCount++;
    }
    
    query += ` ORDER BY p.pay_period_start DESC, p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    let countQuery = 'SELECT COUNT(*) FROM payslips WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;
    
    if (req.user.role !== 'admin') {
      countQuery += ` AND user_id = $${countParamCount}`;
      countValues.push(req.user.id);
      countParamCount++;
    } else if (user_id && user_id !== '') {
      countQuery += ` AND user_id = $${countParamCount}`;
      countValues.push(user_id);
    }
    
    if (year && year !== '' && year !== 'undefined') {
      countQuery += ` AND EXTRACT(YEAR FROM pay_period_start) = $${countParamCount}`;
      countValues.push(parseInt(year));
    }
    
    if (month && month !== '' && month !== 'undefined') {
      countQuery += ` AND EXTRACT(MONTH FROM pay_period_start) = $${countParamCount}`;
      countValues.push(parseInt(month));
    }
    
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      payslips: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting payslips:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single payslip by ID
const getPayslipById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT p.*, u.email, ep.first_name, ep.last_name, ep.department, ep.position,
              ep.employee_code, ep.sss_number, ep.philhealth_number, ep.pagibig_number
       FROM payslips p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    const payslip = result.rows[0];
    
    if (req.user.role !== 'admin' && payslip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(payslip);
  } catch (error) {
    console.error('Error getting payslip:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update payslip
const updatePayslip = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  const data = req.body;
  
  try {
    const checkResult = await pool.query(
      'SELECT id FROM payslips WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    // Get monthly salary from data or existing payslip
    const monthlySalary = sanitizeNumber(data.basic_salary_monthly || 0);
    const actualDailyRate = calculateActualDailyRate(monthlySalary);
    
    // Recalculate amounts using actual daily rate
    const recalculatedAbsencesAmount = (data.absences_days || 0) * actualDailyRate;
    const recalculatedPaidLeaveAmount = (data.paid_leave_days || 0) * actualDailyRate;
    
    // Prepare data for recalculation
    const recalcData = {
      basic_salary_semi_monthly: data.basic_salary_semi_monthly || roundTo2(monthlySalary / 2),
      paid_leave_amount: data.paid_leave_amount !== undefined ? data.paid_leave_amount : recalculatedPaidLeaveAmount,
      night_differential_amount: data.night_differential_amount || 0,
      night_differential_ot_amount: data.night_differential_ot_amount || 0,
      ot_regular_amount: data.ot_regular_amount || 0,
      ot_restday_amount: data.ot_restday_amount || 0,
      ot_special_holiday_amount: data.ot_special_holiday_amount || 0,
      ot_regular_holiday_amount: data.ot_regular_holiday_amount || 0,
      restday_duty_amount: data.restday_duty_amount || 0,
      holiday_premium_100_amount: data.holiday_premium_100_amount || 0,
      holiday_premium_30_amount: data.holiday_premium_30_amount || 0,
      adjustment_amount: data.adjustment_amount || 0,
      absences_amount: data.absences_amount !== undefined ? data.absences_amount : recalculatedAbsencesAmount,
      late_undertime_amount: data.late_undertime_amount || 0,
      sss_deduction: data.sss_deduction || 0,
      philhealth_deduction: data.philhealth_deduction || 0,
      pagibig_deduction: data.pagibig_deduction || 0,
      income_tax: data.income_tax || 0,
      sss_loan: data.sss_loan || 0,
      cash_advance: data.cash_advance || 0,
      employee_ledger: data.employee_ledger || 0,
      pagibig_loan: data.pagibig_loan || 0,
      hmo_deduction: data.hmo_deduction || 0,
      other_deductions: data.other_deductions || 0,
      allowance_amount: data.allowance_amount || 0
    };
    
    const recalculatedGrossSalary = calculateGrossSalary(recalcData);
    const recalculatedTotalDeductions = calculateTotalDeductions(recalcData);
    const recalculatedNetSalary = calculateNetSalary(recalculatedGrossSalary, recalculatedTotalDeductions, recalcData.allowance_amount);
    const nonTaxableDeductions = recalcData.sss_deduction + recalcData.philhealth_deduction + recalcData.pagibig_deduction;
    const recalculatedAmountSubjectToTax = roundTo2(recalculatedGrossSalary - nonTaxableDeductions);
    
    const result = await pool.query(
      `UPDATE payslips SET
        basic_salary_monthly = $1,
        basic_salary_semi_monthly = $2,
        basic_salary_daily = $3,
        basic_salary_hourly = $4,
        absences_days = $5,
        absences_amount = $6,
        paid_leave_days = $7,
        paid_leave_amount = $8,
        late_undertime_amount = $9,
        night_differential_amount = $10,
        night_differential_ot_amount = $11,
        ot_regular_amount = $12,
        ot_restday_amount = $13,
        ot_special_holiday_amount = $14,
        ot_regular_holiday_amount = $15,
        restday_duty_amount = $16,
        holiday_premium_100_amount = $17,
        holiday_premium_30_amount = $18,
        adjustment_amount = $19,
        adjustment_description = $20,
        sss_deduction = $21,
        philhealth_deduction = $22,
        pagibig_deduction = $23,
        income_tax = $24,
        sss_loan = $25,
        cash_advance = $26,
        employee_ledger = $27,
        pagibig_loan = $28,
        hmo_deduction = $29,
        other_deductions = $30,
        other_deductions_description = $31,
        allowance_amount = $32,
        allowance_description = $33,
        days_present = $34,
        days_late = $35,
        gross_salary = $36,
        total_deductions = $37,
        net_salary = $38,
        amount_subject_to_tax = $39,
        status = $40,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $41
       RETURNING *`,
      [
        monthlySalary || 0,
        data.basic_salary_semi_monthly || roundTo2(monthlySalary / 2),
        data.basic_salary_daily || actualDailyRate,
        data.basic_salary_hourly || calculateHourlyRate(actualDailyRate),
        data.absences_days || 0,
        data.absences_amount !== undefined ? data.absences_amount : recalculatedAbsencesAmount,
        data.paid_leave_days || 0,
        data.paid_leave_amount !== undefined ? data.paid_leave_amount : recalculatedPaidLeaveAmount,
        data.late_undertime_amount || 0,
        data.night_differential_amount || 0,
        data.night_differential_ot_amount || 0,
        data.ot_regular_amount || 0,
        data.ot_restday_amount || 0,
        data.ot_special_holiday_amount || 0,
        data.ot_regular_holiday_amount || 0,
        data.restday_duty_amount || 0,
        data.holiday_premium_100_amount || 0,
        data.holiday_premium_30_amount || 0,
        data.adjustment_amount || 0,
        data.adjustment_description || '',
        data.sss_deduction || 0,
        data.philhealth_deduction || 0,
        data.pagibig_deduction || 0,
        data.income_tax || 0,
        data.sss_loan || 0,
        data.cash_advance || 0,
        data.employee_ledger || 0,
        data.pagibig_loan || 0,
        data.hmo_deduction || 0,
        data.other_deductions || 0,
        data.other_deductions_description || '',
        data.allowance_amount || 0,
        data.allowance_description || '',
        data.days_present || 0,
        data.days_late || 0,
        recalculatedGrossSalary,
        recalculatedTotalDeductions,
        recalculatedNetSalary,
        recalculatedAmountSubjectToTax,
        data.status || 'generated',
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    res.json({
      success: true,
      message: 'Payslip updated successfully',
      payslip: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Delete payslip
const deletePayslip = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM payslips WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get pay periods
const getAvailablePayPeriods = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        DATE_TRUNC('month', pay_period_start) as month,
        EXTRACT(YEAR FROM pay_period_start) as year,
        EXTRACT(MONTH FROM pay_period_start) as month_num
      FROM payslips
      ORDER BY month DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pay periods:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Bulk create payslips from Excel upload
const bulkCreatePayslips = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const XLSX = require('xlsx');
  const fs = require('fs');
  
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const results = {
      success: [],
      failed: [],
      total: data.length
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const employeeResult = await pool.query(
          `SELECT u.id, ep.salary, ep.first_name, ep.last_name
           FROM users u 
           LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
           WHERE ep.employee_code = $1 AND u.role = 'employee' AND u.is_active = true`,
          [row.EMPLOYEE_CODE]
        );
        
        if (employeeResult.rows.length === 0) {
          results.failed.push({
            row: i + 1,
            employee_code: row.EMPLOYEE_CODE,
            error: 'Employee not found or inactive'
          });
          continue;
        }
        
        const employee = employeeResult.rows[0];
        const monthlySalary = parseFloat(row.BASIC_SALARY_MONTHLY) || parseFloat(employee.salary) || 0;
        
        // Use actual daily rate for calculations (monthly ÷ 26)
        const actualDailyRate = calculateActualDailyRate(monthlySalary);
        const hourlyRate = calculateHourlyRate(actualDailyRate);
        
        // For display daily rate (legacy value if provided)
        const displayDailyRate = parseFloat(row.BASIC_SALARY_DAILY) || actualDailyRate;
        
        let absencesAmount = parseFloat(row.ABSENCES_AMOUNT) || 0;
        if (row.ABSENCES_DAYS && !row.ABSENCES_AMOUNT) {
          absencesAmount = roundTo2(parseFloat(row.ABSENCES_DAYS) * actualDailyRate);
        }
        
        let paidLeaveAmount = parseFloat(row.PAID_LEAVE_AMOUNT) || 0;
        if (row.PAID_LEAVE_DAYS && !row.PAID_LEAVE_AMOUNT) {
          paidLeaveAmount = roundTo2(parseFloat(row.PAID_LEAVE_DAYS) * actualDailyRate);
        }
        
        const payslipData = {
          user_id: employee.id,
          employee_number: row.EMPLOYEE_CODE,
          pay_period_start: row.PAY_PERIOD_START,
          pay_period_end: row.PAY_PERIOD_END,
          pay_date: row.PAY_DATE || row.PAY_PERIOD_END,
          basic_salary_monthly: monthlySalary,
          basic_salary_semi_monthly: roundTo2(monthlySalary / 2),
          basic_salary_daily: displayDailyRate,  // Display value
          basic_salary_hourly: hourlyRate,       // Actual for computation
          basic_salary_per_minute: roundTo2(hourlyRate / 60),
          absences_days: parseFloat(row.ABSENCES_DAYS) || 0,
          absences_amount: absencesAmount,
          paid_leave_days: parseFloat(row.PAID_LEAVE_DAYS) || 0,
          paid_leave_amount: paidLeaveAmount,
          late_undertime_amount: parseFloat(row.LATE_UNDERTIME_AMOUNT) || 0,
          night_differential_amount: parseFloat(row.NIGHT_DIFFERENTIAL_AMOUNT) || 0,
          night_differential_ot_amount: parseFloat(row.NIGHT_DIFFERENTIAL_OT_AMOUNT) || 0,
          ot_regular_amount: parseFloat(row.OT_REGULAR_AMOUNT) || 0,
          ot_restday_amount: parseFloat(row.OT_RESTDAY_AMOUNT) || 0,
          ot_special_holiday_amount: parseFloat(row.OT_SPECIAL_HOLIDAY_AMOUNT) || 0,
          ot_regular_holiday_amount: parseFloat(row.OT_REGULAR_HOLIDAY_AMOUNT) || 0,
          restday_duty_amount: parseFloat(row.RESTDAY_DUTY_AMOUNT) || 0,
          holiday_premium_100_amount: parseFloat(row.HOLIDAY_PREMIUM_100_AMOUNT) || 0,
          holiday_premium_30_amount: parseFloat(row.HOLIDAY_PREMIUM_30_AMOUNT) || 0,
          adjustment_amount: parseFloat(row.ADJUSTMENT_AMOUNT) || 0,
          adjustment_description: row.ADJUSTMENT_DESCRIPTION || '',
          sss_deduction: parseFloat(row.SSS_DEDUCTION) || 0,
          philhealth_deduction: parseFloat(row.PHILHEALTH_DEDUCTION) || 0,
          pagibig_deduction: parseFloat(row.PAGIBIG_DEDUCTION) || 0,
          income_tax: parseFloat(row.INCOME_TAX) || 0,
          sss_loan: parseFloat(row.SSS_LOAN) || 0,
          cash_advance: parseFloat(row.CASH_ADVANCE) || 0,
          employee_ledger: parseFloat(row.EMPLOYEE_LEDGER) || 0,
          pagibig_loan: parseFloat(row.PAGIBIG_LOAN) || 0,
          hmo_deduction: parseFloat(row.HMO_DEDUCTION) || 0,
          other_deductions: parseFloat(row.OTHER_DEDUCTIONS) || 0,
          other_deductions_description: row.OTHER_DEDUCTIONS_DESCRIPTION || '',
          allowance_amount: parseFloat(row.ALLOWANCE_AMOUNT) || 0,
          allowance_description: row.ALLOWANCE_DESCRIPTION || '',
          days_present: parseFloat(row.DAYS_PRESENT) || 0,
          days_late: parseFloat(row.DAYS_LATE) || 0,
          status: row.STATUS || 'generated',
          created_by: req.user.id
        };
        
        // Calculate totals
        const earnings = [
          payslipData.basic_salary_semi_monthly,
          payslipData.paid_leave_amount,
          payslipData.night_differential_amount,
          payslipData.night_differential_ot_amount,
          payslipData.ot_regular_amount,
          payslipData.ot_restday_amount,
          payslipData.ot_special_holiday_amount,
          payslipData.ot_regular_holiday_amount,
          payslipData.restday_duty_amount,
          payslipData.holiday_premium_100_amount,
          payslipData.holiday_premium_30_amount,
          payslipData.adjustment_amount
        ];
        
        const deductionsFromEarnings = [
          payslipData.absences_amount,
          payslipData.late_undertime_amount
        ];
        
        const totalEarnings = earnings.reduce((sum, val) => sum + val, 0);
        const totalDeductionsFromEarnings = deductionsFromEarnings.reduce((sum, val) => sum + val, 0);
        payslipData.gross_salary = roundTo2(totalEarnings - totalDeductionsFromEarnings);
        
        const allDeductions = [
          payslipData.sss_deduction,
          payslipData.philhealth_deduction,
          payslipData.pagibig_deduction,
          payslipData.income_tax,
          payslipData.sss_loan,
          payslipData.cash_advance,
          payslipData.employee_ledger,
          payslipData.pagibig_loan,
          payslipData.hmo_deduction,
          payslipData.other_deductions
        ];
        payslipData.total_deductions = roundTo2(allDeductions.reduce((sum, val) => sum + val, 0));
        
        payslipData.net_salary = roundTo2(payslipData.gross_salary - payslipData.total_deductions + payslipData.allowance_amount);
        
        const nonTaxableDeductions = payslipData.sss_deduction + 
                                      payslipData.philhealth_deduction + 
                                      payslipData.pagibig_deduction;
        payslipData.amount_subject_to_tax = roundTo2(payslipData.gross_salary - nonTaxableDeductions);
        
        const existingCheck = await pool.query(
          `SELECT id FROM payslips 
           WHERE user_id = $1 AND pay_period_start = $2 AND pay_period_end = $3`,
          [payslipData.user_id, payslipData.pay_period_start, payslipData.pay_period_end]
        );
        
        if (existingCheck.rows.length > 0) {
          results.failed.push({
            row: i + 1,
            employee_code: row.EMPLOYEE_CODE,
            error: 'Payslip already exists for this period'
          });
          continue;
        }
        
        const result = await pool.query(
          `INSERT INTO payslips (
            user_id, employee_number, pay_period_start, pay_period_end, pay_date,
            basic_salary_monthly, basic_salary_semi_monthly, basic_salary_daily,
            basic_salary_hourly, basic_salary_per_minute,
            absences_days, absences_amount, paid_leave_days, paid_leave_amount,
            late_undertime_amount, night_differential_amount, night_differential_ot_amount,
            ot_regular_amount, ot_restday_amount, ot_special_holiday_amount, ot_regular_holiday_amount,
            restday_duty_amount, holiday_premium_100_amount, holiday_premium_30_amount,
            adjustment_amount, adjustment_description,
            gross_salary, sss_deduction, philhealth_deduction, pagibig_deduction,
            amount_subject_to_tax, income_tax, sss_loan, cash_advance, employee_ledger,
            pagibig_loan, hmo_deduction, other_deductions, other_deductions_description,
            total_deductions, net_amount, allowance_amount, allowance_description, net_salary,
            days_present, days_late, status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
                    $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48)
          RETURNING id`,
          [
            payslipData.user_id, payslipData.employee_number, payslipData.pay_period_start,
            payslipData.pay_period_end, payslipData.pay_date, payslipData.basic_salary_monthly,
            payslipData.basic_salary_semi_monthly, payslipData.basic_salary_daily,
            payslipData.basic_salary_hourly, payslipData.basic_salary_per_minute,
            payslipData.absences_days, payslipData.absences_amount, payslipData.paid_leave_days,
            payslipData.paid_leave_amount, payslipData.late_undertime_amount,
            payslipData.night_differential_amount, payslipData.night_differential_ot_amount,
            payslipData.ot_regular_amount, payslipData.ot_restday_amount,
            payslipData.ot_special_holiday_amount, payslipData.ot_regular_holiday_amount,
            payslipData.restday_duty_amount, payslipData.holiday_premium_100_amount,
            payslipData.holiday_premium_30_amount, payslipData.adjustment_amount,
            payslipData.adjustment_description, payslipData.gross_salary,
            payslipData.sss_deduction, payslipData.philhealth_deduction, payslipData.pagibig_deduction,
            payslipData.amount_subject_to_tax, payslipData.income_tax, payslipData.sss_loan,
            payslipData.cash_advance, payslipData.employee_ledger, payslipData.pagibig_loan,
            payslipData.hmo_deduction, payslipData.other_deductions, payslipData.other_deductions_description,
            payslipData.total_deductions, payslipData.net_salary, payslipData.allowance_amount,
            payslipData.allowance_description, payslipData.net_salary, payslipData.days_present,
            payslipData.days_late, payslipData.status, payslipData.created_by
          ]
        );
        
        results.success.push({
          row: i + 1,
          employee_code: row.EMPLOYEE_CODE,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          payslip_id: result.rows[0].id,
          net_salary: payslipData.net_salary
        });
        
      } catch (rowError) {
        results.failed.push({
          row: i + 1,
          employee_code: row.EMPLOYEE_CODE,
          error: rowError.message
        });
      }
    }
    
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Processed ${results.total} records. ${results.success.length} succeeded, ${results.failed.length} failed.`,
      results
    });
    
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error in bulkCreatePayslips:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Download payslip PDF
const downloadPayslip = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT p.*, u.email, ep.first_name, ep.last_name, ep.department, ep.position,
              ep.employee_code
       FROM payslips p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    const payslip = result.rows[0];
    
    if (req.user.role !== 'admin' && payslip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const pdfBuffer = await PDFGenerator.generatePayslip(payslip, payslip);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payslip.employee_number || payslip.employee_code}_${payslip.pay_period_start}_to_${payslip.pay_period_end}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating payslip PDF:', error);
    res.status(500).json({ error: 'Error generating PDF: ' + error.message });
  }
};

module.exports = {
  createPayslip,
  getPayslips,
  getPayslipById,
  updatePayslip,
  deletePayslip,
  getAvailablePayPeriods,
  bulkCreatePayslips,
  downloadPayslip
};