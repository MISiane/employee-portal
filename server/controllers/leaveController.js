const pool = require('../config/database');

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
      SELECT * FROM leave_requests 
      WHERE user_id = $1
    `;
    const values = [userId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    if (year) {
      query += ` AND EXTRACT(YEAR FROM start_date) = $${paramCount}`;
      values.push(year);
      paramCount++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    let countQuery = `SELECT COUNT(*) FROM leave_requests WHERE user_id = $1`;
    const countValues = [userId];
    let countParamCount = 2;
    
    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
    }
    
    if (year) {
      countQuery += ` AND EXTRACT(YEAR FROM start_date) = $${countParamCount}`;
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

// Create leave request (employee)
const createLeaveRequest = async (req, res) => {
  const { leave_type, start_date, end_date, reason, leave_pay_type, medical_certificate } = req.body;
  const userId = req.user.id;
  
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
    
    let finalPayType = leave_pay_type;
    let payTypeNote = '';
    
    if (isProbationary) {
      finalPayType = 'without_pay';
      payTypeNote = 'Probationary employees are automatically on leave without pay.';
    }
    
    let hasSufficientBalance = true;
    let currentBalance = 0;
    
    if (!isProbationary && finalPayType === 'with_pay') {
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
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Insufficient leave balance. You only have ${currentBalance} days available.` 
        });
      }
    }
    
    const result = await client.query(
      `INSERT INTO leave_requests (
        user_id, leave_type, start_date, end_date, reason, status, 
        leave_pay_type, medical_certificate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [userId, leave_type, start_date, end_date, reason, 'pending', finalPayType, medical_certificate || false]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: isProbationary 
        ? 'Leave request submitted (Without Pay - Probationary Employee)' 
        : 'Leave request submitted successfully',
      leaveRequest: result.rows[0],
      isProbationary,
      payTypeNote
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
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { status, department, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT lr.*, u.email, ep.first_name, ep.last_name, ep.department, ep.employee_code
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
    
    query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    let countQuery = 'SELECT COUNT(*) FROM leave_requests WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;
    
    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
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
  const { status, comments, leave_pay_type, medical_certificate, approval_notes } = req.body;
  
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
    
    // Determine pay type (use provided value or default to 'with_pay')
    const payType = leave_pay_type || leave.leave_pay_type || 'with_pay';
    
    // ONLY deduct balance for WITH PAY approvals
    if (status === 'approved' && leave.status !== 'approved' && payType === 'with_pay') {
      const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
      const year = new Date(leave.start_date).getFullYear();
      
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
    
    // For WITHOUT PAY approval, skip balance deduction but still approve
    if (status === 'approved' && leave.status !== 'approved' && payType === 'without_pay') {
      // No balance deduction - just log that it's without pay
      console.log(`Approving leave request ${id} as WITHOUT PAY - no balance deducted`);
    }
    
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    updateFields.push(`status = $${paramCount}`);
    updateValues.push(status);
    paramCount++;
    
    updateFields.push(`approved_by = $${paramCount}`);
    updateValues.push(req.user.id);
    paramCount++;
    
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
    
    // Custom success message based on pay type
    let successMessage = `Leave request ${status} successfully`;
    if (status === 'approved' && payType === 'without_pay') {
      successMessage = `Leave request approved WITHOUT PAY - no leave balance deducted`;
    } else if (status === 'approved' && payType === 'with_pay') {
      successMessage = `Leave request approved WITH PAY - leave balance deducted`;
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

module.exports = {
  getMyLeaveBalances,
  getUserLeaveBalances,
  updateLeaveBalances,
  getMyLeaveRequests,
  createLeaveRequest,
  getAllLeaveRequests,
  updateLeaveRequestStatus
};