-- Accounts created or reset by an admin must pick their own password at first login.
-- Existing accounts are not affected (default false).
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
