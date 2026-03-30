const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Admin123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('Use this hash in your SQL:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@employeeportal.com';`);
}

generateHash();