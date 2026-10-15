const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simlog_hw_unimus',
 
  ssl: process.env.DB_PORT === '4000' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : null,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  dateStrings: true,
  connectTimeout: 8000, 
  multipleStatements: false,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] Koneksi ke database berhasil terhubung.');
    conn.release();
  } catch (err) {
    console.error('[DB] Gagal konek ke database:', err.message);
  }
}

module.exports = { pool, testConnection }; 
