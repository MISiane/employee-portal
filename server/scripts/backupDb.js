const { exec } = require('child_process');
require('dotenv').config();

const backupDatabase = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.sql`;
  
  const command = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -d ${process.env.DB_NAME} > ${filename}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error}`);
      return;
    }
    console.log(`✅ Database backed up to ${filename}`);
  });
};

backupDatabase();