const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Set timezone to Asia/Manila (Philippines)
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'Asia/Manila'");
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err.message);
  } else {
    console.log('✅ Successfully connected to PostgreSQL database');
    // Set timezone for the test connection
    client.query("SET TIME ZONE 'Asia/Manila'", (err) => {
      if (err) console.error('Error setting timezone:', err);
    });
    release();
  }
});

module.exports = pool;