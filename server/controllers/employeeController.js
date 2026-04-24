const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper function to convert empty strings to null
const sanitizeValue = (value) => {
  if (value === '' || value === undefined) return null;
  return value;
};

// Helper function to sanitize date fields - SIMPLIFIED
const sanitizeDate = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  
  // If it's a string in YYYY-MM-DD format, return as is
  if (typeof value === 'string') {
    // Extract just the date part
    const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      return dateMatch[0];
    }
  }
  
  return value;
};

// Helper function to sanitize numeric fields
const sanitizeNumber = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};


// Get all employees with filters
const getEmployees = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { search, department, status, page = 1, limit = 10, sort = 'created_at', order = 'DESC'} = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT u.id, u.email, u.role, u.is_active, u.last_login,
             ep.first_name, ep.last_name, ep.employee_code, ep.department, 
             ep.position, ep.phone, ep.hire_date, ep.salary,
             ep.address, ep.city, ep.state, ep.zip_code,
             ep.emergency_contact_name, ep.emergency_contact_phone,
             ep.sss_number, ep.philhealth_number, ep.pagibig_number, ep.tin_number,
             ep.employment_status,
             TO_CHAR(ep.date_of_birth, 'YYYY-MM-DD') as date_of_birth,
             TO_CHAR(ep.hire_date, 'YYYY-MM-DD') as hire_date
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.role = 'employee'
    `;
    const values = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (ep.first_name ILIKE $${paramCount} OR ep.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR ep.employee_code ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }
    
    if (department) {
      query += ` AND ep.department = $${paramCount}`;
      values.push(department);
      paramCount++;
    }
    
    if (status === 'active') {
      query += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND u.is_active = false`;
    }

    let orderByClause = '';
    switch(sort) {
      case 'first_name':
        orderByClause = `ORDER BY ep.first_name ${order}, ep.last_name ${order}`;
        break;
      case 'last_name':
        orderByClause = `ORDER BY ep.last_name ${order}, ep.first_name ${order}`;
        break;
      case 'employee_code':
        orderByClause = `ORDER BY ep.employee_code ${order}`;
        break;
      case 'department':
        orderByClause = `ORDER BY ep.department ${order}`;
        break;
      case 'position':
        orderByClause = `ORDER BY ep.position ${order}`;
        break;
      case 'is_active':
        orderByClause = `ORDER BY u.is_active ${order}`;
        break;
      case 'hire_date':
        orderByClause = `ORDER BY ep.hire_date ${order}`;
        break;
      case 'email':
        orderByClause = `ORDER BY u.email ${order}`;
        break;
      default:
        orderByClause = `ORDER BY ep.created_at DESC, ep.employee_code ASC`;
    }
    
    query += ` ${orderByClause} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    let countQuery = `
      SELECT COUNT(*) FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.role = 'employee'
    `;
    const countValues = [];
    let countParamCount = 1;
    
    if (search) {
      countQuery += ` AND (ep.first_name ILIKE $${countParamCount} OR ep.last_name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount} OR ep.employee_code ILIKE $${countParamCount})`;
      countValues.push(`%${search}%`);
      countParamCount++;
    }
    if (department) {
      countQuery += ` AND ep.department = $${countParamCount}`;
      countValues.push(department);
    }
    
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      employees: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getEmployees:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single employee by ID
const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.is_active, 
        u.last_login, 
        u.created_at, 
        u.updated_at,
        u.avatar_url,
        u.avatar_filename,
        u.avatar_uploaded_at,
        ep.user_id as ep_user_id,
        ep.first_name, 
        ep.last_name, 
        ep.employee_code, 
        ep.department, 
        ep.position, 
        ep.phone, 
        ep.address, 
        ep.city, 
        ep.state, 
        ep.zip_code,
        ep.date_of_birth,
        ep.hire_date,
        ep.employment_status,
        ep.probationary_end_date,
        ep.regularization_date,
        ep.sss_number,
        ep.philhealth_number,
        ep.pagibig_number,
        ep.tin_number,
        ep.emergency_contact_name,
        ep.emergency_contact_phone,
        ep.created_at as profile_created_at,
        ep.updated_at as profile_updated_at,
        TO_CHAR(ep.date_of_birth, 'YYYY-MM-DD') as date_of_birth_formatted,
        TO_CHAR(ep.hire_date, 'YYYY-MM-DD') as hire_date_formatted,
        TO_CHAR(ep.regularization_date, 'YYYY-MM-DD') as regularization_date_formatted,
        TO_CHAR(ep.probationary_end_date, 'YYYY-MM-DD') as probationary_end_date_formatted
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Create a clean response object
    const profile = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      is_active: result.rows[0].is_active,
      last_login: result.rows[0].last_login,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
      avatar_url: result.rows[0].avatar_url,
      avatar_filename: result.rows[0].avatar_filename,
      avatar_uploaded_at: result.rows[0].avatar_uploaded_at,
      first_name: result.rows[0].first_name,
      last_name: result.rows[0].last_name,
      employee_code: result.rows[0].employee_code,
      department: result.rows[0].department,
      position: result.rows[0].position,
      phone: result.rows[0].phone,
      address: result.rows[0].address,
      city: result.rows[0].city,
      state: result.rows[0].state,
      zip_code: result.rows[0].zip_code,
      date_of_birth: result.rows[0].date_of_birth_formatted || result.rows[0].date_of_birth,
      hire_date: result.rows[0].hire_date_formatted || result.rows[0].hire_date,
      employment_status: result.rows[0].employment_status,
      probationary_end_date: result.rows[0].probationary_end_date_formatted || result.rows[0].probationary_end_date,
      regularization_date: result.rows[0].regularization_date_formatted || result.rows[0].regularization_date,
      sss_number: result.rows[0].sss_number,
      philhealth_number: result.rows[0].philhealth_number,
      pagibig_number: result.rows[0].pagibig_number,
      tin_number: result.rows[0].tin_number,
      emergency_contact_name: result.rows[0].emergency_contact_name,
      emergency_contact_phone: result.rows[0].emergency_contact_phone,
    };
    
    
    res.json(profile);
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/// Create new employee
const createEmployee = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const {
    email,
    first_name,
    last_name,
    employee_code,
    department,
    position,
    phone,
    hire_date,
    date_of_birth,  // ← ADD THIS
    salary,
    address,
    city,
    state,
    zip_code,
    emergency_contact_name,
    emergency_contact_phone,
    sss_number,
    philhealth_number,
    pagibig_number,
    tin_number,
    employment_status,
    regularization_date,
    probationary_end_date,
    role = 'employee'
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, is_active`,
      [email.toLowerCase(), hashedPassword, role, true]
    );
    
    const user = userResult.rows[0];
    
    let empCode = sanitizeValue(employee_code);
    if (!empCode) {
      const count = await client.query('SELECT COUNT(*) FROM employee_profiles');
      const num = parseInt(count.rows[0].count) + 1;
      empCode = `EMP${String(num).padStart(4, '0')}`;
    }
    
  const profileResult = await client.query(
  `INSERT INTO employee_profiles (
    user_id, first_name, last_name, employee_code, department,
    position, phone, hire_date, date_of_birth, salary, address, city,
    state, zip_code, emergency_contact_name, emergency_contact_phone,
    sss_number, philhealth_number, pagibig_number, tin_number,
    employment_status, regularization_date, probationary_end_date
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
  RETURNING *`,
  [
    user.id, first_name, last_name, empCode,
    sanitizeValue(department), sanitizeValue(position), sanitizeValue(phone),
    sanitizeDate(hire_date), sanitizeDate(date_of_birth), sanitizeNumber(salary), sanitizeValue(address),
    sanitizeValue(city), sanitizeValue(state), sanitizeValue(zip_code),
    sanitizeValue(emergency_contact_name), sanitizeValue(emergency_contact_phone),
    sanitizeValue(sss_number), sanitizeValue(philhealth_number),
    sanitizeValue(pagibig_number), sanitizeValue(tin_number),
    sanitizeValue(employment_status) || 'regular',
    sanitizeDate(regularization_date),
    sanitizeDate(probationary_end_date)
  ]
);
    
    await client.query(
      `INSERT INTO leave_balances (user_id, year, vacation_leave, sick_leave, emergency_leave, special_leave)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, year) DO NOTHING`,
      [user.id, new Date().getFullYear(), 0, 0, 0, 0]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile: profileResult.rows[0],
      tempPassword
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createEmployee:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const employeeCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Update users table (admin only)
    if (req.user.role === 'admin') {
      const userUpdates = [];
      const userValues = [];
      let userParamCount = 1;
      
      if (updates.email !== undefined) {
        userUpdates.push(`email = $${userParamCount}`);
        userValues.push(updates.email.toLowerCase());
        userParamCount++;
      }
      
      if (updates.is_active !== undefined) {
        userUpdates.push(`is_active = $${userParamCount}`);
        userValues.push(updates.is_active);
        userParamCount++;
      }
      
      if (updates.role !== undefined && updates.role !== 'admin') {
        userUpdates.push(`role = $${userParamCount}`);
        userValues.push(updates.role);
        userParamCount++;
      }
      
      if (userUpdates.length > 0) {
        userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
        userValues.push(id);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${userParamCount}`,
          userValues
        );
      }
    }
    
    // Update employee_profiles - Include ALL fields including government IDs
    const profileUpdates = [];
    const profileValues = [];
    let profileParamCount = 1;
    
    // List all fields that can be updated in employee_profiles
    const profileFields = [
      'first_name', 'last_name', 'employee_code', 'department',
      'position', 'phone', 'hire_date', 'salary', 'address', 'city',
      'state', 'zip_code', 'emergency_contact_name', 'emergency_contact_phone',
      'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number',
      'employment_status', 'regularization_date', 'probationary_end_date',
      'date_of_birth'  // ← ADD THIS
    ];
    
    for (const field of profileFields) {
  if (updates[field] !== undefined) {
    let value = updates[field];
    
    // For date fields, just use the sanitized value without casting
if (field === 'hire_date' || field === 'regularization_date' || field === 'probationary_end_date' || field === 'date_of_birth') {
  value = sanitizeDate(value);
  // Don't add ::DATE, just use the value as is
} else if (field === 'salary') {
  value = sanitizeNumber(value);
} else {
  value = sanitizeValue(value);
}

profileUpdates.push(`${field} = $${profileParamCount}`);
profileValues.push(value);
profileParamCount++;
  }
}
    if (profileUpdates.length > 0) {
      profileUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
      profileValues.push(id);
      
      const query = `
        UPDATE employee_profiles 
        SET ${profileUpdates.join(', ')}
        WHERE user_id = $${profileParamCount}
        RETURNING *
      `;
      
      const profileResult = await pool.query(query, profileValues);
      
      const userResult = await pool.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [id]
      );
      
      res.json({
        user: userResult.rows[0],
        profile: profileResult.rows[0]
      });
    } else {
      const userResult = await pool.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [id]
      );
      res.json({
        user: userResult.rows[0],
        profile: null
      });
    }
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Delete employee (soft delete)
const deleteEmployee = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND role = $2 RETURNING id',
      [id, 'employee']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all departments
const getDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM departments ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getDepartments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get employee statistics for dashboard
const getEmployeeStats = async (req, res) => {
  try {
    const totalQuery = await pool.query(
      'SELECT COUNT(*) FROM users WHERE role = $1',
      ['employee']
    );
    
    const activeQuery = await pool.query(
      'SELECT COUNT(*) FROM users WHERE role = $1 AND is_active = true',
      ['employee']
    );
    
    const newThisMonthQuery = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE role = $1 
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)`,
      ['employee']
    );
    
    const departmentQuery = await pool.query(`
      SELECT 
        COALESCE(department, 'Unassigned') as department,
        COUNT(*) as count
      FROM employee_profiles ep
      WHERE ep.user_id IN (SELECT id FROM users WHERE role = 'employee')
      GROUP BY department
      ORDER BY department
    `);
    
    res.json({
      total: parseInt(totalQuery.rows[0].count),
      active: parseInt(activeQuery.rows[0].count),
      newThisMonth: parseInt(newThisMonthQuery.rows[0].count),
      byDepartment: departmentQuery.rows
    });
  } catch (error) {
    console.error('Error in getEmployeeStats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get department distribution with counts
const getDepartmentDistribution = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(ep.department, 'Unassigned') as department,
        COUNT(ep.id) as count
      FROM employee_profiles ep
      WHERE ep.user_id IN (SELECT id FROM users WHERE role = 'employee')
      GROUP BY ep.department
      ORDER BY 
        CASE WHEN ep.department IS NULL THEN 1 ELSE 0 END,
        ep.department
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getDepartmentDistribution:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update employee profile (for employees to update their own info)
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;
  
  const allowedUpdateFields = [
    'phone',
    'address',
    'city',
    'state',
    'zip_code',
    'emergency_contact_name',
    'emergency_contact_phone',
    'sss_number',
    'philhealth_number',
    'pagibig_number',
    'tin_number'
  ];
  
  const adminOnlyFields = [
    'first_name',
    'last_name',
    'email',
    'employee_code',
    'department',
    'position',
    'hire_date',
    'salary',
    'role',
    'is_active'
  ];
  
  try {
    const employeeCheck = await pool.query(
      `SELECT u.id, u.email, u.role, u.is_active,
              ep.*
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    for (const field of adminOnlyFields) {
      if (updates[field] !== undefined && req.user.role !== 'admin') {
        delete updates[field];
      }
    }
    
    const profileUpdates = [];
    const profileValues = [];
    let profileParamCount = 1;
    
    for (const field of allowedUpdateFields) {
      if (updates[field] !== undefined) {
        let value = updates[field];
        value = sanitizeValue(value);
        
        profileUpdates.push(`${field} = $${profileParamCount}`);
        profileValues.push(value);
        profileParamCount++;
      }
    }
    
    if (profileUpdates.length > 0) {
      profileUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
      profileValues.push(userId);
      
      await pool.query(
        `UPDATE employee_profiles 
         SET ${profileUpdates.join(', ')}
         WHERE user_id = $${profileParamCount}`,
        profileValues
      );
    }
    
    if (req.user.role === 'admin') {
      const userUpdates = [];
      const userValues = [];
      let userParamCount = 1;
      
      for (const field of adminOnlyFields) {
        if (updates[field] !== undefined && field !== 'first_name' && field !== 'last_name') {
          if (field === 'email') {
            userUpdates.push(`email = $${userParamCount}`);
            userValues.push(updates[field].toLowerCase());
            userParamCount++;
          } else if (field === 'is_active') {
            userUpdates.push(`is_active = $${userParamCount}`);
            userValues.push(updates[field]);
            userParamCount++;
          } else if (field === 'role') {
            userUpdates.push(`role = $${userParamCount}`);
            userValues.push(updates[field]);
            userParamCount++;
          }
        }
      }
      
      if (userUpdates.length > 0) {
        userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
        userValues.push(userId);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${userParamCount}`,
          userValues
        );
      }
      
      if (updates.first_name !== undefined || updates.last_name !== undefined) {
        const nameUpdates = [];
        const nameValues = [];
        let nameParamCount = 1;
        
        if (updates.first_name !== undefined) {
          nameUpdates.push(`first_name = $${nameParamCount}`);
          nameValues.push(updates.first_name);
          nameParamCount++;
        }
        
        if (updates.last_name !== undefined) {
          nameUpdates.push(`last_name = $${nameParamCount}`);
          nameValues.push(updates.last_name);
          nameParamCount++;
        }
        
        if (nameUpdates.length > 0) {
          nameValues.push(userId);
          await pool.query(
            `UPDATE employee_profiles 
             SET ${nameUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $${nameParamCount}`,
            nameValues
          );
        }
      }
    }
    
    const updatedResult = await pool.query(
      `SELECT u.id, u.email, u.role, u.is_active, u.last_login,
              ep.*
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get upcoming birthdays for dashboard
const getUpcomingBirthdays = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ep.first_name,
        ep.last_name,
        ep.department,
        ep.date_of_birth,
        ep.employee_code,
        EXTRACT(DAY FROM ep.date_of_birth) as birth_day,
        EXTRACT(MONTH FROM ep.date_of_birth) as birth_month
      FROM employee_profiles ep
      WHERE ep.user_id IN (SELECT id FROM users WHERE role = 'employee')
        AND ep.date_of_birth IS NOT NULL
      ORDER BY 
        EXTRACT(MONTH FROM ep.date_of_birth),
        EXTRACT(DAY FROM ep.date_of_birth)
    `);
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const upcomingBirthdays = result.rows
      .map(emp => {
        const birthMonth = parseInt(emp.birth_month);
        const birthDay = parseInt(emp.birth_day);
        
        let isUpcoming = false;
        let daysUntil = 0;
        
        if (birthMonth > currentMonth) {
          const birthDate = new Date(today.getFullYear(), birthMonth - 1, birthDay);
          daysUntil = Math.ceil((birthDate - today) / (1000 * 60 * 60 * 24));
          isUpcoming = daysUntil <= 30;
        } else if (birthMonth === currentMonth && birthDay >= currentDay) {
          const birthDate = new Date(today.getFullYear(), birthMonth - 1, birthDay);
          daysUntil = Math.ceil((birthDate - today) / (1000 * 60 * 60 * 24));
          isUpcoming = daysUntil <= 30;
        } else if (birthMonth < currentMonth) {
          const birthDate = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
          daysUntil = Math.ceil((birthDate - today) / (1000 * 60 * 60 * 24));
          isUpcoming = daysUntil <= 30;
        }
        
        if (isUpcoming) {
          let dateText = '';
          if (daysUntil === 0) dateText = 'Today';
          else if (daysUntil === 1) dateText = 'Tomorrow';
          else if (daysUntil < 7) dateText = `In ${daysUntil} days`;
          else dateText = `In ${Math.ceil(daysUntil / 7)} weeks`;
          
          return {
            name: `${emp.first_name} ${emp.last_name}`,
            department: emp.department,
            date: dateText,
            avatar: `${emp.first_name.charAt(0)}${emp.last_name.charAt(0)}`,
            daysUntil: daysUntil,
            birthDate: `${emp.birth_month}/${emp.birth_day}`
          };
        }
        return null;
      })
      .filter(b => b !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
    
    res.json(upcomingBirthdays);
  } catch (error) {
    console.error('Error getting upcoming birthdays:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTodayBirthdays = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, 
        ep.first_name, 
        ep.last_name, 
        ep.position,
        ep.department,
        ep.employee_code
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.is_active = true 
        AND ep.date_of_birth IS NOT NULL
        AND u.role = 'employee'
        AND EXTRACT(MONTH FROM ep.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM ep.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
      ORDER BY ep.first_name
    `);
    
    res.json({ 
      success: true,
      birthdays: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching today\'s birthdays:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Reset employee password (admin only)
const resetEmployeePassword = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { id } = req.params;
  
  try {
    // Check if employee exists
    const employeeCheck = await pool.query(
      `SELECT u.id, u.email, ep.first_name, ep.last_name 
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1 AND u.role = 'employee'`,
      [id]
    );
    
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employee = employeeCheck.rows[0];
    
    // Generate a new temporary password
    // Format: Word + Number + Symbol (more user-friendly)
    const adjectives = ['Happy', 'Sunny', 'Bright', 'Clear', 'Smart', 'Quick', 'Brave', 'Calm'];
    const nouns = ['Sky', 'Star', 'Moon', 'Cloud', 'Tree', 'Bird', 'Fish', 'Lion'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 900 + 100);
    const tempPassword = `${randomAdj}${randomNoun}${randomNum}!`;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update the password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      temporary_password: tempPassword,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: employee.email
    });
  } catch (error) {
    console.error('Error in resetEmployeePassword:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get employee by employee code (for HR/Admin lookup)
const getEmployeeByCode = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  
  const { employeeCode } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.is_active,
              ep.first_name, ep.last_name, ep.employee_code, ep.department, ep.position
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE ep.employee_code = $1 AND u.role = 'employee'`,
      [employeeCode]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in getEmployeeByCode:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Get birthday comments
const getBirthdayComments = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT 
        bc.*,
        ep.first_name as commenter_first_name,
        ep.last_name as commenter_last_name,
        ep.employee_code as commenter_code,
        ep.department as commenter_department,
        u.avatar_url as commenter_avatar_url
      FROM birthday_comments bc
      LEFT JOIN users u ON bc.commenter_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE bc.birthday_person_id = $1
      ORDER BY bc.created_at DESC`,
      [userId]
    );
    
    res.json({ 
      success: true, 
      comments: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching birthday comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add a birthday comment
const addBirthdayComment = async (req, res) => {
  const { userId } = req.params;
  const { comment } = req.body;
  const commenterId = req.user.id;
  
  
  if (!comment || comment.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }
  
  if (comment.length > 500) {
    return res.status(400).json({ error: 'Comment too long (max 500 characters)' });
  }
  
  try {
    // Check if birthday person exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Insert comment
const result = await pool.query(
  `INSERT INTO birthday_comments (birthday_person_id, commenter_id, comment, created_at)
   VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'Asia/Manila'))
   RETURNING *`,
  [userId, commenterId, comment.trim()]
);
    
    // Get commenter info from employee_profiles
    const commenterInfo = await pool.query(
      `SELECT first_name, last_name, employee_code, department
       FROM employee_profiles 
       WHERE user_id = $1`,
      [commenterId]
    );
    
    res.json({ 
      success: true, 
      comment: {
        ...result.rows[0],
        commenter_first_name: commenterInfo.rows[0]?.first_name || 'Unknown',
        commenter_last_name: commenterInfo.rows[0]?.last_name || 'User',
        commenter_code: commenterInfo.rows[0]?.employee_code,
        commenter_department: commenterInfo.rows[0]?.department
      },
      message: 'Birthday wish posted! 🎉'
    });
  } catch (error) {
    console.error('Error adding birthday comment:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
};

// Delete a birthday comment (optional - for moderation)
const deleteBirthdayComment = async (req, res) => {
  const { commentId } = req.params;
  
  try {
    // Check if user is admin or the commenter
    const comment = await pool.query(
      'SELECT commenter_id FROM birthday_comments WHERE id = $1',
      [commentId]
    );
    
    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (req.user.role !== 'admin' && comment.rows[0].commenter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await pool.query('DELETE FROM birthday_comments WHERE id = $1', [commentId]);
    
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting birthday comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get employee directory (limited info for employees)
const getEmployeeDirectory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.avatar_url,
              ep.first_name, ep.last_name, ep.employee_code, ep.department, ep.position,  ep.date_of_birth,
              EXTRACT(YEAR FROM AGE(CURRENT_DATE, ep.hire_date)) as years_at_company
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.is_active = true AND u.role = 'employee'
       ORDER BY ep.department, ep.first_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee directory:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  getEmployees,
  getEmployeeById,
  getEmployeeByCode,   
  createEmployee,
  updateEmployee,
  updateProfile,
  deleteEmployee,
  resetEmployeePassword,  
  getDepartments,
  getEmployeeStats,
  getDepartmentDistribution,
  getUpcomingBirthdays,
  getTodayBirthdays,
   getBirthdayComments,
  addBirthdayComment,
  deleteBirthdayComment,
  getEmployeeDirectory
};