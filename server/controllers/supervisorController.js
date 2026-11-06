const pool = require('../config/database');
const { isSupervisorReady } = require('../utils/schema');
const {
  departmentsSupervisedBy,
  canSupervise,
  requeueOrphanedRequests,
} = require('../utils/supervisors');
const { notify, notifyMany, adminIds } = require('../utils/notify');

const notReady = (res) =>
  res.status(503).json({ error: 'Supervisor approval is not set up on this server yet' });

const toInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

// Fields a supervisor may see on a request. Deliberately not lr.*: that would
// include the admin's internal notes.
const SUPERVISOR_VIEW_COLUMNS = `
  lr.id, lr.user_id, lr.leave_type, lr.reason, lr.status, lr.regular_days_off,
  TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS start_date,
  TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS end_date,
  lr.medical_certificate_url, lr.medical_certificate_filename, lr.medical_certificate_type,
  lr.supervisor_id, lr.supervisor_decision, lr.supervisor_notes, lr.admin_override,
  TO_CHAR(lr.supervisor_decided_at, 'YYYY-MM-DD HH24:MI:SS') AS supervisor_decided_at,
  TO_CHAR(lr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
  ep.first_name, ep.last_name, ep.employee_code, ep.department,
  sp.first_name AS supervisor_first_name, sp.last_name AS supervisor_last_name,
  lb.vacation_leave, lb.sick_leave, lb.emergency_leave, lb.special_leave
`;

