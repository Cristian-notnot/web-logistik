const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { signToken } = require('../utils/jwt');

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const loginAttempts = new Map();

function clientKey(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function pruneExpiredEntries(map, now) {
  if (map.size < 5000) return;
  for (const [key, value] of map) {
    if (value.expiresAt <= now) map.delete(key);
  }
  while (map.size >= 10000) {
    map.delete(map.keys().next().value);
  }
}

function getLoginAttempt(req) {
  const now = Date.now();
  pruneExpiredEntries(loginAttempts, now);
  const key = clientKey(req);
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.expiresAt <= now) {
    return { key, count: 0, expiresAt: now + LOGIN_WINDOW_MS };
  }
  return { key, ...attempt };
}

function recordLoginFailure(req) {
  const attempt = getLoginAttempt(req);
  loginAttempts.set(attempt.key, {
    count: attempt.count + 1,
    expiresAt: attempt.expiresAt,
  });
}

function userResponse(user) {
  return { id: user.id, nama: user.nama, username: user.username, email: user.email, foto_url: user.foto_url, deskripsi: user.deskripsi, role: user.role, bidang_id: user.bidang_id, nama_bidang: user.nama_bidang };
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    const attempt = getLoginAttempt(req);

    if (attempt.count >= MAX_LOGIN_FAILURES) {
      return res.status(429).json({
        message: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.',
      });
    }

    if (
      typeof username !== 'string' ||
      !username.trim() ||
      username.trim().length > 50 ||
      typeof password !== 'string' ||
      !password ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      recordLoginFailure(req);
      return res.status(400).json({ message: 'Username atau password tidak valid.' });
    }

    const [rows] = await pool.query(
      `SELECT u.*, b.nama_bidang
       FROM users u
       LEFT JOIN bidang b ON b.id = u.bidang_id
       WHERE u.username = ? AND u.aktif = 1`,
      [username.trim()]
    );

    if (rows.length === 0) {
      recordLoginFailure(req);
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const user = rows[0];
    const passwordCocok = await bcrypt.compare(password, user.password_hash);

    if (!passwordCocok) {
      recordLoginFailure(req);
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    loginAttempts.delete(clientKey(req));
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      bidang_id: user.bidang_id,
    });

    return res.json({
      token,
      user: userResponse(user),
    });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nama, u.username, u.email, u.foto_url, u.deskripsi, u.role, u.bidang_id, b.nama_bidang
       FROM users u LEFT JOIN bidang b ON b.id = u.bidang_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });
    return res.json(userResponse(rows[0]));
  } catch (err) {
    console.error('[authController.me]', err);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}

async function updateProfile(req, res) {
  try {
    const { nama, username, email, foto_url, deskripsi } = req.body;
    if (!nama?.trim() || !username?.trim()) return res.status(400).json({ message: 'Nama dan username wajib diisi.' });
    await pool.query('UPDATE users SET nama=?, username=?, email=?, foto_url=?, deskripsi=? WHERE id=?', [nama.trim(), username.trim(), email?.trim() || null, foto_url || null, deskripsi?.trim() || null, req.user.id]);
    const [rows] = await pool.query(`SELECT u.id,u.nama,u.username,u.email,u.foto_url,u.deskripsi,u.role,u.bidang_id,b.nama_bidang FROM users u LEFT JOIN bidang b ON b.id=u.bidang_id WHERE u.id=?`, [req.user.id]);
    return res.json({ message: 'Profil berhasil diperbarui.', user: userResponse(rows[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username sudah digunakan.' });
    console.error('[authController.updateProfile]', err);
    return res.status(500).json({ message: 'Gagal memperbarui profil.' });
  }
}

module.exports = { login, me, updateProfile };
