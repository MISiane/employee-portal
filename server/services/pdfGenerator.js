const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFGenerator {
  static async generatePayslip(payslipData, employeeData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 0
        });

        const buffers = [];
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const path = require('path');

const logoPath = path.join(__dirname, 'lemonet logo.png');
const preparedSigPath = path.join(__dirname, 'meg ryan f. daza.png');
const approvedSigPath = path.join(__dirname, 'romualdo r. santos.png');

        const PAGE_W = 841.89;
        const PAGE_H = 595.28;

        const num = (v) => {
          const n = parseFloat(v);
          return Number.isFinite(n) ? n : 0;
        };

        const money = (v) =>
          num(v).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

        const safeText = (v, fallback = '0') => {
          const s = String(v ?? '').trim();
          return s || fallback;
        };

        const fullName =
          safeText(
            payslipData.employee_name ||
              `${payslipData.first_name || employeeData?.first_name || ''} ${payslipData.last_name || employeeData?.last_name || ''}`.trim(),
            '0'
          );

        const department = safeText(
          payslipData.department || employeeData?.department,
          '0'
        );

        const empNo = safeText(
          payslipData.employee_number ||
            employeeData?.employee_code ||
            employeeData?.employee_number,
          '1'
        );

        const monthly = num(
          payslipData.basic_salary_monthly ||
            payslipData.monthly_salary ||
            employeeData?.monthly_salary
        );

        const semiMonthly = num(
          payslipData.basic_salary_semi_monthly ||
            payslipData.semi_monthly_salary ||
            (monthly ? monthly / 2 : 0)
        );

        const daily = num(
          payslipData.basic_salary_daily ||
            payslipData.daily_salary ||
            employeeData?.daily_salary
        );

        const hourly = num(
          payslipData.basic_salary_hourly ||
            payslipData.hourly_salary ||
            employeeData?.hourly_salary
        );

        const absencesAmount = num(payslipData.absences_amount);
        const paidLeaveAmount = num(payslipData.paid_leave_amount);
        const lateUndertimeAmount = num(payslipData.late_undertime_amount);
        const nightDiffAmount = num(payslipData.night_differential_amount);
        const nightDiffOT = num(payslipData.night_differential_ot_amount);
        const otRegular = num(payslipData.ot_regular_amount);
        const otRestdaySpecial =
          num(payslipData.ot_restday_amount) + num(payslipData.ot_special_holiday_amount);
        const otRegularHoliday = num(payslipData.ot_regular_holiday_amount);
        const restdayDuty = num(payslipData.restday_duty_amount);
        const adjustment = num(payslipData.adjustment_amount);
        const holiday100 = num(payslipData.holiday_premium_100_amount);
        const holiday30 = num(payslipData.holiday_premium_30_amount);

        const sss = num(payslipData.sss_deduction);
        const philhealth = num(payslipData.philhealth_deduction);
        const pagibig = num(payslipData.pagibig_deduction);
        const cashAdvance = num(payslipData.cash_advance);
        const pagibigLoan = num(payslipData.pagibig_loan);
        const hmo = num(payslipData.hmo_deduction);
        const incomeTax = num(payslipData.income_tax);
        const sssLoan = num(payslipData.sss_loan);
        const others = num(payslipData.other_deductions);
        const employeeLedger = num(payslipData.employee_ledger);
        const allowance = num(payslipData.allowance_amount);
        const daysPresent = num(payslipData.days_present);

        const totalDeductions = num(
          payslipData.total_deductions ||
            sss +
              philhealth +
              pagibig +
              cashAdvance +
              pagibigLoan +
              hmo +
              incomeTax +
              sssLoan +
              others +
              employeeLedger
        );

        const grossSalary = num(
          payslipData.gross_salary ||
            semiMonthly -
              absencesAmount -
              lateUndertimeAmount +
              paidLeaveAmount +
              nightDiffAmount +
              nightDiffOT +
              otRegular +
              otRestdaySpecial +
              otRegularHoliday +
              restdayDuty +
              adjustment +
              holiday100 +
              holiday30
        );

        const netPay = num(
          payslipData.net_salary ||
            payslipData.net_amount ||
            grossSalary - totalDeductions + allowance
        );

        const payPeriodText = (() => {
          if (!payslipData.pay_period_start || !payslipData.pay_period_end) return 'MARCH 11-25, 2026';
          const s = new Date(payslipData.pay_period_start);
          const e = new Date(payslipData.pay_period_end);
          if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 'MARCH 11-25, 2026';
          const month = e.toLocaleString('en-US', { month: 'long' }).toUpperCase();
          return `${month} ${s.getDate()}-${e.getDate()}, ${e.getFullYear()}`;
        })();

        const text = (value, x, y, opts = {}) => {
          doc
            .font(opts.font || 'Helvetica')
            .fontSize(opts.size || 8)
            .fillColor(opts.color || '#111')
            .text(String(value ?? ''), x, y, {
              width: opts.width,
              align: opts.align || 'left',
              lineBreak: opts.lineBreak ?? false
            });
        };

        const rect = (x, y, w, h, fill = null, lineWidth = 0.6, strokeColor = '#707070') => {
          doc.save();
          if (fill) {
            doc.fillColor(fill).rect(x, y, w, h).fill();
          }
          doc.lineWidth(lineWidth).strokeColor(strokeColor).rect(x, y, w, h).stroke();
          doc.restore();
        };

        const line = (x1, y1, x2, y2, lineWidth = 0.55, color = '#707070') => {
          doc.save()
            .lineWidth(lineWidth)
            .strokeColor(color)
            .moveTo(x1, y1)
            .lineTo(x2, y2)
            .stroke()
            .restore();
        };

        const dottedHLine = (x, y, w, lineWidth = 0.45, color = '#8a8a8a') => {
          doc.save()
            .dash(1, { space: 2 })
            .lineWidth(lineWidth)
            .strokeColor(color)
            .moveTo(x, y)
            .lineTo(x + w, y)
            .stroke()
            .undash()
            .restore();
        };

        const imageIfExists = (path, x, y, opts = {}) => {
          try {
            if (fs.existsSync(path)) {
              doc.image(path, x, y, opts);
            }
          } catch (_) {}
        };

        const fitText = (value, x, y, width, opts = {}) => {
          const font = opts.font || 'Helvetica';
          let size = opts.size || 8;
          const minSize = opts.minSize || 6;
          doc.font(font).fontSize(size);
          while (size > minSize && doc.widthOfString(String(value ?? '')) > width) {
            size -= 0.2;
            doc.fontSize(size);
          }
          text(value, x, y, { ...opts, width, size, font });
        };

        const sectionBar = (label, x, y, w) => {
          rect(x, y, w, 18, '#d9d9d9', 0.6, '#808080');
          text(label, x + 6, y + 4, {
            font: 'Helvetica-Bold',
            size: 8.5
          });
        };

        const salaryBox = (label, value, x, y, w = 145, h = 16) => {
          text(label, x, y - 11, {
            font: 'Helvetica',
            size: 7.2,
            width: w,
            align: 'center'
          });
          rect(x, y, w, h, null, 0.6, '#707070');
          text(money(value), x, y + 4, {
            font: 'Helvetica',
            size: 7.2,
            width: w,
            align: 'center'
          });
        };

        const fieldLine = (label, value, xLabel, y, xValue, dottedWidth, valueWidth, options = {}) => {
          text(label, xLabel, y, {
            font: options.labelFont || 'Helvetica',
            size: options.labelSize || 7.3
          });

          dottedHLine(xValue, y + 10, dottedWidth, 0.45);

          fitText(value, xValue, y - 1, valueWidth || dottedWidth, {
            font: options.valueFont || 'Helvetica',
            size: options.valueSize || 7.3,
            minSize: 6.2,
            align: options.align || 'right'
          });
        };

        // BORDER
        rect(6, 6, PAGE_W - 12, PAGE_H - 12, null, 0.8, '#6d6d6d');

        // HEADER
        imageIfExists(logoPath, 24, 18, { width: 45 });

        text('LE MONET HOTEL', 122, 35, {
          font: 'Helvetica-BoldOblique',
          size: 10.5
        });

        text('Payslip for the period of', 458, 18, {
          font: 'Courier',
          size: 8
        });

        text(payPeriodText, 626, 18, {
          font: 'Helvetica',
          size: 8.5
        });

        text('EMP #', 576, 46, {
          font: 'Helvetica',
          size: 8
        });

        rect(626, 36, 150, 22, null, 0.6, '#6d6d6d');
        text(empNo, 626, 42, {
          font: 'Helvetica',
          size: 9,
          width: 150,
          align: 'center'
        });

        line(20, 66, 780, 66, 0.6, '#757575');

        // EMPLOYEE INFO
        text('EMPLOYEE', 22, 77, { font: 'Helvetica', size: 7.2 });
        text(fullName, 98, 76, {
          font: 'Helvetica-Bold',
          size: 8,
          width: 150,
          align: 'left'
        });
        dottedHLine(98, 88, 200);

        text('DEPARTMENT', 22, 98, { font: 'Helvetica', size: 7.2 });
        text(department, 98, 97, {
          font: 'Helvetica-Bold',
          size: 8,
          width: 150,
          align: 'left'
        });
        dottedHLine(98, 109, 200);

        text('NO. OF DAYS PRESENT', 520, 98, {
          font: 'Helvetica-Bold',
          size: 7.4
        });
        text(money(daysPresent), 678, 97, {
          font: 'Helvetica',
          size: 8,
          width: 56,
          align: 'center'
        });
        dottedHLine(673, 109, 57);

        // SALARY
        const salaryBarY = 112;
        const salaryBarH = 18;

        sectionBar('SALARY', 20, salaryBarY, 760);

        salaryBox('Monthly', monthly, 20, 146, 140, 16);
        salaryBox('Semi-monthly', semiMonthly, 160, 146, 140, 16);
        salaryBox('DAILY', '505.00', 20, 177, 140, 16);
        salaryBox('HOURLY', hourly, 160, 177, 140, 16);

        // EARNINGS
        const leftStartY = salaryBarY + salaryBarH + 20;
        const gapY = 22;

        fieldLine('ABSENCES', money(absencesAmount), 296, leftStartY, 455, 55, 55, { align: 'center' });
        fieldLine('PAID LEAVE (VL/SL)', money(paidLeaveAmount), 296, leftStartY + gapY, 455, 55, 55, { align: 'center' });
        fieldLine('LATE/UNDERTIME AMOUNT', money(lateUndertimeAmount), 296, leftStartY + gapY * 2, 455, 55, 55, { align: 'center' });
        fieldLine('NIGHT DIFFERENTIAL AMOUNT', money(nightDiffAmount), 296, leftStartY + gapY * 3, 455, 55, 55, { align: 'center' });
        fieldLine('NIGHT DIFFERENTIAL OT', money(nightDiffOT), 296, leftStartY + gapY * 4, 455, 55, 55, { align: 'center' });
        fieldLine('OT REGULAR', money(otRegular), 296, leftStartY + gapY * 5, 455, 55, 55, { align: 'center' });

        fieldLine('OT RESTDAY/SPECIAL HOL', money(otRestdaySpecial), 535, leftStartY, 708, 62, 62, { align: 'center' });
        fieldLine('OT REGULAR HOLIDAY', money(otRegularHoliday), 535, leftStartY + gapY, 708, 62, 62, { align: 'center' });
        fieldLine('RESTDAY DUTY', money(restdayDuty), 535, leftStartY + gapY * 2, 708, 62, 62, { align: 'center' });
        fieldLine('ADJUSTMENT', money(adjustment), 535, leftStartY + gapY * 3, 708, 62, 62, { align: 'center' });
        fieldLine('HOLIDAY PREMIUM 100%', money(holiday100), 535, leftStartY + gapY * 4, 708, 62, 62, { align: 'center' });
        fieldLine('HOLIDAY PREMIUM 30%', money(holiday30), 535, leftStartY + gapY * 5, 708, 62, 62, { align: 'center' });

        const grossY = leftStartY + (gapY * 6) + 8;

        text('GROSS SALARY', 560, grossY, {
          font: 'Helvetica-Bold',
          size: 9
        });

        dottedHLine(700, grossY + 13, 78, 0.45);

        text(money(grossSalary), 700, grossY, {
          font: 'Helvetica-Bold',
          size: 9,
          width: 78,
          align: 'center'
        });

        // DEDUCTIONS
        const deductionsStartY = grossY + 40;
        sectionBar('DEDUCTIONS', 20, deductionsStartY, 760);

        const dedY = deductionsStartY + 34;
        const dedGap = 21;

        fieldLine('SSS', money(sss), 22, dedY, 98, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('PHILHEALTH', money(philhealth), 22, dedY + dedGap, 98, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('PAG-IBIG', money(pagibig), 22, dedY + dedGap * 2, 98, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('CASH ADVANCE', money(cashAdvance), 22, dedY + dedGap * 3, 98, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('PAG-IBIG LOAN', money(pagibigLoan), 22, dedY + dedGap * 4, 98, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('HMO', money(hmo), 22, dedY + dedGap * 5, 98, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });

        fieldLine('INCOME TAX', money(incomeTax), 296, dedY, 392, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('SSS LOAN', money(sssLoan), 296, dedY + dedGap, 392, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('OTHERS', money(others), 296, dedY + dedGap * 2, 392, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });
        fieldLine('EMPLOYEE LEDGER', money(employeeLedger), 296, dedY + dedGap * 3, 392, 132, 70, { labelFont: 'Helvetica-Bold', labelSize: 7.4, align: 'center' });

        // RIGHT-SIDE TOTALS
        const totalsY = dedY + 88;
        const allowanceY = totalsY + 30;

        text('TOTAL DEDUCTIONS:', 544, totalsY, {
          font: 'Helvetica-Bold',
          size: 8.5
        });
        dottedHLine(669, totalsY + 11, 108, 0.45);
        text(money(totalDeductions), 669, totalsY - 2, {
          font: 'Helvetica-Bold',
          size: 8.5,
          width: 108,
          align: 'center'
        });

        text('ALLOWANCE', 566, allowanceY, {
          font: 'Helvetica-Bold',
          size: 8.5
        });
        dottedHLine(669, allowanceY + 11, 108, 0.45);
        text(money(allowance), 669, allowanceY - 0, {
          font: 'Helvetica-Bold',
          size: 8.5,
          width: 108,
          align: 'center'
        });

        // NET PAY
        const netPayY = dedY + (dedGap * 6) + 12;

        rect(20, netPayY, 760, 24, '#d9d9d9', 0.6, '#7a7a7a');
        line(532, netPayY, 532, netPayY + 24, 0.6, '#7a7a7a');

        text('NET PAY:', 29, netPayY + 7, {
          font: 'Helvetica-Bold',
          size: 8.8
        });

        text(money(netPay), 535, netPayY + 8, {
          font: 'Helvetica-Bold',
          size: 11,
          width: 248,
          align: 'center'
        });

        // SIGNATURES
        const signatureY = netPayY + 44;

        text('PREPARED BY:', 24, signatureY + 13, {
          font: 'Helvetica',
          size: 7.2
        });
        imageIfExists(preparedSigPath, 128, signatureY - 5, { width: 45 });
        dottedHLine(98, signatureY + 22, 202, 0.45);
        text('MEG RYAN F. DAZA', 106, signatureY + 12, {
          font: 'Helvetica',
          size: 7.2,
          width: 92,
          align: 'center'
        });

        text('APPROVED BY:', 418, signatureY + 13, {
          font: 'Helvetica',
          size: 7.2
        });
        imageIfExists(approvedSigPath, 520, signatureY - 17, { width: 140 });
        dottedHLine(498, signatureY + 22, 280, 0.45);
        text('ROMUALDO R. SANTOS', 525, signatureY + 12, {
          font: 'Helvetica',
          size: 7.2,
          width: 110,
          align: 'center'
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGenerator;