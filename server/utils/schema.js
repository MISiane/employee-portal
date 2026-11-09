const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// True once the supervisor-approval migration has been applied. The leave code
// checks this so that if the database user is not allowed to change the schema,
// leave requests keep working exactly as before (everything goes to the admin)
// instead of failing on missing columns.
const state = { supervisorReady: false };

const isSupervisorReady = () => state.supervisorReady;

// Runs every .sql file in server/migrations, in name order. The files are
// idempotent, so running them on every start is safe.
// `db` is anything with query(sql); defaults to the app's pool.
const ensureSchema = async (db = require('../config/database')) => {
  const files = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
    : [];
  // Never report "ready" when nothing was applied (e.g. the files were not deployed).
  if (files.length === 0) {
    throw new Error(`No migration files found in ${MIGRATIONS_DIR}`);
  }
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.query(sql);
  }
  state.supervisorReady = true;
  return files;
};

// SQL fragment that hides admin-deleted leave requests. Empty until the migration
// that adds the column has run, so queries never reference a column that is missing.
// `alias` is the table alias, e.g. 'lr' -> " AND lr.deleted_at IS NULL".
const notDeleted = (alias) =>
  state.supervisorReady ? ` AND ${alias ? `${alias}.` : ''}deleted_at IS NULL` : '';

module.exports = { ensureSchema, isSupervisorReady, notDeleted, state };
