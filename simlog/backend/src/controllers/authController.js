const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { signToken } = require('../utils/jwt');
const sharp = require('sharp');

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const loginAttempts = new Map();
const captchaRequests = new Map();

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

async function issueCaptcha(req, res) {
  const now = Date.now();
  pruneExpiredEntries(captchaRequests, now);
  const ip = clientKey(req);
  const request = captchaRequests.get(ip);
  if (request && request.expiresAt > now && request.count >= 30) {
    return res.status(429).json({ message: 'Terlalu banyak permintaan kode. Coba lagi beberapa menit.' });
  }
  captchaRequests.set(ip, {
    count: request && request.expiresAt > now ? request.count + 1 : 1,
    expiresAt: request && request.expiresAt > now ? request.expiresAt : now + LOGIN_WINDOW_MS,
  });

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const answer = Array.from(
    crypto.randomBytes(6),
    (value) => alphabet[value % alphabet.length]
  ).join('');
  const id = crypto.randomBytes(24).toString('hex');
  const imageChars = [...answer].map((character, index) => {
    const x = 22 + index * 34;
    const y = 34 + crypto.randomInt(-5, 6);
    const rotation = crypto.randomInt(-18, 19);
    return `<text x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})">${character}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="230" height="56" viewBox="0 0 230 56"><rect width="230" height="56" rx="10" fill="#ecfdf5"/><path d="M8 40L220 12M12 10L215 45M20 50L200 8" stroke="#a7f3d0" stroke-width="2"/> <g fill="#065f46" font-family="monospace" font-size="27" font-weight="700" letter-spacing="2">${imageChars}</g></svg>`;

  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  const answerHash = crypto.createHash('sha256').update(answer).digest('hex');
  const clientHash = crypto.createHash('sha256').update(ip).digest('hex');
  await pool.query(
    `DELETE FROM auth_captcha_challenges
     WHERE expires_at <= UTC_TIMESTAMP(3)
     LIMIT 1000`
  );
  await pool.query(
    `INSERT INTO auth_captcha_challenges
       (challenge_id, answer_hash, client_hash, expires_at)
     VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE))`,
    [id, answerHash, clientHash]
  );
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.json({
    challengeId: id,
    image: `data:image/png;base64,${image.toString('base64')}`,
  });
}

async function consumeCaptcha(req, challengeId, answer) {
  if (
    typeof challengeId !== 'string' ||
    !/^[a-f0-9]{48}$/.test(challengeId) ||
    typeof answer !== 'string'
  ) return false;

  const connection = await pool.getConnection();
  let challenge;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT answer_hash, client_hash, expires_at > UTC_TIMESTAMP(3) AS is_valid
       FROM auth_captcha_challenges
       WHERE challenge_id = ?
       FOR UPDATE`,
      [challengeId]
    );
    challenge = rows[0];
    await connection.query(
      'DELETE FROM auth_captcha_challenges WHERE challenge_id = ?',
      [challengeId]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const clientHash = crypto.createHash('sha256').update(clientKey(req)).digest();
  if (
    !challenge ||
    !challenge.is_valid ||
    !/^[a-z0-9]{6}$/i.test(answer.trim())
  ) return false;

  const storedClientHash = Buffer.from(challenge.client_hash, 'hex');
  if (
    storedClientHash.length !== clientHash.length ||
    !crypto.timingSafeEqual(storedClientHash, clientHash)
  ) return false;

  const expected = Buffer.from(challenge.answer_hash, 'hex');
  const provided = crypto.createHash('sha256')
    .update(answer.trim().toUpperCase())
    .digest();
  return crypto.timingSafeEqual(expected, provided);
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

async function getCaptcha(req, res, next) {
  try {
    return await issueCaptcha(req, res);
  } catch (error) {
    return next(error);
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const {
      username,
      password,
      captchaId,
      captchaCode,
    } = req.body || {};
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

    if (!await consumeCaptcha(req, captchaId, captchaCode)) {
      recordLoginFailure(req);
      return res.status(400).json({ message: 'Kode acak salah atau kedaluwarsa. Muat kode baru.' });
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

module.exports = { getCaptcha, login, me, updateProfile };