// ===== Who am I supervising, and how many requests are waiting? =====
// Never errors for normal employees: they simply are not supervisors.
const getMySupervisorInfo = async (req, res) => {
  try {
    if (!isSupervisorReady()) {
      return res.json({ isSupervisor: false, departments: [], awaitingCount: 0 });
    }
    const departments = await departmentsSupervisedBy(pool, req.user.id);
    if (departments.length === 0) {
      return res.json({ isSupervisor: false, departments: [], awaitingCount: 0 });
    }
    const count = await pool.query(
      `SELECT COUNT(*) AS count
       FROM leave_requests lr
       JOIN employee_profiles ep ON ep.user_id = lr.user_id
       WHERE lr.status = 'pending_supervisor'
         AND lr.user_id <> $1
         AND LOWER(TRIM(ep.department)) IN (
           SELECT LOWER(TRIM(ds.department)) FROM department_supervisors ds WHERE ds.user_id = $1)`,
      [req.user.id]
    );
    res.json({
      isSupervisor: true,
      departments,
      awaitingCount: parseInt(count.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Error getting supervisor info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Leave requests of the departments I supervise =====
// ?status=pending_supervisor (default) | decided | all
const getSupervisorRequests = async (req, res) => {
  if (!isSupervisorReady()) return notReady(res);

  const status = req.query.status || 'pending_supervisor';
  if (!['pending_supervisor', 'decided', 'all'].includes(status)) {
    return res.status(400).json({ error: 'status must be pending_supervisor, decided or all' });
  }
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 20, 1, 100);
  const search = (req.query.search || '').trim();

  try {
    const departments = await departmentsSupervisedBy(pool, req.user.id);
    if (departments.length === 0) {
      return res.status(403).json({ error: 'You are not a supervisor of any department' });
    }

    // Filters are built once so the list and the count can never disagree.
    const values = [req.user.id];
    let where = `
      WHERE lr.user_id <> $1
        AND LOWER(TRIM(ep.department)) IN (
          SELECT LOWER(TRIM(ds.department)) FROM department_supervisors ds WHERE ds.user_id = $1)`;

    if (status === 'pending_supervisor') {
      where += ` AND lr.status = 'pending_supervisor'`;
    } else if (status === 'decided') {
      where += ` AND lr.supervisor_decision IS NOT NULL`;
    }

    if (search) {
      values.push(`%${search}%`);
      const p = values.length;
      where += ` AND (ep.first_name ILIKE $${p} OR ep.last_name ILIKE $${p} OR ep.employee_code ILIKE $${p})`;
    }

    const from = `
      FROM leave_requests lr
      JOIN employee_profiles ep ON ep.user_id = lr.user_id
      LEFT JOIN employee_profiles sp ON sp.user_id = lr.supervisor_id
      LEFT JOIN leave_balances lb
        ON lb.user_id = lr.user_id AND lb.year = EXTRACT(YEAR FROM lr.start_date)::int
      ${where}`;

    const order = status === 'pending_supervisor' ? 'ASC' : 'DESC';
    const list = await pool.query(
      `SELECT ${SUPERVISOR_VIEW_COLUMNS} ${from}
       ORDER BY lr.created_at ${order}, lr.id ${order}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, (page - 1) * limit]
    );
    const count = await pool.query(`SELECT COUNT(*) AS count ${from}`, values);
    const total = parseInt(count.rows[0].count, 10);

    res.json({
      leaveRequests: list.rows,
      departments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error getting supervisor requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== Approve or reject as department supervisor =====
// body: { decision: 'approve' | 'reject', notes }
// Approve  -> status 'pending'  (now waiting for the admin)
// Reject   -> status 'rejected' (final)
// No leave balance is touched here: days only come off at the admin's approval.
const decideAsSupervisor = async (req, res) => {
  if (!isSupervisorReady()) return notReady(res);

  const { id } = req.params;
  const decision = req.body.decision;
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';

  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });
  }
  if (decision === 'reject' && !notes) {
    return res.status(400).json({ error: 'Please give a reason when rejecting a leave request' });
  }
  if (notes.length > 1000) {
    return res.status(400).json({ error: 'Notes are too long (max 1000 characters)' });
  }

  const client = await pool.connect();
  let updated;
  let requester;
  try {
    await client.query('BEGIN');

    const found = await client.query(
      'SELECT * FROM leave_requests WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    const request = found.rows[0];

    // Permission first, so a stranger learns nothing about the request's state.
    if (!(await canSupervise(client, req.user.id, request.user_id))) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You are not a supervisor for this employee' });
    }

    if (request.status !== 'pending_supervisor') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'This request is no longer waiting for a supervisor',
        status: request.status,
      });
    }

    const approve = decision === 'approve';
    const result = await client.query(
      `UPDATE leave_requests
       SET status = $1,
           supervisor_id = $2,
           supervisor_decision = $3,
           supervisor_notes = $4,
           supervisor_decided_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, user_id, leave_type, status, supervisor_id, supervisor_decision,
                 supervisor_notes, supervisor_decided_at`,
      [approve ? 'pending' : 'rejected', req.user.id, approve ? 'approved' : 'rejected', notes || null, id]
    );
    updated = result.rows[0];

    const who = await client.query(
      'SELECT first_name, last_name FROM employee_profiles WHERE user_id = $1',
      [request.user_id]
    );
    requester = who.rows[0] || {};

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deciding leave as supervisor:', error);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }

  // Notifications run after the commit and can never undo the decision.
  const name = `${requester.first_name || ''} ${requester.last_name || ''}`.trim() || 'An employee';
  if (decision === 'approve') {
    await notify(
      updated.user_id, 'leave_status', 'Leave request approved by your supervisor',
      `Your ${updated.leave_type} request was approved by your supervisor and is now waiting for admin approval.`
    );
    await notifyMany(
      await adminIds(), 'leave_admin', 'Leave request ready for approval',
      `${name}'s ${updated.leave_type} request was approved by their supervisor and needs your decision.`
    );
  } else {
    await notify(
      updated.user_id, 'leave_status', 'Leave request rejected by your supervisor',
      `Your ${updated.leave_type} request was rejected by your supervisor. Reason: ${notes}`
    );
  }

  res.json({
    success: true,
    message: decision === 'approve'
      ? 'Approved. The request now goes to the admin.'
      : 'Rejected. The employee has been notified.',
    leaveRequest: updated,
  });
};

// ===== Admin: who supervises what =====
const getSupervisorAssignments = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  if (!isSupervisorReady()) return notReady(res);

  try {
    const result = await pool.query(
      `SELECT ds.user_id, ep.first_name, ep.last_name, ep.employee_code,
              ep.department AS own_department, u.is_active,
              ARRAY_AGG(ds.department ORDER BY ds.department) AS departments
       FROM department_supervisors ds
       JOIN users u ON u.id = ds.user_id
       LEFT JOIN employee_profiles ep ON ep.user_id = ds.user_id
       GROUP BY ds.user_id, ep.first_name, ep.last_name, ep.employee_code, ep.department, u.is_active
       ORDER BY ep.first_name, ep.last_name`
    );
    res.json({ supervisors: result.rows });
  } catch (error) {
    console.error('Error getting supervisor assignments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Replaces the departments an employee supervises. An empty list removes them
// as a supervisor. Requests that were waiting on a department that now has no
// supervisor move on to the admin.
// body: { departments: ['Housekeeping', ...] }
const setSupervisorDepartments = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  if (!isSupervisorReady()) return notReady(res);

  const { userId } = req.params;
  const raw = req.body.departments;
  if (!Array.isArray(raw) || raw.length > 20) {
    return res.status(400).json({ error: 'departments must be a list of up to 20 department names' });
  }

  const departments = [];
  const seen = new Set();
  for (const item of raw) {
    const name = typeof item === 'string' ? item.trim() : '';
    if (!name || name.length > 100) {
      return res.status(400).json({ error: 'Each department must be 1 to 100 characters' });
    }
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      departments.push(name);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const target = await client.query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [userId]
    );
    if (target.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    if (departments.length > 0) {
      if (target.rows[0].role !== 'employee') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Only employee accounts can be supervisors' });
      }
      if (!target.rows[0].is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This employee account is deactivated' });
      }
    }

    await client.query('DELETE FROM department_supervisors WHERE user_id = $1', [userId]);
    for (const department of departments) {
      await client.query(
        `INSERT INTO department_supervisors (user_id, department, created_by)
         VALUES ($1, $2, $3)`,
        [userId, department, req.user.id]
      );
    }
    const requeued = await requeueOrphanedRequests(client);

    await client.query('COMMIT');
    res.json({ success: true, user_id: Number(userId), departments, requeued });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting supervisor departments:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getMySupervisorInfo,
  getSupervisorRequests,
  decideAsSupervisor,
  getSupervisorAssignments,
  setSupervisorDepartments,
};
