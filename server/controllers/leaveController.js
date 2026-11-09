const pool = require('../config/database');
const { countDays, applyLeaveBalanceChange } = require('../utils/leaveBalance');
const { isSupervisorReady, notDeleted } = require('../utils/schema');
const { supervisorsOfDepartment, isSupervisor } = require('../utils/supervisors');
const { rangeOfPeriod } = require('../utils/cutoff');
const { notify, notifyMany } = require('../utils/notify');

// Supervisors who must approve a request from `userId` (in `department`) before the
// admin sees it. Empty means it goes straight to the admin: nobody supervises the
// department, or the requester is a supervisor themselves. Never throws; on any
// problem the old behaviour (straight to admin) applies.
const findApprovingSupervisors = async (userId, department) => {
  if (!isSupervisorReady()) return [];
  try {
    if (await isSupervisor(pool, userId)) return [];
    return await supervisorsOfDepartment(pool, department, userId);
  } catch (error) {
    console.error('Could not look up supervisors, sending request to admin:', error.message);
    return [];
  }
};

const employeeName = async (userId) => {
  try {
    const r = await pool.query(
      `SELECT first_name, last_name FROM employee_profiles WHERE user_id = $1`,
      [userId]
    );
    const row = r.rows[0];
    return row ? `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'An employee' : 'An employee';
  } catch (error) {
    return 'An employee';
  }
};

// Joins that add the deciding supervisor's name to list queries (only once the column exists).
const supervisorSelect = () =>
  isSupervisorReady()
    ? `, sp.first_name AS supervisor_first_name, sp.last_name AS supervisor_last_name`
    : '';
const supervisorJoin = () =>
  isSupervisorReady() ? ` LEFT JOIN employee_profiles sp ON sp.user_id = lr.supervisor_id` : '';

// 400 response when approving WITH PAY would take more days than the employee has.
// Same shape the approval flow has always returned.
const respondInsufficientBalance = (res, error) => {
  const d = error.details;
  return res.status(400).json({
    error: 'Cannot approve WITH PAY due to insufficient balance',
    message: `Employee only has ${d.available} days available for ${d.leave_type}. Please approve WITHOUT PAY instead.`,
    details: d
  });
};

// Helper function to get file URL (for Render)
const getFileUrl = (filename) => {
  if (!filename) return null;
  // For local development
  if (process.env.NODE_ENV !== 'production') {
    return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/medical-certificates/${filename}`;
  }
  // For Render - you'll need to serve static files
  return `/uploads/medical-certificates/${filename}`;
};

