import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './db.js';

async function fixAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    console.log('Generated new hash:', hash);
    
    const [result] = await pool.execute(
      'UPDATE employees SET password_hash = ?, active = 1 WHERE email = ?',
      [hash, 'admin@example.com']
    );
    
    console.log('Database update result:', result);
    console.log('Admin password reset to admin123 successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin:', error);
    process.exit(1);
  }
}

fixAdmin();