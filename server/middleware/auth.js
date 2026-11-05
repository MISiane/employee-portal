const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verifies the JWT, then re-reads the user from the database so that a
// deactivated account or a changed role takes effect immediately instead of
// when the token expires.
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return res.status(401).json({ error: 'Token is not valid' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account is disabled or no longer exists' });
    }

    // Use the current role from the database, not the one baked into the token
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    console.error('Auth lookup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = authMiddleware;
