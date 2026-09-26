const express = require('express');
const multer = require('multer');
const path = require('path');
const c = require('../controllers/operasionalController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();
router.use(requireAuth);

const admin = requireRole('admin_logistik');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/unboxing', c.listUnboxing);
router.post('/unboxing', admin, upload.single('foto'), c.createUnboxing);

router.get('/piket', c.listPiket); 
router.post('/piket/jadwal', admin, c.createJadwalPiket); 
router.post('/piket/pelaksanaan', admin, c.createPelaksanaanPiket);

router.get('/sewa', c.listSewa); 
router.post('/sewa/barang', admin, c.createBarangSewa); 
router.post('/sewa/peminjaman', admin, c.createPeminjaman);

router.get('/pengadaan', c.listPengadaan); 
router.post('/pengadaan', admin, c.createPengadaan);

router.get('/revitalisasi', c.listRevitalisasi); 
router.post('/revitalisasi/laporan', admin, c.createLaporanKerusakan); 
router.post('/revitalisasi', admin, c.createRevitalisasi);

router.get('/laporan', c.report);

module.exports = router;