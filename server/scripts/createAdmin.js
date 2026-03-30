const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createAdminUser() {
  const email = 'admin@employeeportal.com';
  const password = 'Admin123!'; // You can change this to any password you want
  const role = 'admin';
  const firstName = 'System';
  const lastName = 'Administrator';

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if admin already exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      
      // Update existing admin
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      
      console.log('Admin password updated successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Start transaction
    await pool.query('BEGIN');

    // Create admin user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [email, hashedPassword, role, true]
    );

    const userId = userResult.rows[0].id;

    // Create admin profile
    await pool.query(
      `INSERT INTO employee_profiles (user_id, first_name, last_name, employee_code, department, position) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, firstName, lastName, 'ADMIN001', 'Human Resources', 'System Administrator']
    );

    await pool.query('COMMIT');

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', role);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error creating admin user:', error);
  } finally {
    pool.end();
  }
}

createAdminUser();