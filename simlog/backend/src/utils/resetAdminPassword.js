require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function main() {
  const password = process.argv[2];

  if (!password) {
    throw new Error(
      'Password baru wajib diberikan.\n' +
      'Contoh:\n' +
      'npm run reset-admin-password -- "BIDLOGISTIK123"'
    );
  }

  if (password.length < 8) {
    throw new Error(
      'Password minimal 8 karakter.'
    );
  }

  // Cari berdasarkan role admin, bukan username.
  const [rows] = await pool.query(
    `
    SELECT
      id,
      nama,
      username,
      email,
      role,
      aktif
    FROM users
    WHERE role = 'admin_logistik'
    ORDER BY id ASC
    LIMIT 1
    `
  );

  if (rows.length === 0) {
    throw new Error(
      'Akun dengan role admin_logistik tidak ditemukan.'
    );
  }

  const user = rows[0];

  const passwordHash = await bcrypt.hash(
    password,
    10
  );

  await pool.query(
    `
    UPDATE users
    SET
      password_hash = ?,
      aktif = 1
    WHERE id = ?
    `,
    [
      passwordHash,
      user.id,
    ]
  );

  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    ' PASSWORD ADMIN BERHASIL DIPERBARUI'
  );
  console.log(
    '========================================'
  );

  console.log(`ID       : ${user.id}`);
  console.log(`Nama     : ${user.nama}`);
  console.log(`Username : ${user.username}`);
  console.log(`Role     : ${user.role}`);
  console.log('Aktif    : Ya');

  console.log(
    '========================================'
  );
  console.log('');
}

main()
  .catch((err) => {
    console.error('');
    console.error(
      '[RESET PASSWORD ERROR]'
    );
    console.error(
      err.message
    );
    console.error('');

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });