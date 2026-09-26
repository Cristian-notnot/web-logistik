const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool koneksi MySQL untuk environment lokal XAMPP/phpMyAdmin.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simlog_hw_unimus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4_general_ci',
  connectTimeout: 20000,
  multipleStatements: false,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] Koneksi ke MySQL berhasil.');
    conn.release();
  } catch (err) {
    console.error('[DB] Gagal konek ke MySQL:', err.message);
    console.error('     Pastikan Laragon sudah start dan database "simlog_hw_unimus" sudah dibuat (jalankan schema.sql).');
  }
}

module.exports = { pool, testConnection };
