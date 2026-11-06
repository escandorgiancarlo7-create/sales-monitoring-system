import jwt from 'jsonwebtoken';
import pool from './db.js';

export async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || typeof payload !== 'object' || !payload.sub) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    if (payload.role === 'customer') {
      const [customers] = await pool.execute(
        'SELECT id, name, email, active FROM customers WHERE id = ?',
        [payload.sub]
      );
      if (!customers.length || !customers[0].active) {
        return res.status(401).json({ error: 'Account is unavailable.' });
      }
      req.user = { ...customers[0], role: 'customer' };
    } else {
      const [employees] = await pool.execute(
        'SELECT id, name, email, role, active FROM employees WHERE id = ?',
        [payload.sub]
      );
      if (!employees.length || !employees[0].active) {
        return res.status(401).json({ error: 'Account is unavailable.' });
      }
      req.user = employees[0];
    }
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
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
