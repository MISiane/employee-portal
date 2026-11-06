const pool = require('../config/database');

// In-app notifications (the bell in the header). Failures are logged and
// swallowed: a notification problem must never undo or block a leave decision,
// so call this AFTER the transaction has committed, never inside it.
//
// Only the columns the header reads are written: user_id, type, title, message.
const notify = async (userId, type, title, message, db = pool) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4)`,
      [userId, type, title, message]
    );
  } catch (error) {
    console.error('Could not create notification:', error.message);
  }
};

const notifyMany = async (userIds, type, title, message, db = pool) => {
  for (const userId of new Set(userIds)) {
    await notify(userId, type, title, message, db);
  }
};

const adminIds = async (db = pool) => {
  try {
    const result = await db.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = true`);
    return result.rows.map((r) => r.id);
  } catch (error) {
    console.error('Could not load admins for notification:', error.message);
    return [];
  }
};

module.exports = { notify, notifyMany, adminIds };
