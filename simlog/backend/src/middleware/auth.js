const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/db');

// Memastikan request punya token JWT yang valid di header Authorization.
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login kembali.' });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Sesi kamu sudah berakhir. Silakan login kembali.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, bidang_id FROM users WHERE id = ? AND aktif = 1 LIMIT 1',
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Akun tidak aktif atau tidak ditemukan. Silakan login kembali.' });
    }

    const user = rows[0];
    req.user = {
      ...decoded,
      id: user.id,
      username: user.username,
      role: user.role,
      bidang_id: user.bidang_id,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAuth };
