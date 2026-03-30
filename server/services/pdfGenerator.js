const PDFDocument = require('pdfkit');

class PDFGenerator {
  static async generatePayslip(payslipData, employeeData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          layout: 'portrait'
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Helper functions
        const formatCurrency = (amount) => {
          const num = parseFloat(amount) || 0;
          return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        const formatDate = (dateString) => {
          if (!dateString) return 'N/A';
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        };

        // ========== HEADER ==========
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('EMPLOYEE PORTAL', { align: 'center' })
           .fontSize(10)
           .font('Helvetica')
           .text('Official Payslip', { align: 'center' })
           .moveDown(0.5);

        // Divider line
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown(0.5);

        // ========== EMPLOYEE INFORMATION ==========
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('EMPLOYEE INFORMATION')
           .moveDown(0.3);

        doc.fontSize(9)
           .font('Helvetica');

        const employeeInfo = [
          ['Employee #:', payslipData.employee_number || employeeData.employee_code || 'N/A'],
          ['Employee Name:', `${payslipData.first_name || ''} ${payslipData.last_name || ''}`.trim() || 'N/A'],
          ['Department:', payslipData.department || 'N/A'],
          ['Position:', payslipData.position || 'N/A'],
          ['Pay Period:', `${formatDate(payslipData.pay_period_start)} - ${formatDate(payslipData.pay_period_end)}`],
          ['Pay Date:', formatDate(payslipData.pay_date)]
        ];

        let yPos = doc.y;
        employeeInfo.forEach((info, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2 === 0 ? 50 : 300;
          const rowY = yPos + (row * 18);
          doc.text(info[0], col, rowY)
             .font('Helvetica-Bold')
             .text(info[1], col + 80, rowY)
             .font('Helvetica');
        });

        doc.moveDown(2.5);

        // ========== SALARY RATES ==========
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('SALARY RATES')
           .moveDown(0.3);

        doc.fontSize(9)
           .font('Helvetica');

        const salaryRates = [
          ['Monthly:', formatCurrency(payslipData.basic_salary_monthly)],
          ['Semi-monthly:', formatCurrency(payslipData.basic_salary_semi_monthly)],
          ['Daily:', formatCurrency(payslipData.basic_salary_daily)],
          ['Hourly:', formatCurrency(payslipData.basic_salary_hourly)]
        ];

        yPos = doc.y;
        salaryRates.forEach((rate, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2 === 0 ? 50 : 250;
          const rowY = yPos + (row * 18);
          doc.text(rate[0], col, rowY)
             .text(rate[1], col + 70, rowY);
        });

        doc.moveDown(2);

        // ========== EARNINGS AND DEDUCTIONS ==========
        const startY = doc.y;
        
        // Left Column - Earnings
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('EARNINGS', 50, startY)
           .moveDown(0.3);

        doc.fontSize(8)
           .font('Helvetica');

        const earnings = [
          ['Basic Salary:', payslipData.basic_salary_semi_monthly],
          ['Paid Leave:', payslipData.paid_leave_amount],
          ['Night Differential:', payslipData.night_differential_amount],
          ['Night Diff OT:', payslipData.night_differential_ot_amount],
          ['OT Regular:', payslipData.ot_regular_amount],
          ['OT Restday/Special:', (parseFloat(payslipData.ot_restday_amount) || 0) + (parseFloat(payslipData.ot_special_holiday_amount) || 0)],
          ['OT Regular Holiday:', payslipData.ot_regular_holiday_amount],
          ['Restday Duty:', payslipData.restday_duty_amount],
          ['Holiday Premium 100%:', payslipData.holiday_premium_100_amount],
          ['Holiday Premium 30%:', payslipData.holiday_premium_30_amount],
          ['Adjustment:', payslipData.adjustment_amount],
          ['', ''],
          ['Absences:', -Math.abs(payslipData.absences_amount || 0)],
          ['Late/Undertime:', -Math.abs(payslipData.late_undertime_amount || 0)]
        ];

        let earningsY = startY + 25;
        earnings.forEach((earning) => {
          const amount = parseFloat(earning[1]) || 0;
          const prefix = amount < 0 ? '-' : '';
          const displayAmount = Math.abs(amount);
          
          doc.text(earning[0], 50, earningsY)
             .text(`${prefix}${formatCurrency(displayAmount)}`, 150, earningsY);
          earningsY += 16;
        });

        // Gross Salary
        earningsY += 5;
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .text('GROSS SALARY:', 50, earningsY)
           .text(formatCurrency(payslipData.gross_salary), 150, earningsY);

        // Right Column - Deductions
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('DEDUCTIONS', 300, startY)
           .moveDown(0.3);

        doc.fontSize(8)
           .font('Helvetica');

        const deductions = [
          ['SSS:', payslipData.sss_deduction],
          ['PhilHealth:', payslipData.philhealth_deduction],
          ['Pag-IBIG:', payslipData.pagibig_deduction],
          ['Income Tax:', payslipData.income_tax],
          ['SSS Loan:', payslipData.sss_loan],
          ['Cash Advance:', payslipData.cash_advance],
          ['Employee Ledger:', payslipData.employee_ledger],
          ['Pag-IBIG Loan:', payslipData.pagibig_loan],
          ['HMO:', payslipData.hmo_deduction],
          ['Other Deductions:', payslipData.other_deductions]
        ];

        let deductionsY = startY + 25;
        deductions.forEach((deduction) => {
          const amount = deduction[1] || 0;
          doc.text(deduction[0], 300, deductionsY)
             .text(formatCurrency(amount), 390, deductionsY);
          deductionsY += 16;
        });

        if (payslipData.other_deductions_description) {
          doc.fontSize(7)
             .text(`(${payslipData.other_deductions_description})`, 300, deductionsY - 12);
          doc.fontSize(8);
        }

        // Total Deductions
        deductionsY += 5;
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .text('TOTAL DEDUCTIONS:', 300, deductionsY)
           .text(`-${formatCurrency(payslipData.total_deductions)}`, 390, deductionsY);

        doc.moveDown(3);

        // ========== NET PAYMENT ==========
        const netY = doc.y;
        
        // Net Amount Box
        doc.rect(50, netY, 220, 55)
           .fill('#f0f9ff')
           .stroke();

        doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('NET AMOUNT', 70, netY + 12)
           .fontSize(14)
           .text(formatCurrency(payslipData.net_amount), 70, netY + 28);

        doc.fontSize(7)
           .font('Helvetica')
           .text('(Before Allowance)', 70, netY + 45);

        // Net Salary Box
        doc.rect(320, netY, 220, 55)
           .fill('#e6f7e6')
           .stroke();

        doc.fillColor('#000000')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('NET SALARY', 340, netY + 12)
           .fontSize(14)
           .text(formatCurrency(payslipData.net_salary), 340, netY + 28);

        doc.fontSize(7)
           .font('Helvetica')
           .text('(With Allowance)', 340, netY + 45);

        // Allowance Details
        if (payslipData.allowance_amount > 0) {
          doc.fontSize(8)
             .font('Helvetica')
             .text(`Allowance: ${formatCurrency(payslipData.allowance_amount)}`, 50, netY + 70);
          if (payslipData.allowance_description) {
            doc.text(`(${payslipData.allowance_description})`, 150, netY + 70);
          }
        }

        doc.moveDown(4);

        // ========== ATTENDANCE SUMMARY ==========
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('ATTENDANCE SUMMARY')
           .moveDown(0.3);

        doc.fontSize(8)
           .font('Helvetica');

        const attendanceData = [
          ['Days Present:', payslipData.days_present || 0],
          ['Days Absent:', payslipData.absences_days || 0],
          ['Days Late:', payslipData.days_late || 0]
        ];

        const attY = doc.y;
        attendanceData.forEach((item, index) => {
          doc.text(item[0], 50 + (index * 150), attY)
             .text(item[1].toString(), 50 + (index * 150) + 70, attY);
        });

        doc.moveDown(1.5);

        // ========== FOOTER ==========
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor('#666666')
           .text('This is a computer-generated document. No signature required.', 50, doc.y, { align: 'center' })
           .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.y + 12, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGenerator;