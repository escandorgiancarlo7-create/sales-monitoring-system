import jwt from 'jsonwebtoken';
import pool from './db.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, active FROM employees WHERE id = ?',
      [payload.sub]
    );
    if (!rows.length || !rows[0].active) return res.status(401).json({ error: 'Account is unavailable.' });
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    next(error);
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    next();
  };
}