// Get leave balances for current user (employee)
const getMyLeaveBalances = async (req, res) => {
  const userId = req.user.id;
  const year = req.query.year || new Date().getFullYear();
  
  try {
    const result = await pool.query(
      `SELECT * FROM leave_balances 
       WHERE user_id = $1 AND year = $2`,
      [userId, year]
    );
    
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO leave_balances (user_id, year, vacation_leave, sick_leave, emergency_leave)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, year, 15, 10, 5]
      );
      return res.json(insertResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting leave balances:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leave balances for a specific user (admin)
const getUserLeaveBalances = async (req, res) => {
  const { userId } = req.params;
  const year = req.query.year || new Date().getFullYear();
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  try {
    const userCheck = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let result = await pool.query(
      `SELECT * FROM leave_balances 
       WHERE user_id = $1 AND year = $2`,
      [userId, year]
    );
    
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO leave_balances (user_id, year, vacation_leave, sick_leave, emergency_leave, special_leave)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, year, 15, 10, 5, 0]
      );
      return res.json(insertResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user leave balances:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update leave balances (admin)
const updateLeaveBalances = async (req, res) => {
  const { userId } = req.params;
  const { vacation_leave, sick_leave, emergency_leave, special_leave, year } = req.body;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  try {
    const existing = await pool.query(
      `SELECT id FROM leave_balances 
       WHERE user_id = $1 AND year = $2`,
      [userId, year]
    );
    
    let result;
    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO leave_balances (user_id, year, vacation_leave, sick_leave, emergency_leave, special_leave)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, year, vacation_leave || 0, sick_leave || 0, emergency_leave || 0, special_leave || 0]
      );
    } else {
      result = await pool.query(
        `UPDATE leave_balances 
         SET vacation_leave = $1, 
             sick_leave = $2, 
             emergency_leave = $3, 
             special_leave = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5 AND year = $6
         RETURNING *`,
        [vacation_leave || 0, sick_leave || 0, emergency_leave || 0, special_leave || 0, userId, year]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating leave balances:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get my leave requests (employee)
const getMyLeaveRequests = async (req, res) => {
  const userId = req.user.id;
  const { status, year, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT lr.*, 
       lr.regular_days_off,
       TO_CHAR(lr.start_date, 'YYYY-MM-DD') as start_date,
             TO_CHAR(lr.end_date, 'YYYY-MM-DD') as end_date,
             TO_CHAR(lr.original_start_date, 'YYYY-MM-DD') as original_start_date,
             TO_CHAR(lr.original_end_date, 'YYYY-MM-DD') as original_end_date,
             TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             TO_CHAR(lr.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
             ${supervisorSelect()}
      FROM leave_requests lr
      ${supervisorJoin()}
      WHERE lr.user_id = $1${notDeleted('lr')}
    `;
    const values = [userId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    if (year) {
      query += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramCount}`;
      values.push(year);
      paramCount++;
    }
    
    query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    let countQuery = `SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_id = $1${notDeleted('lr')}`;
    const countValues = [userId];
    let countParamCount = 2;
    
    if (status) {
      countQuery += ` AND lr.status = $${countParamCount}`;
      countValues.push(status);
    }
    
    if (year) {
      countQuery += ` AND EXTRACT(YEAR FROM lr.start_date) = $${countParamCount}`;
      countValues.push(year);
    }
    
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      leaveRequests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting leave requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/// Create leave request (employee)
const createLeaveRequest = async (req, res) => {
  const { leave_type, start_date, end_date, reason, leave_pay_type } = req.body;
  const userId = req.user.id;
  
  // Handle Cloudinary file upload
  let medicalCertUrl = null;
  let medicalCertFilename = null;
  let medicalCertSize = null;
  let medicalCertType = null;
  
  if (req.file) {
    // Cloudinary returns the URL directly
    medicalCertUrl = req.file.path; // Cloudinary URL
    medicalCertFilename = req.file.originalname;
    medicalCertSize = req.file.size;
    medicalCertType = req.file.mimetype;
  }
  
  const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const employee = await client.query(
      `SELECT ep.hire_date, ep.employment_status, ep.probationary_end_date, ep.department, u.is_active
       FROM employee_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.user_id = $1`,
      [userId]
    );
    
    if (employee.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const emp = employee.rows[0];
    const supervisors = await findApprovingSupervisors(userId, emp.department);
    const initialStatus = supervisors.length > 0 ? 'pending_supervisor' : 'pending';
    const isProbationary = emp.employment_status === 'probationary';
    
    const finalPayType = 'without_pay';
    
    let hasSufficientBalance = true;
    let currentBalance = 0;
    let balanceWarning = null;
    
    if (!isProbationary) {
      const year = new Date(start_date).getFullYear();
      const balance = await client.query(
        `SELECT * FROM leave_balances 
         WHERE user_id = $1 AND year = $2`,
        [userId, year]
      );
      
      if (leave_type === 'Vacation Leave') {
        currentBalance = balance.rows[0]?.vacation_leave || 0;
      } else if (leave_type === 'Sick Leave') {
        currentBalance = balance.rows[0]?.sick_leave || 0;
      } else if (leave_type === 'Emergency Leave') {
        currentBalance = balance.rows[0]?.emergency_leave || 0;
      } else if (leave_type === 'Special Leave') {
        currentBalance = balance.rows[0]?.special_leave || 0;
      }
      
      if (currentBalance < days) {
        hasSufficientBalance = false;
        balanceWarning = `Note: You only have ${currentBalance} days available. Admin may need to approve as "Without Pay".`;
      }
    }
    
const result = await client.query(
  `INSERT INTO leave_requests (
    user_id, leave_type, start_date, end_date, reason, status, 
    leave_pay_type, medical_certificate_url, medical_certificate_filename,
    medical_certificate_size, medical_certificate_type, regular_days_off
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  RETURNING *`,
  [userId, leave_type, start_date, end_date, reason, initialStatus, finalPayType, 
   medicalCertUrl, medicalCertFilename, medicalCertSize, medicalCertType, req.body.regular_days_off || null]
);
    
    await client.query('COMMIT');

    if (supervisors.length > 0) {
      const name = await employeeName(userId);
      await notifyMany(
        supervisors,
        'leave_supervisor',
        'Leave request needs your approval',
        `${name} requested ${leave_type} from ${start_date} to ${end_date}.`
      );
    }
    
    let successMessage = 'Leave request submitted successfully!';
    let warningMessage = null;
    
    if (!hasSufficientBalance) {
      warningMessage = balanceWarning;
      successMessage = 'Leave request submitted, but you have insufficient balance. Admin will review and may approve as "Without Pay".';
    } else if (isProbationary) {
      warningMessage = 'As a probationary employee, admin will decide if your leave is with or without pay upon approval.';
    } else {
      successMessage = 'Leave request submitted successfully! Admin will determine pay type upon approval.';
    }
    if (supervisors.length > 0) {
      successMessage = 'Leave request submitted! Your department supervisor will review it first, then the admin.';
    }
    
    res.status(201).json({
      success: true,
      message: successMessage,
      warning: warningMessage,
      leaveRequest: result.rows[0],
      isProbationary,
      awaitingSupervisor: supervisors.length > 0,
      hasSufficientBalance,
      currentBalance: hasSufficientBalance ? currentBalance : null,
      daysRequested: days
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Get all leave requests (admin)
const getAllLeaveRequests = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { page = 1, limit = 20, status, department, search, period, sort } = req.query;
  const offset = (page - 1) * limit;

  // Cutoff period filter (by leave start date), e.g. period=2026-11-A
  let periodRange = null;
  if (period) {
    periodRange = rangeOfPeriod(period);
    if (!periodRange) {
      return res.status(400).json({ error: 'Invalid cutoff period' });
    }
  }

  try {
    // Build the filters once so the list query and the count query always agree
    let filters = '';
    const filterValues = [];

    if (status === 'deleted') {
      // The admin's "Deleted" filter: only hidden requests, whatever their status was
      filters += isSupervisorReady() ? ' AND lr.deleted_at IS NOT NULL' : ' AND 1=0';
    } else {
      filters += notDeleted('lr');
      if (status) {
        filterValues.push(status);
        filters += ` AND lr.status = $${filterValues.length}`;
      }
    }

    if (department) {
      filterValues.push(department);
      filters += ` AND ep.department = $${filterValues.length}`;
    }

    if (periodRange) {
      filterValues.push(periodRange.start, periodRange.end);
      filters += ` AND lr.start_date BETWEEN $${filterValues.length - 1}::date AND $${filterValues.length}::date`;
    }

    if (search) {
      filterValues.push(`%${search}%`);
      const p = filterValues.length;
      filters += ` AND (ep.first_name ILIKE $${p} OR ep.last_name ILIKE $${p} OR ep.employee_code ILIKE $${p})`;
    }

    const fromClause = `
      FROM leave_requests lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      ${supervisorJoin()}
      WHERE 1=1${filters}
    `;

    const result = await pool.query(
      `SELECT lr.*,
       lr.regular_days_off,
       u.email,
             ep.first_name, ep.last_name, ep.employee_code, ep.department,
             TO_CHAR(lr.start_date, 'YYYY-MM-DD') as start_date,
             TO_CHAR(lr.end_date, 'YYYY-MM-DD') as end_date,
             TO_CHAR(lr.original_start_date, 'YYYY-MM-DD') as original_start_date,
             TO_CHAR(lr.original_end_date, 'YYYY-MM-DD') as original_end_date,
             TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             TO_CHAR(lr.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
             ${supervisorSelect()}
      ${fromClause}
      ORDER BY ${sort === 'start_date' ? 'lr.start_date DESC, lr.created_at DESC' : 'lr.created_at DESC'} LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}`,
      [...filterValues, limit, offset]
    );

    const countResult = await pool.query(`SELECT COUNT(*) ${fromClause}`, filterValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      leaveRequests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all leave requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a leave request (admin). It is hidden, not erased, so it can be restored:
// it disappears from every list and count and the leave days it used are returned.
// Deleting is quiet: the employee is not notified.
const deleteLeaveRequest = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  if (!isSupervisorReady()) {
    return res.status(503).json({ error: 'Deleting leave requests is not available yet. Please try again in a few minutes.' });
  }

  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query(
      `SELECT * FROM leave_requests WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [id]
    );
    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    const before = found.rows[0];

    await client.query(
      `UPDATE leave_requests
       SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, req.user.id]
    );

    // A deleted request costs nothing: return the days an approved with-pay request used
    const balanceChange = await applyLeaveBalanceChange(client, before, { ...before, status: 'deleted' });

    await client.query('COMMIT');

    let message = 'Leave request deleted. You can restore it from the Deleted filter.';
    if (balanceChange.refunded) {
      message += ` ${balanceChange.refunded.days} day(s) returned to the ${balanceChange.refunded.leaveType} balance.`;
    }
    res.json({ success: true, message, refunded: balanceChange.refunded });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error deleting leave request:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Restore a deleted leave request (admin). If it was approved with pay, the days
// are taken from the balance again; when the balance no longer covers them the
// restore is refused and nothing changes.
const restoreLeaveRequest = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  if (!isSupervisorReady()) {
    return res.status(503).json({ error: 'Restoring leave requests is not available yet. Please try again in a few minutes.' });
  }

  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query(
      `SELECT * FROM leave_requests WHERE id = $1 AND deleted_at IS NOT NULL FOR UPDATE`,
      [id]
    );
    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Deleted leave request not found' });
    }

    const result = await client.query(
      `UPDATE leave_requests
       SET deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    const balanceChange = await applyLeaveBalanceChange(
      client,
      { ...found.rows[0], status: 'deleted' },
      result.rows[0]
    );

    await client.query('COMMIT');

    let message = 'Leave request restored.';
    if (balanceChange.deducted) {
      message += ` ${balanceChange.deducted.days} day(s) deducted from the ${balanceChange.deducted.leaveType} balance again.`;
    }
    res.json({ success: true, message, leaveRequest: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === 'INSUFFICIENT_BALANCE') {
      const d = error.details;
      return res.status(400).json({
        error: 'Cannot restore: not enough leave balance',
        message: `The employee now has only ${d.available} day(s) of ${d.leave_type}, but this request needs ${d.requested} day(s) with pay. Add days to their leave balance first, then restore it.`,
        details: d
      });
    }
    console.error('Error restoring leave request:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Update leave request status (admin approve/reject)
const updateLeaveRequestStatus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  const { 
    status, 
    comments, 
    leave_pay_type, 
    medical_certificate, 
    approval_notes,
    start_date,
    end_date,
    adjustment_reason,
    dates_adjusted_by_admin
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const leaveRequest = await client.query(
      `SELECT * FROM leave_requests WHERE id = $1${notDeleted()} FOR UPDATE`,
      [id]
    );

    if (leaveRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const leave = leaveRequest.rows[0];
    
    // Dates used for the day count shown in the response message
    const finalStartDate = start_date || leave.start_date;
    const finalEndDate = end_date || leave.end_date;
    const days = countDays(finalStartDate, finalEndDate);
    
    // Filled in after the update: whether days were deducted and what the
    // balance was when it was checked
    let deductionHappened = false;
    let currentBalance = 0;
    
    // ===== ===== ===== ===== ===== ===== ===== ===== =====
    // ===== Continue with existing update logic =====
    // ===== ===== ===== ===== ===== ===== ===== ===== =====
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    // Always update leave_pay_type with the admin's selection
    const newPayType = leave_pay_type || 'without_pay';
    updateFields.push(`leave_pay_type = $${paramCount}`);
    updateValues.push(newPayType);
    paramCount++;
    
    updateFields.push(`status = $${paramCount}`);
    updateValues.push(status);
    paramCount++;
    
    updateFields.push(`approved_by = $${paramCount}`);
    updateValues.push(req.user.id);
    paramCount++;

    // Admin decided before the supervisor did: keep a record of the override
    if (isSupervisorReady() && leave.status === 'pending_supervisor' && status !== 'pending_supervisor') {
      updateFields.push(`admin_override = true`);
    }
    
    // If dates are being adjusted, store original dates first
    if (start_date || end_date) {
      if (!leave.original_start_date && !leave.original_end_date) {
        updateFields.push(`original_start_date = $${paramCount}`);
        updateValues.push(leave.start_date);
        paramCount++;
        
        updateFields.push(`original_end_date = $${paramCount}`);
        updateValues.push(leave.end_date);
        paramCount++;
      }
      
      if (start_date) {
        updateFields.push(`start_date = $${paramCount}`);
        updateValues.push(start_date);
        paramCount++;
      }
      
      if (end_date) {
        updateFields.push(`end_date = $${paramCount}`);
        updateValues.push(end_date);
        paramCount++;
      }
      
      updateFields.push(`dates_adjusted_by_admin = $${paramCount}`);
      updateValues.push(true);
      paramCount++;
    }
    
    if (adjustment_reason) {
      updateFields.push(`adjustment_reason = $${paramCount}`);
      updateValues.push(adjustment_reason);
      paramCount++;
    }
    
    if (comments !== undefined) {
      updateFields.push(`comments = $${paramCount}`);
      updateValues.push(comments);
      paramCount++;
    }
    
    if (medical_certificate !== undefined) {
      updateFields.push(`medical_certificate = $${paramCount}`);
      updateValues.push(medical_certificate);
      paramCount++;
      if (medical_certificate) {
        updateFields.push(`medical_certificate_submitted = false`);
      }
    }
    
    if (approval_notes !== undefined) {
      updateFields.push(`approval_notes = $${paramCount}`);
      updateValues.push(approval_notes);
      paramCount++;
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);
    
    const result = await client.query(
      `UPDATE leave_requests 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );
    
    // Bring the leave balance in line with what this change did to the request:
    // days deducted for the old state are returned, days for the new state are
    // deducted. Same transaction, so an insufficient balance undoes the update.
    const balanceChange = await applyLeaveBalanceChange(client, leave, result.rows[0]);
    deductionHappened = !!balanceChange.deducted;
    currentBalance = balanceChange.available ?? 0;

    await client.query('COMMIT');

    if (status === 'approved' || status === 'rejected') {
      await notify(
        leave.user_id,
        'leave_status',
        `Leave request ${status}`,
        `Your ${leave.leave_type} request has been ${status} by the admin.`
      );
    }

    // Custom success message
    let successMessage = `Leave request ${status} successfully`;
    const adminSelectedPayType = leave_pay_type || result.rows[0].leave_pay_type;
    
    if (status === 'approved') {
      if (adminSelectedPayType === 'without_pay') {
        successMessage = `Leave request approved WITHOUT PAY - no leave balance deducted`;
      } else if (adminSelectedPayType === 'with_pay') {
        if (deductionHappened) {
          successMessage = `Leave request approved WITH PAY - ${days} day(s) deducted from ${leave.leave_type}`;
        } else {
          successMessage = `Leave request approved WITH PAY - but no balance was deducted`;
        }
      }
    }
    
    if (start_date || end_date) {
      successMessage += ` Dates have been adjusted.`;
    }

    if (balanceChange.refunded) {
      successMessage += ` ${balanceChange.refunded.days} day(s) returned to the ${balanceChange.refunded.leaveType} balance.`;
    }

    res.json({
      success: true,
      message: successMessage,
      leaveRequest: result.rows[0],
      balanceInfo: {
        available: currentBalance,
        requested: days,
        leave_type: leave.leave_type,
        was_deducted: deductionHappened
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === 'INSUFFICIENT_BALANCE') {
      return respondInsufficientBalance(res, error);
    }
    console.error('Error updating leave request status:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};


// Edit leave request (employee only for pending requests, admin can edit any)
const editLeaveRequest = async (req, res) => {
  const { id } = req.params;
  const { leave_type, start_date, end_date, reason, medical_certificate, with_pay, status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const isAdmin = userRole === 'admin';
  
  try {
    // Check if leave request exists
    const leaveRequest = await pool.query(
      `SELECT * FROM leave_requests WHERE id = $1${notDeleted()}`,
      [id]
    );
    
    if (leaveRequest.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const request = leaveRequest.rows[0];
    const isOwner = request.user_id === userId;
    
    // Check permissions
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // For employees: only allow editing of requests still waiting for a decision
    // (with the supervisor, or with the admin)
    const EMPLOYEE_EDITABLE = ['pending', 'pending_supervisor'];
    if (!isAdmin && !EMPLOYEE_EDITABLE.includes(request.status)) {
      return res.status(400).json({ error: 'Cannot edit approved or rejected requests' });
    }

    // A change to dates or leave type after the supervisor already approved means
    // the supervisor approved something different, so it goes back to them
    // (when the department still has one).
    const materialChange =
      (leave_type && leave_type !== request.leave_type) ||
      (start_date && countDays(request.start_date, start_date) !== 1) ||
      (end_date && countDays(request.end_date, end_date) !== 1);
    let resetToSupervisors = [];
    if (!isAdmin && request.status === 'pending' && request.supervisor_decision === 'approved' && materialChange) {
      const dept = await pool.query(
        `SELECT department FROM employee_profiles WHERE user_id = $1`,
        [request.user_id]
      );
      resetToSupervisors = await findApprovingSupervisors(request.user_id, dept.rows[0]?.department);
    }
    
    // Validate dates if provided
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      
      if (end < start) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // In editLeaveRequest function, add file handling
if (req.file) {
  updateFields.push(`medical_certificate_url = $${paramCount}`);
  values.push(req.file.path);
  paramCount++;
  
  updateFields.push(`medical_certificate_filename = $${paramCount}`);
  values.push(req.file.originalname);
  paramCount++;
  
  updateFields.push(`medical_certificate_size = $${paramCount}`);
  values.push(req.file.size);
  paramCount++;
  
  updateFields.push(`medical_certificate_type = $${paramCount}`);
  values.push(req.file.mimetype);
  paramCount++;
}
    
    if (leave_type) {
      updateFields.push(`leave_type = $${paramCount}`);
      values.push(leave_type);
      paramCount++;
    }
    
    if (start_date) {
      updateFields.push(`start_date = $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      updateFields.push(`end_date = $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (req.body.regular_days_off !== undefined) {
  updateFields.push(`regular_days_off = $${paramCount}`);
  values.push(req.body.regular_days_off || null);
  paramCount++;
}
    
    if (reason !== undefined) {
      updateFields.push(`reason = $${paramCount}`);
      values.push(reason);
      paramCount++;
    }
    
    if (medical_certificate !== undefined) {
      updateFields.push(`medical_certificate = $${paramCount}`);
      values.push(medical_certificate);
      paramCount++;
    }
    
    // Admin can edit pay type and status even for approved requests
    if (isAdmin) {
      if (with_pay !== undefined) {
        updateFields.push(`leave_pay_type = $${paramCount}`);
        values.push(with_pay ? 'with_pay' : 'without_pay');
        paramCount++;
      }
      
      const allowedStatuses = isSupervisorReady()
        ? ['pending', 'approved', 'rejected', 'pending_supervisor']
        : ['pending', 'approved', 'rejected'];
      if (status && allowedStatuses.includes(status)) {
        updateFields.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
        
        // If setting back to pending, clear approval fields
        if (status === 'pending' || status === 'pending_supervisor') {
          updateFields.push(`approved_by = NULL`);
          updateFields.push(`approval_notes = NULL`);
        }
        if (isSupervisorReady()) {
          if (status === 'pending_supervisor') {
            // Back to the supervisor: forget the earlier supervisor decision and override
            updateFields.push(`supervisor_id = NULL`, `supervisor_decision = NULL`,
              `supervisor_notes = NULL`, `supervisor_decided_at = NULL`, `admin_override = false`);
          } else if (request.status === 'pending_supervisor' && (status === 'approved' || status === 'rejected')) {
            updateFields.push(`admin_override = true`);
          }
        }
      }
      
      // Add admin audit note
      updateFields.push(`admin_notes = COALESCE(admin_notes, '') || $${paramCount}`);
      values.push(`\n[Edited on ${new Date().toLocaleString()} by ${req.user.email}]: Leave details updated`);
      paramCount++;
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    // Update and balance adjustment happen in one transaction: if the new state
    // is WITH PAY without enough days, nothing is saved.
    const client = await pool.connect();
    let result;
    let balanceChange;
    try {
      await client.query('BEGIN');

      const locked = await client.query(
        `SELECT * FROM leave_requests WHERE id = $1${notDeleted()} FOR UPDATE`,
        [id]
      );
      if (locked.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Leave request not found' });
      }

      // Employees can only edit while it is still waiting; re-check on the locked row
      if (!isAdmin && !EMPLOYEE_EDITABLE.includes(locked.rows[0].status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot edit approved or rejected requests' });
      }
      if (resetToSupervisors.length > 0 && locked.rows[0].status === 'pending') {
        updateFields.push(`status = 'pending_supervisor'`, `supervisor_id = NULL`,
          `supervisor_decision = NULL`, `supervisor_notes = NULL`, `supervisor_decided_at = NULL`);
      } else {
        resetToSupervisors = [];
      }

      result = await client.query(
        `UPDATE leave_requests
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      balanceChange = await applyLeaveBalanceChange(client, locked.rows[0], result.rows[0]);

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    if (resetToSupervisors.length > 0) {
      const name = await employeeName(request.user_id);
      await notifyMany(
        resetToSupervisors,
        'leave_supervisor',
        'Leave request changed - needs your approval again',
        `${name} changed their ${result.rows[0].leave_type} request after you approved it.`
      );
    }

    let successMessage = 'Leave request updated successfully';
    if (resetToSupervisors.length > 0) {
      successMessage = 'Leave request updated. Because the dates or type changed, your supervisor needs to approve it again';
    } else if (isAdmin && request.status === 'approved') {
      successMessage = 'Leave request updated successfully (admin override)';
    }
    if (balanceChange.refunded) {
      successMessage += `. ${balanceChange.refunded.days} day(s) returned to the ${balanceChange.refunded.leaveType} balance`;
    }
    if (balanceChange.deducted) {
      successMessage += `. ${balanceChange.deducted.days} day(s) deducted from the ${balanceChange.deducted.leaveType} balance`;
    }

    res.json({
      success: true,
      message: successMessage,
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      return respondInsufficientBalance(res, error);
    }
    console.error('Error editing leave request:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const adminEditLeaveRequest = async (req, res) => {  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  const { 
    leave_type, 
    start_date, 
    end_date, 
    reason, 
    leave_pay_type, 
    status, 
    medical_certificate, 
    approval_notes, 
    regular_days_off 
  } = req.body;

  
  // Update and balance adjustment happen in one transaction: if the new state
  // is WITH PAY without enough days, nothing is saved.
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const locked = await client.query(
      `SELECT * FROM leave_requests WHERE id = $1${notDeleted()} FOR UPDATE`,
      [id]
    );
    if (locked.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Admin decided before the supervisor did: keep a record of the override
    const overrideClause =
      isSupervisorReady() && locked.rows[0].status === 'pending_supervisor' &&
      (status === 'approved' || status === 'rejected')
        ? `admin_override = true,`
        : '';

    const result = await client.query(
      `UPDATE leave_requests
       SET ${overrideClause}
           leave_type = $1,
           start_date = $2,
           end_date = $3,
           reason = $4,
           leave_pay_type = $5,
           status = $6,
           medical_certificate = COALESCE($7, medical_certificate),
           approval_notes = COALESCE($8, approval_notes),
           regular_days_off = COALESCE($9, regular_days_off),
           admin_notes = COALESCE(admin_notes, '') || $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        leave_type,
        start_date,
        end_date,
        reason,
        leave_pay_type,  // This should be "with_pay"
        status,
        medical_certificate,
        approval_notes,
        regular_days_off || null,
        `\n[Admin edited on ${new Date().toLocaleString()}]: Leave details updated`,
        id
      ]
    );

    const balanceChange = await applyLeaveBalanceChange(client, locked.rows[0], result.rows[0]);

    await client.query('COMMIT');

    let message = 'Leave request updated successfully';
    if (balanceChange.refunded) {
      message += `. ${balanceChange.refunded.days} day(s) returned to the ${balanceChange.refunded.leaveType} balance`;
    }
    if (balanceChange.deducted) {
      message += `. ${balanceChange.deducted.days} day(s) deducted from the ${balanceChange.deducted.leaveType} balance`;
    }

    res.json({
      success: true,
      message,
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === 'INSUFFICIENT_BALANCE') {
      return respondInsufficientBalance(res, error);
    }
    console.error('Error in admin edit leave request:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Add admin_notes column if not exists (run this once)
const ensureAdminNotesColumn = async () => {
  try {
    await pool.query(`
      ALTER TABLE leave_requests 
      ADD COLUMN IF NOT EXISTS admin_notes TEXT
    `);
  } catch (error) {
    console.error('Error adding admin_notes column:', error);
  }
};

// Call this when the module loads
ensureAdminNotesColumn();

module.exports = {
  getMyLeaveBalances,
  getUserLeaveBalances,
  updateLeaveBalances,
  getMyLeaveRequests,
  createLeaveRequest,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  editLeaveRequest,
  adminEditLeaveRequest,
  deleteLeaveRequest,
  restoreLeaveRequest
};