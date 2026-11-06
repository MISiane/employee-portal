-- Supervisor approval for leave requests.
--
-- Idempotent: safe to run any number of times. The server runs every file in
-- server/migrations at startup (see utils/schema.js); you can also run this
-- file by hand with psql if the database user cannot change the schema from
-- the app.

-- Which employees supervise which department. A department can have several
-- supervisors and a supervisor can cover several departments.
CREATE TABLE IF NOT EXISTS department_supervisors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(100) NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, department)
);

CREATE INDEX IF NOT EXISTS idx_department_supervisors_department
  ON department_supervisors (LOWER(TRIM(department)));

-- Supervisor decision on each leave request. New status value used by the app:
-- 'pending_supervisor' (waiting for the department supervisor). The existing
-- 'pending' now means "waiting for the admin".
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supervisor_decision VARCHAR(20),
  ADD COLUMN IF NOT EXISTS supervisor_notes TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_decided_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS admin_override BOOLEAN NOT NULL DEFAULT false;
