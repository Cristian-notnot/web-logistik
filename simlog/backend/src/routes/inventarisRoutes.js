const express = require('express');
const router = express.Router();
const path = require('path');

const inventarisController = require('../controllers/inventarisController');

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { secureImageUpload } = require('../middleware/secureImageUpload');

router.use(requireAuth);

const admin = requireRole('admin_logistik');


// =======================
// Upload Foto
// =======================

const uploadDir = path.resolve(
  __dirname,
  '..',
  '..',
  process.env.UPLOAD_DIR || 'uploads'
);

const imageUpload = secureImageUpload(uploadDir);


// =======================
// Inventaris
// =======================

router.get(
  '/ringkasan',
  inventarisController.ringkasan
);


router.get(
  '/aktivitas-terbaru',
  inventarisController.aktivitasTerbaru
);


router.get(
  '/',
  inventarisController.list
);


router.get(
  '/:id',
  inventarisController.detail
);


router.get(
  '/:id/riwayat',
  inventarisController.riwayat
);


// TAMBAH BARANG
router.post(
  '/',
  admin,
  imageUpload.single('foto'),
  inventarisController.create
);


// EDIT BARANG
router.put(
  '/:id',
  admin,
  imageUpload.single('foto'),
  inventarisController.update
);


// HAPUS BARANG
router.delete(
  '/:id',
  admin,
  inventarisController.remove
);


module.exports = router;