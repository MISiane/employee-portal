-- Admin "delete" of a leave request hides it instead of removing it, so it can be
-- restored. Idempotent: safe to run on every start.
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leave_requests_deleted_at ON leave_requests (deleted_at);
