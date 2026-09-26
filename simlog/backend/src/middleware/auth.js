const { verifyToken } = require('../utils/jwt');

// Memastikan request punya token JWT yang valid di header Authorization.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login kembali.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, username, role, bidang_id }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Sesi kamu sudah berakhir. Silakan login kembali.' });
  }
}

module.exports = { requireAuth };
