const express = require('express');
const XLSX = require('xlsx');
const multer = require('multer');
const {
  createPayslip,
  getPayslips,
  getPayslipById,
  updatePayslip,
  deletePayslip,
  bulkCreatePayslips,
  getDraftPayslips,        
  approvePayslip,          
  approveAllPayslips,     
  rejectPayslip,     
  downloadPayslip,
  getAvailablePayPeriods
 
} = require('../controllers/payslipController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(authMiddleware);

// Download PDF (specific path)
router.get('/:id/download', downloadPayslip);

// Draft payslips (specific path - MUST come before /:id)
router.get('/draft', getDraftPayslips);

// Approve all (specific path)
router.post('/approve-all', approveAllPayslips);

// Bulk upload
router.post('/bulk-upload', upload.single('file'), bulkCreatePayslips);

// Get pay periods
router.get('/pay-periods', getAvailablePayPeriods);

// Approve single (specific pattern)
router.post('/:id/approve', approvePayslip);

// Reject single (specific pattern)
router.post('/:id/reject', rejectPayslip);

// CRUD routes (dynamic - these catch any :id)
router.get('/', getPayslips);
router.get('/:id', getPayslipById);
router.post('/', createPayslip);
router.put('/:id', updatePayslip);
router.delete('/:id', deletePayslip);

// Download Excel template
function downloadTemplate(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  // Create template data
  const templateData = [
    {
      'EMPLOYEE_CODE': 'EMP001',
      'PAY_PERIOD_START': '2024-03-01',
      'PAY_PERIOD_END': '2024-03-15',
      'PAY_DATE': '2024-03-15',
      'BASIC_SALARY_MONTHLY': 30000,
      'ABSENCES_DAYS': 0,
      'ABSENCES_AMOUNT': 0,
      'PAID_LEAVE_DAYS': 0,
      'PAID_LEAVE_AMOUNT': 0,
      'LATE_UNDERTIME_AMOUNT': 0,
      'NIGHT_DIFFERENTIAL_AMOUNT': 0,
      'NIGHT_DIFFERENTIAL_OT_AMOUNT': 0,
      'OT_REGULAR_AMOUNT': 0,
      'OT_RESTDAY_AMOUNT': 0,
      'OT_SPECIAL_HOLIDAY_AMOUNT': 0,
      'OT_REGULAR_HOLIDAY_AMOUNT': 0,
      'RESTDAY_DUTY_AMOUNT': 0,
      'HOLIDAY_PREMIUM_100_AMOUNT': 0,
      'HOLIDAY_PREMIUM_30_AMOUNT': 0,
      'ADJUSTMENT_AMOUNT': 0,
      'ADJUSTMENT_DESCRIPTION': '',
      'SSS_DEDUCTION': 450,
      'PHILHEALTH_DEDUCTION': 300,
      'PAGIBIG_DEDUCTION': 200,
      'INCOME_TAX': 1500,
      'SSS_LOAN': 0,
      'CASH_ADVANCE': 0,
      'EMPLOYEE_LEDGER': 0,
      'PAGIBIG_LOAN': 0,
      'HMO_DEDUCTION': 0,
      'OTHER_DEDUCTIONS': 0,
      'OTHER_DEDUCTIONS_DESCRIPTION': '',
      'ALLOWANCE_AMOUNT': 0,
      'ALLOWANCE_DESCRIPTION': '',
      'DAYS_PRESENT': 11,
      'DAYS_LATE': 0,
      'STATUS': 'generated'
    },
    {
      'EMPLOYEE_CODE': 'EMP002',
      'PAY_PERIOD_START': '2024-03-01',
      'PAY_PERIOD_END': '2024-03-15',
      'PAY_DATE': '2024-03-15',
      'BASIC_SALARY_MONTHLY': 35000,
      'ABSENCES_DAYS': 1,
      'ABSENCES_AMOUNT': 1590.91,
      'PAID_LEAVE_DAYS': 0,
      'PAID_LEAVE_AMOUNT': 0,
      'LATE_UNDERTIME_AMOUNT': 500,
      'NIGHT_DIFFERENTIAL_AMOUNT': 0,
      'NIGHT_DIFFERENTIAL_OT_AMOUNT': 0,
      'OT_REGULAR_AMOUNT': 0,
      'OT_RESTDAY_AMOUNT': 0,
      'OT_SPECIAL_HOLIDAY_AMOUNT': 0,
      'OT_REGULAR_HOLIDAY_AMOUNT': 0,
      'RESTDAY_DUTY_AMOUNT': 0,
      'HOLIDAY_PREMIUM_100_AMOUNT': 0,
      'HOLIDAY_PREMIUM_30_AMOUNT': 0,
      'ADJUSTMENT_AMOUNT': 0,
      'ADJUSTMENT_DESCRIPTION': '',
      'SSS_DEDUCTION': 550,
      'PHILHEALTH_DEDUCTION': 350,
      'PAGIBIG_DEDUCTION': 200,
      'INCOME_TAX': 2000,
      'SSS_LOAN': 1000,
      'CASH_ADVANCE': 0,
      'EMPLOYEE_LEDGER': 0,
      'PAGIBIG_LOAN': 0,
      'HMO_DEDUCTION': 0,
      'OTHER_DEDUCTIONS': 0,
      'OTHER_DEDUCTIONS_DESCRIPTION': '',
      'ALLOWANCE_AMOUNT': 1000,
      'ALLOWANCE_DESCRIPTION': 'Transportation',
      'DAYS_PRESENT': 10,
      'DAYS_LATE': 2,
      'STATUS': 'generated'
    }
  ];
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // EMPLOYEE_CODE
    { wch: 12 }, // PAY_PERIOD_START
    { wch: 12 }, // PAY_PERIOD_END
    { wch: 12 }, // PAY_DATE
    { wch: 18 }, // BASIC_SALARY_MONTHLY
    { wch: 12 }, // ABSENCES_DAYS
    { wch: 15 }, // ABSENCES_AMOUNT
    { wch: 12 }, // PAID_LEAVE_DAYS
    { wch: 15 }, // PAID_LEAVE_AMOUNT
    { wch: 18 }, // LATE_UNDERTIME_AMOUNT
    { wch: 18 }, // NIGHT_DIFFERENTIAL_AMOUNT
    { wch: 20 }, // NIGHT_DIFFERENTIAL_OT_AMOUNT
    { wch: 15 }, // OT_REGULAR_AMOUNT
    { wch: 15 }, // OT_RESTDAY_AMOUNT
    { wch: 18 }, // OT_SPECIAL_HOLIDAY_AMOUNT
    { wch: 18 }, // OT_REGULAR_HOLIDAY_AMOUNT
    { wch: 15 }, // RESTDAY_DUTY_AMOUNT
    { wch: 18 }, // HOLIDAY_PREMIUM_100_AMOUNT
    { wch: 18 }, // HOLIDAY_PREMIUM_30_AMOUNT
    { wch: 15 }, // ADJUSTMENT_AMOUNT
    { wch: 20 }, // ADJUSTMENT_DESCRIPTION
    { wch: 12 }, // SSS_DEDUCTION
    { wch: 12 }, // PHILHEALTH_DEDUCTION
    { wch: 12 }, // PAGIBIG_DEDUCTION
    { wch: 12 }, // INCOME_TAX
    { wch: 12 }, // SSS_LOAN
    { wch: 12 }, // CASH_ADVANCE
    { wch: 12 }, // EMPLOYEE_LEDGER
    { wch: 12 }, // PAGIBIG_LOAN
    { wch: 12 }, // HMO_DEDUCTION
    { wch: 12 }, // OTHER_DEDUCTIONS
    { wch: 20 }, // OTHER_DEDUCTIONS_DESCRIPTION
    { wch: 12 }, // ALLOWANCE_AMOUNT
    { wch: 20 }, // ALLOWANCE_DESCRIPTION
    { wch: 12 }, // DAYS_PRESENT
    { wch: 12 }, // DAYS_LATE
    { wch: 12 }  // STATUS
  ];
  ws['!cols'] = colWidths;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payslip Template');
  
  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=payslip_template.xlsx');
  res.send(buffer);
}

module.exports = router;