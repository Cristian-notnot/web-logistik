const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const inventarisController = require('../controllers/inventarisController');

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

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

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    cb(null, `${name}${ext}`);
  },
});


const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
    ];

    const ext = path
      .extname(file.originalname)
      .toLowerCase();


    if (!allowed.includes(ext)) {
      return cb(
        new Error(
          'Format file harus JPG, JPEG, PNG, atau WEBP.'
        )
      );
    }

    cb(null, true);
  },
});


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
  upload.single('foto'),
  inventarisController.create
);


// EDIT BARANG
router.put(
  '/:id',
  admin,
  upload.single('foto'),
  inventarisController.update
);


// HAPUS BARANG
router.delete(
  '/:id',
  admin,
  inventarisController.remove
);


module.exports = router;