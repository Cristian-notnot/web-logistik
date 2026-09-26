const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/inventaris', require('./inventarisRoutes'));
router.use('/master', require('./masterDataRoutes'));
router.use('/upload', require('./uploadRoutes'));
router.use('/operasional', require('./operasionalRoutes'));

// --- Modul fase berikutnya (roadmap) ---
// Rute-rute ini akan diaktifkan bertahap sesuai urutan prioritas:
// router.use('/unboxing', require('./unboxingRoutes'));
// router.use('/piket', require('./piketRoutes'));
// router.use('/sewa', require('./sewaRoutes'));
// router.use('/pengadaan', require('./pengadaanRoutes'));
// router.use('/revitalisasi', require('./revitalisasiRoutes'));
// router.use('/laporan', require('./laporanRoutes'));

module.exports = router;
