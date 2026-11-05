// Keeps leave_balances in step with leave_requests.
//
// A leave request "costs" balance only while it is APPROVED and WITH PAY, for
// the number of days between its start and end date (inclusive), charged to
// the balance that matches its leave type in the year of its start date.
//
// Whenever a request changes (approve, reject, back to pending, new dates,
// new leave type, with/without pay), applyLeaveBalanceChange() works out what
// the old version had cost and what the new version costs, returns the old
// days and takes the new days. Call it inside the same transaction as the
// UPDATE so a failure rolls both back.

// Column names are fixed here and are the only values ever interpolated into
// SQL. Special and Emergency stay mapped so older requests can still be
// refunded even though new ones can no longer be created.
const FIELD_BY_LEAVE_TYPE = {
  'Vacation Leave': 'vacation_leave',
  'Sick Leave': 'sick_leave',
  'Emergency Leave': 'emergency_leave',
  'Special Leave': 'special_leave',
};

// Same defaults the approval flow used when a year's balance row did not exist yet.
const DEFAULT_BALANCES = { vacation_leave: 15, sick_leave: 10, emergency_leave: 3, special_leave: 3 };

// Calendar parts of a date. pg returns DATE columns as local-midnight Date
// objects; request bodies carry 'YYYY-MM-DD' (or ISO) strings.
const dateParts = (value) => {
  if (value instanceof Date) {
    return { y: value.getFullYear(), m: value.getMonth(), d: value.getDate() };
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (iso) return { y: Number(iso[1]), m: Number(iso[2]) - 1, d: Number(iso[3]) };
  const parsed = new Date(value);
  return { y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate() };
};

// Inclusive number of calendar days between two dates.
const countDays = (start, end) => {
  const a = dateParts(start);
  const b = dateParts(end);
  return Math.floor((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86400000) + 1;
};

// What a request currently costs, or null when it costs nothing.
const deductionFor = (request) => {
  if (!request || request.status !== 'approved' || request.leave_pay_type !== 'with_pay') return null;
  const field = FIELD_BY_LEAVE_TYPE[request.leave_type];
  if (!field) return null;
  const days = countDays(request.start_date, request.end_date);
  if (!Number.isFinite(days) || days <= 0) return null;
  return {
    userId: request.user_id,
    year: dateParts(request.start_date).y,
    field,
    days,
    leaveType: request.leave_type,
  };
};

const sameDeduction = (a, b) => {
  if (!a || !b) return !a && !b;
  return a.userId === b.userId && a.year === b.year && a.field === b.field && a.days === b.days;
};

class InsufficientBalanceError extends Error {
  constructor(details) {
    super('Insufficient leave balance');
    this.code = 'INSUFFICIENT_BALANCE';
    this.details = details;
  }
}

// `before` and `after` are leave_requests rows (before and after the UPDATE).
// Returns { refunded, deducted, available }:
//   refunded  - the deduction that was returned (or null)
//   deducted  - the deduction that was taken (or null)
//   available - the balance the new deduction was checked against
// Throws InsufficientBalanceError when the new state is WITH PAY but the
// employee does not have enough days; the caller must roll the transaction back.
const applyLeaveBalanceChange = async (client, before, after) => {
  const previous = deductionFor(before);
  const next = deductionFor(after);

  if (sameDeduction(previous, next)) {
    return { refunded: null, deducted: null, available: null };
  }

  let refunded = null;
  if (previous) {
    const refund = await client.query(
      `UPDATE leave_balances
       SET ${previous.field} = ${previous.field} + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND year = $3`,
      [previous.days, previous.userId, previous.year]
    );
    if (refund.rowCount === 0) {
      console.warn(`No leave_balances row for user ${previous.userId} / ${previous.year}; nothing to refund`);
    } else {
      refunded = previous;
    }
  }

  let deducted = null;
  let available = null;
  if (next) {
    await client.query(
      `INSERT INTO leave_balances (user_id, year, vacation_leave, sick_leave, emergency_leave, special_leave)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, year) DO NOTHING`,
      [next.userId, next.year, DEFAULT_BALANCES.vacation_leave, DEFAULT_BALANCES.sick_leave,
        DEFAULT_BALANCES.emergency_leave, DEFAULT_BALANCES.special_leave]
    );

    const row = await client.query(
      `SELECT ${next.field} AS balance FROM leave_balances
       WHERE user_id = $1 AND year = $2 FOR UPDATE`,
      [next.userId, next.year]
    );
    available = Number(row.rows[0]?.balance) || 0;

    if (available < next.days) {
      throw new InsufficientBalanceError({
        available,
        requested: next.days,
        leave_type: next.leaveType,
        suggested_action: 'without_pay',
      });
    }

    await client.query(
      `UPDATE leave_balances
       SET ${next.field} = ${next.field} - $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND year = $3`,
      [next.days, next.userId, next.year]
    );
    deducted = next;
  }

  return { refunded, deducted, available };
};

module.exports = {
  FIELD_BY_LEAVE_TYPE,
  countDays,
  deductionFor,
  applyLeaveBalanceChange,
  InsufficientBalanceError,
};
