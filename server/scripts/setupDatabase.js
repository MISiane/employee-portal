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

async function completeSetup() {
  try {
    console.log('🔄 Starting complete database setup...');
    
    // Drop tables in correct order
    console.log('📝 Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS attendance CASCADE');
    await pool.query('DROP TABLE IF EXISTS leave_requests CASCADE');
    await pool.query('DROP TABLE IF EXISTS announcements CASCADE');
    await pool.query('DROP TABLE IF EXISTS employee_profiles CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS departments CASCADE');
    
    console.log('✅ Tables dropped');
    
    // Create users table
    console.log('📝 Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'employee',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create employee_profiles table
    console.log('📝 Creating employee_profiles table...');
    await pool.query(`
      CREATE TABLE employee_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        employee_code VARCHAR(50) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        position VARCHAR(100),
        phone VARCHAR(20),
        hire_date DATE,
        salary DECIMAL(10,2),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        avatar_url TEXT,
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create departments table
    console.log('📝 Creating departments table...');
    await pool.query(`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create attendance table
    console.log('📝 Creating attendance table...');
    await pool.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        check_in TIMESTAMP,
        check_out TIMESTAMP,
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'present',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create leave_requests table
    console.log('📝 Creating leave_requests table...');
    await pool.query(`
      CREATE TABLE leave_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        leave_type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create announcements table
    console.log('📝 Creating announcements table...');
    await pool.query(`
      CREATE TABLE announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        content TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at DATE
      )
    `);
    
    // Insert default departments
    console.log('📝 Inserting default departments...');
    await pool.query(`
      INSERT INTO departments (name, description) VALUES
      ('Engineering', 'Software development and technical operations'),
      ('Marketing', 'Marketing and communications'),
      ('Sales', 'Sales and business development'),
      ('Human Resources', 'HR and talent management'),
      ('Finance', 'Financial operations and accounting')
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Create admin user
    console.log('📝 Creating admin user...');
    const adminEmail = 'admin@employeeportal.com';
    const adminPassword = 'Admin123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    const adminResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [adminEmail, hashedPassword, 'admin', true]
    );
    
    const adminId = adminResult.rows[0].id;
    
    await pool.query(
      `INSERT INTO employee_profiles (user_id, first_name, last_name, employee_code, department, position) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'System', 'Administrator', 'ADMIN001', 'Human Resources', 'System Administrator']
    );
    
    // Create sample employees
    console.log('📝 Creating sample employees...');
    const employees = [
      { email: 'john.doe@company.com', password: 'Employee123!', firstName: 'John', lastName: 'Doe', dept: 'Engineering', position: 'Senior Developer', code: 'EMP001' },
      { email: 'jane.smith@company.com', password: 'Employee123!', firstName: 'Jane', lastName: 'Smith', dept: 'Marketing', position: 'Marketing Manager', code: 'EMP002' },
      { email: 'mike.johnson@company.com', password: 'Employee123!', firstName: 'Mike', lastName: 'Johnson', dept: 'Sales', position: 'Sales Representative', code: 'EMP003' },
    ];
    
    for (const emp of employees) {
      const hashedEmpPassword = await bcrypt.hash(emp.password, 10);
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, role, is_active) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [emp.email, hashedEmpPassword, 'employee', true]
      );
      
      const userId = userResult.rows[0].id;
      
      await pool.query(
        `INSERT INTO employee_profiles (user_id, first_name, last_name, employee_code, department, position, hire_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, emp.firstName, emp.lastName, emp.code, emp.dept, emp.position, '2024-01-01']
      );
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Default Admin Credentials:');
    console.log('   Email: admin@employeeportal.com');
    console.log('   Password: Admin123!');
    console.log('\n📋 Sample Employee Credentials:');
    console.log('   Email: john.doe@company.com');
    console.log('   Password: Employee123!');
    console.log('   Email: jane.smith@company.com');
    console.log('   Password: Employee123!');
    console.log('   Email: mike.johnson@company.com');
    console.log('   Password: Employee123!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

completeSetup();