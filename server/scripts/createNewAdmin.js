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

async function createNewAdmin() {
  const email = 'newadmin@employeeportal.com';
  const password = 'Admin123!';
  const firstName = 'New';
  const lastName = 'Admin';
  const employeeCode = 'ADMIN002';

  try {
    console.log('🔄 Checking if admin exists...');
    
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('✅ Admin already exists!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('');
      console.log('Try logging in with these credentials.');
      return;
    }

    console.log('📝 Creating new admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✓ Password hashed');

    // Start transaction
    await pool.query('BEGIN');

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [email, hashedPassword, 'admin', true]
    );

    const userId = userResult.rows[0].id;
    console.log('✓ User created with ID:', userId);

    // Create profile
    await pool.query(
      `INSERT INTO employee_profiles (user_id, first_name, last_name, employee_code, department, position) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, firstName, lastName, employeeCode, 'Admin', 'System Administrator']
    );
    console.log('✓ Profile created');

    await pool.query('COMMIT');

    console.log('');
    console.log('✅ New admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', firstName, lastName);
    console.log('');
    console.log('Try logging in now!');

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await pool.end();
  }
}

createNewAdmin();