const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const c = require(
  '../controllers/operasionalController'
);

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

if (
  !fs.existsSync(uploadDir)
) {
  fs.mkdirSync(
    uploadDir,
    {
      recursive: true,
    }
  );
}

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDir
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const name =
        `${Date.now()}-${Math.round(
          Math.random() *
            1e9
        )}`;

      const ext =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      cb(
        null,
        `${name}${ext}`
      );
    },
  });

const upload = multer({
  storage,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    const allowed = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
    ];

    const ext =
      path
        .extname(
          file.originalname
        )
        .toLowerCase();

    if (
      !allowed.includes(ext)
    ) {
      return cb(
        new Error(
          'Format file harus JPG, JPEG, PNG, atau WEBP.'
        )
      );
    }

    cb(null, true);
  },
});

router.get(
  '/unboxing',
  c.listUnboxing
);

router.post(
  '/unboxing',
  admin,
  upload.single('foto'),
  c.createUnboxing
);

router.get(
  '/piket',
  c.listPiket
);

router.post(
  '/piket/jadwal',
  admin,
  upload.none(),
  c.createJadwalPiket
);

router.post(
  '/piket/pelaksanaan',
  upload.single('foto'),
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
  upload.single('foto_identitas'),
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
  upload.single('foto'),
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
