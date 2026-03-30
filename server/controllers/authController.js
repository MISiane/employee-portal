const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to convert empty strings to null
const sanitizeValue = (value) => {
  if (value === '' || value === undefined) return null;
  return value;
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      `SELECT u.*, 
              ep.first_name, ep.last_name, ep.employee_code, ep.department, 
              ep.position, ep.avatar_url
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled. Please contact administrator.' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({ 
      token, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Register new user (Admin only)
const register = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create new users' });
  }
  
  const { email, password, role = 'employee', first_name, last_name, department, position } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userExists = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, role, is_active`,
      [email.toLowerCase(), hashedPassword, role, true]
    );
    
    const user = userResult.rows[0];
    
    const count = await client.query('SELECT COUNT(*) FROM employee_profiles');
    const empCode = `EMP${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;
    
    await client.query(
      `INSERT INTO employee_profiles (user_id, first_name, last_name, employee_code, department, position)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, first_name, last_name, empCode, sanitizeValue(department), sanitizeValue(position)]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      user,
      tempPassword: password
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.is_active, u.last_login,
              ep.first_name, ep.last_name, ep.employee_code, ep.department,
              ep.position, ep.phone, ep.hire_date, ep.avatar_url
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    const user = result.rows[0];
    
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, register, getCurrentUser, changePassword };