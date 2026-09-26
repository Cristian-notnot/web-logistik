// Membatasi akses endpoint berdasarkan role.
// Contoh pakai: requireRole('admin_logistik')
//               requireRole('admin_logistik', 'ketua_pembina')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Belum login.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Kamu tidak punya akses untuk melakukan aksi ini.' });
    }
    next();
  };
}

module.exports = { requireRole };
