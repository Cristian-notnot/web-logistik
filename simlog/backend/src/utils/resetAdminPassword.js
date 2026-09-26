require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function main() {
  const password = process.argv[2];
  const username = process.argv[3] || 'admin';

  if (!password || password.length < 8 || !username.trim()) {
    throw new Error('Gunakan password minimal 8 karakter. Contoh: node src/utils/resetAdminPassword.js "password-baru"');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'UPDATE users SET username = ?, password_hash = ?, aktif = 1 WHERE username = ?',
    [username.trim(), passwordHash, 'admin']
  );

  if (result.affectedRows === 0) {
    throw new Error('Akun admin tidak ditemukan. Jalankan database/seed.sql terlebih dahulu.');
  }

  console.log('Password akun admin berhasil diperbarui.');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
