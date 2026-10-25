import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // Required for Aiven
  },
  waitForConnections: true,
  connectionLimit: 1, // Required for Vercel serverless
  queueLimit: 0
});

export default pool;