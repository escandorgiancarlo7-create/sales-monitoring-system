import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 8 characters in backend/.env.');
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.execute(
    `INSERT INTO employees (name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin', active = TRUE`,
    [ADMIN_NAME.trim(), ADMIN_EMAIL.trim().toLowerCase(), passwordHash]
  );
  console.log(`Administrator account is ready for ${ADMIN_EMAIL}.`);
} catch (error) {
  console.error('Could not create administrator:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
