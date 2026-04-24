const pool = require('../config/database');

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
    res.status(500).json({ error: 'Server error: ' + error.message });
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
             TO_CHAR(lr.start_date, 'YYYY-MM-DD') as start_date,
             TO_CHAR(lr.end_date, 'YYYY-MM-DD') as end_date,
             TO_CHAR(lr.original_start_date, 'YYYY-MM-DD') as original_start_date,
             TO_CHAR(lr.original_end_date, 'YYYY-MM-DD') as original_end_date,
             TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             TO_CHAR(lr.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM leave_requests lr
      WHERE lr.user_id = $1
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
    
    let countQuery = `SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_id = $1`;
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

/// Create leave request (employee) - UPDATED with Cloudinary
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
  
  // Rest of your existing code...
  const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const employee = await client.query(
      `SELECT ep.hire_date, ep.employment_status, ep.probationary_end_date, u.is_active
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
    const isProbationary = emp.employment_status === 'probationary';
    
    const finalPayType = 'pending';
    
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
        medical_certificate_size, medical_certificate_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [userId, leave_type, start_date, end_date, reason, 'pending', finalPayType, 
       medicalCertUrl, medicalCertFilename, medicalCertSize, medicalCertType]
    );
    
    await client.query('COMMIT');
    
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
    
    res.status(201).json({
      success: true,
      message: successMessage,
      warning: warningMessage,
      leaveRequest: result.rows[0],
      isProbationary,
      hasSufficientBalance,
      currentBalance: hasSufficientBalance ? currentBalance : null,
      daysRequested: days
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
};

// Get all leave requests (admin)
const getAllLeaveRequests = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { page = 1, limit = 20, status, department, search } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT lr.*, 
             u.email,
             ep.first_name, ep.last_name, ep.employee_code, ep.department,
             TO_CHAR(lr.start_date, 'YYYY-MM-DD') as start_date,
             TO_CHAR(lr.end_date, 'YYYY-MM-DD') as end_date,
             TO_CHAR(lr.original_start_date, 'YYYY-MM-DD') as original_start_date,
             TO_CHAR(lr.original_end_date, 'YYYY-MM-DD') as original_end_date,
             TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             TO_CHAR(lr.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM leave_requests lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    if (department) {
      query += ` AND ep.department = $${paramCount}`;
      values.push(department);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (ep.first_name ILIKE $${paramCount} OR ep.last_name ILIKE $${paramCount} OR ep.employee_code ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    const countResult = await pool.query(`SELECT COUNT(*) FROM leave_requests`);
    
    res.json({
      leaveRequests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all leave requests:', error);
    res.status(500).json({ error: 'Server error' });
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
      'SELECT * FROM leave_requests WHERE id = $1',
      [id]
    );
    
    if (leaveRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const leave = leaveRequest.rows[0];
    
    // Determine pay type
    const payType = leave_pay_type || leave.leave_pay_type || 'with_pay';
    
    // Use adjusted dates if provided, otherwise use original dates
    const finalStartDate = start_date || leave.start_date;
    const finalEndDate = end_date || leave.end_date;
    
    // Calculate days based on final dates
    const days = Math.ceil((new Date(finalEndDate) - new Date(finalStartDate)) / (1000 * 60 * 60 * 24)) + 1;
    const year = new Date(finalStartDate).getFullYear();
    
    // ONLY deduct balance for WITH PAY approvals
    if (status === 'approved' && leave.status !== 'approved' && payType === 'with_pay') {
      let balanceField = '';
      
      if (leave.leave_type === 'Vacation Leave') {
        balanceField = 'vacation_leave';
      } else if (leave.leave_type === 'Sick Leave') {
        balanceField = 'sick_leave';
      } else if (leave.leave_type === 'Emergency Leave') {
        balanceField = 'emergency_leave';
      } else if (leave.leave_type === 'Special Leave') {
        balanceField = 'special_leave';
      }
      
      if (balanceField) {
        const balanceCheck = await client.query(
          `SELECT ${balanceField} FROM leave_balances 
           WHERE user_id = $1 AND year = $2`,
          [leave.user_id, year]
        );
        
        const currentBalance = balanceCheck.rows[0]?.[balanceField] || 0;
        
        if (currentBalance >= days) {
          const updateQuery = `UPDATE leave_balances 
                               SET ${balanceField} = ${balanceField} - $1, updated_at = CURRENT_TIMESTAMP
                               WHERE user_id = $2 AND year = $3`;
          await client.query(updateQuery, [days, leave.user_id, year]);
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `Insufficient leave balance. Only ${currentBalance} days available.` 
          });
        }
      }
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    updateFields.push(`status = $${paramCount}`);
    updateValues.push(status);
    paramCount++;
    
    updateFields.push(`approved_by = $${paramCount}`);
    updateValues.push(req.user.id);
    paramCount++;
    
    // If dates are being adjusted, store original dates first
    if (start_date || end_date) {
      // Store original dates if not already stored
      if (!leave.original_start_date && !leave.original_end_date) {
        updateFields.push(`original_start_date = $${paramCount}`);
        updateValues.push(leave.start_date);
        paramCount++;
        
        updateFields.push(`original_end_date = $${paramCount}`);
        updateValues.push(leave.end_date);
        paramCount++;
      }
      
      // Update with new dates
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
    
    // Add adjustment reason if provided
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
    
    if (leave_pay_type !== undefined) {
      updateFields.push(`leave_pay_type = $${paramCount}`);
      updateValues.push(leave_pay_type);
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
    
    await client.query('COMMIT');
    
    // Custom success message
    let successMessage = `Leave request ${status} successfully`;
    if (status === 'approved' && payType === 'without_pay') {
      successMessage = `Leave request approved WITHOUT PAY - no leave balance deducted`;
    } else if (status === 'approved' && payType === 'with_pay') {
      successMessage = `Leave request approved WITH PAY - leave balance deducted`;
    }
    
    if (start_date || end_date) {
      successMessage += ` Dates have been adjusted.`;
    }
    
    res.json({
      success: true,
      message: successMessage,
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating leave request status:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
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
      `SELECT * FROM leave_requests WHERE id = $1`,
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
    
    // For employees: only allow editing of pending requests
    if (!isAdmin && request.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot edit approved or rejected requests' });
    }
    
    // Validate dates if provided
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // For non-admins, prevent past dates
      if (!isAdmin && start < today) {
        return res.status(400).json({ error: 'Start date cannot be in the past' });
      }
      
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
      
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        updateFields.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
        
        // If setting back to pending, clear approval fields
        if (status === 'pending') {
          updateFields.push(`approved_by = NULL`);
          updateFields.push(`approval_notes = NULL`);
        }
      }
      
      // Add admin audit note
      updateFields.push(`admin_notes = COALESCE(admin_notes, '') || $${paramCount}`);
      values.push(`\n[Edited on ${new Date().toLocaleString()} by ${req.user.email}]: Leave details updated`);
      paramCount++;
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query(
      `UPDATE leave_requests 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    let successMessage = 'Leave request updated successfully';
    if (isAdmin && request.status === 'approved') {
      successMessage = 'Leave request updated successfully (admin override)';
    }
    
    res.json({
      success: true,
      message: successMessage,
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Error editing leave request:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Admin edit leave request (legacy function - can be removed or kept for compatibility)
const adminEditLeaveRequest = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  const { leave_type, start_date, end_date, reason, leave_pay_type, status, medical_certificate, approval_notes } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const leaveRequest = await pool.query(
      'SELECT * FROM leave_requests WHERE id = $1',
      [id]
    );
    
    if (leaveRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const oldLeave = leaveRequest.rows[0];
    const oldStatus = oldLeave.status;
    const newStatus = status || oldLeave.status;
    
    // Calculate days if dates changed
    const finalStartDate = start_date || oldLeave.start_date;
    const finalEndDate = end_date || oldLeave.end_date;
    const days = Math.ceil((new Date(finalEndDate) - new Date(finalStartDate)) / (1000 * 60 * 60 * 24)) + 1;
    const year = new Date(finalStartDate).getFullYear();
    
    // Handle leave balance adjustments
    if (oldStatus === 'approved' && oldLeave.leave_pay_type === 'with_pay') {
      // Refund old leave balance first
      let balanceField = '';
      if (oldLeave.leave_type === 'Vacation Leave') balanceField = 'vacation_leave';
      else if (oldLeave.leave_type === 'Sick Leave') balanceField = 'sick_leave';
      else if (oldLeave.leave_type === 'Emergency Leave') balanceField = 'emergency_leave';
      else if (oldLeave.leave_type === 'Special Leave') balanceField = 'special_leave';
      
      if (balanceField) {
        const oldDays = Math.ceil((new Date(oldLeave.end_date) - new Date(oldLeave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        await client.query(
          `UPDATE leave_balances 
           SET ${balanceField} = ${balanceField} + $1
           WHERE user_id = $2 AND year = $3`,
          [oldDays, oldLeave.user_id, year]
        );
      }
    }
    
    // Deduct new balance if approved with pay
    if (newStatus === 'approved' && leave_pay_type === 'with_pay') {
      let balanceField = '';
      if (leave_type === 'Vacation Leave') balanceField = 'vacation_leave';
      else if (leave_type === 'Sick Leave') balanceField = 'sick_leave';
      else if (leave_type === 'Emergency Leave') balanceField = 'emergency_leave';
      else if (leave_type === 'Special Leave') balanceField = 'special_leave';
      
      if (balanceField) {
        const balanceCheck = await client.query(
          `SELECT ${balanceField} FROM leave_balances WHERE user_id = $1 AND year = $2`,
          [oldLeave.user_id, year]
        );
        
        const currentBalance = balanceCheck.rows[0]?.[balanceField] || 0;
        
        if (currentBalance >= days) {
          await client.query(
            `UPDATE leave_balances 
             SET ${balanceField} = ${balanceField} - $1
             WHERE user_id = $2 AND year = $3`,
            [days, oldLeave.user_id, year]
          );
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Insufficient ${leave_type} balance` });
        }
      }
    }
    
    // Update the leave request
    const result = await pool.query(
      `UPDATE leave_requests 
       SET leave_type = COALESCE($1, leave_type),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           reason = COALESCE($4, reason),
           leave_pay_type = COALESCE($5, leave_pay_type),
           status = COALESCE($6, status),
           medical_certificate = COALESCE($7, medical_certificate),
           approval_notes = COALESCE($8, approval_notes),
           admin_notes = COALESCE(admin_notes, '') || $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        leave_type, start_date, end_date, reason, leave_pay_type, 
        status, medical_certificate, approval_notes,
        `\n[Admin edited on ${new Date().toLocaleString()}]: Leave details updated`,
        id
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Leave request updated successfully',
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in admin edit leave request:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
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
    console.log('admin_notes column verified');
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
  adminEditLeaveRequest
};