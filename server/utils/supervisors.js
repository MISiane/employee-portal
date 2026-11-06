// Who may approve which leave requests. `db` is the pool or a transaction client.
//
// Departments are matched case-insensitively and ignoring surrounding spaces,
// because the department is free text on the employee profile.

// Active supervisors of `department`, never including `excludeUserId`.
const supervisorsOfDepartment = async (db, department, excludeUserId) => {
  if (!department || !String(department).trim()) return [];
  const result = await db.query(
    `SELECT DISTINCT ds.user_id
     FROM department_supervisors ds
     JOIN users u ON u.id = ds.user_id AND u.is_active = true
     WHERE LOWER(TRIM(ds.department)) = LOWER(TRIM($1))
       AND ds.user_id <> $2`,
    [department, excludeUserId]
  );
  return result.rows.map((r) => r.user_id);
};

// Departments `userId` supervises (empty when they are not an active supervisor).
const departmentsSupervisedBy = async (db, userId) => {
  const result = await db.query(
    `SELECT ds.department
     FROM department_supervisors ds
     JOIN users u ON u.id = ds.user_id AND u.is_active = true
     WHERE ds.user_id = $1
     ORDER BY ds.department`,
    [userId]
  );
  return result.rows.map((r) => r.department);
};

// May `supervisorId` decide `requesterId`'s leave? Yes when they are an active
// supervisor of the requester's department and are not the requester.
const canSupervise = async (db, supervisorId, requesterId) => {
  if (Number(supervisorId) === Number(requesterId)) return false;
  const result = await db.query(
    `SELECT 1
     FROM department_supervisors ds
     JOIN users su ON su.id = ds.user_id AND su.is_active = true
     JOIN employee_profiles ep ON ep.user_id = $2
     WHERE ds.user_id = $1
       AND LOWER(TRIM(ds.department)) = LOWER(TRIM(ep.department))
     LIMIT 1`,
    [supervisorId, requesterId]
  );
  return result.rows.length > 0;
};

// Requests waiting on a supervisor whose department no longer has one (the last
// supervisor was removed, deactivated or is the requester) move on to the admin
// so they cannot sit forever. Returns how many were moved.
const requeueOrphanedRequests = async (db) => {
  const result = await db.query(
    `UPDATE leave_requests lr
     SET status = 'pending', updated_at = CURRENT_TIMESTAMP
     FROM employee_profiles ep
     WHERE ep.user_id = lr.user_id
       AND lr.status = 'pending_supervisor'
       AND NOT EXISTS (
         SELECT 1
         FROM department_supervisors ds
         JOIN users su ON su.id = ds.user_id AND su.is_active = true
         WHERE LOWER(TRIM(ds.department)) = LOWER(TRIM(ep.department))
           AND ds.user_id <> lr.user_id
       )
     RETURNING lr.id`
  );
  return result.rowCount ?? result.rows.length;
};

// Is `userId` a supervisor of any department at all?
const isSupervisor = async (db, userId) => (await departmentsSupervisedBy(db, userId)).length > 0;

module.exports = {
  supervisorsOfDepartment,
  departmentsSupervisedBy,
  canSupervise,
  requeueOrphanedRequests,
  isSupervisor,
};
