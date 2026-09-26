const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(requireAuth);

router.get('/kategori', masterDataController.listKategori);
router.post('/kategori', requireRole('admin_logistik'), masterDataController.createKategori);

router.get('/ruangan', masterDataController.listRuangan);
router.post('/ruangan', requireRole('admin_logistik'), masterDataController.createRuangan);

router.get('/bidang', masterDataController.listBidang);

module.exports = router;
