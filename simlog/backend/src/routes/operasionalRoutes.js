const express = require('express');
const multer = require('multer');
const path = require('path');

const c = require(
  '../controllers/operasionalController'
);
const publicPiketController = require('../controllers/publicPiketController');
const { secureImageUpload } = require('../middleware/secureImageUpload');

const {
  requireAuth,
} = require('../middleware/auth');

const {
  requireRole,
} = require('../middleware/role');

const router =
  express.Router();

router.use(requireAuth);

const admin = requireRole(
  'admin_logistik'
);
const uploadDir =
  path.resolve(
    __dirname,
    '..',
    '..',
    process.env.UPLOAD_DIR ||
      'uploads'
  );

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const imageUpload = secureImageUpload(uploadDir);

router.get(
  '/unboxing',
  c.listUnboxing
);

router.post(
  '/unboxing',
  admin,
  imageUpload.single('foto'),
  c.createUnboxing
);

router.get(
  '/piket',
  admin,
  c.listPiket
);

router.get(
  '/piket/:id/foto',
  admin,
  publicPiketController.getPiketPhoto
);

router.put(
  '/piket/pelaksanaan/:id/verifikasi',
  admin,
  c.verifyPiket
);

router.post(
  '/piket/jadwal',
  admin,
  upload.none(),
  c.createJadwalPiket
);

router.post(
  '/piket/pelaksanaan',
  admin,
  imageUpload.single('foto'),
  c.createPelaksanaanPiket
);

router.get(
  '/sewa',
  c.listSewa
);

router.post(
  '/sewa/barang',
  admin,
   upload.none(), 
  c.createBarangSewa
);


router.post(
  '/sewa/peminjaman',
  admin,
  imageUpload.single('foto_identitas'),
  c.createPeminjaman
);

router.get(
  '/pengadaan',
  c.listPengadaan
);

router.post(
  '/pengadaan',
  admin,
  upload.none(),
  c.createPengadaan
);

router.get(
  '/revitalisasi',
  c.listRevitalisasi
);

router.post(
  '/revitalisasi/laporan',
  admin,
  imageUpload.single('foto'),
  c.createLaporanKerusakan
);

router.post(
  '/revitalisasi',
  admin,
  upload.none(),
  c.createRevitalisasi
);

router.get(
  '/laporan',
  c.getLaporan
);

router.put('/peminjaman/:id/approve', admin, c.approvePeminjaman);
router.put('/peminjaman/:id/return', admin, c.returnPeminjaman);
router.put('/sewa/barang/:id', admin, upload.none(), c.updateBarangSewa);


module.exports = router;
