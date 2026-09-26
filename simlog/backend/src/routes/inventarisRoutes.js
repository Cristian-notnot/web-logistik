const express = require('express');
const router = express.Router();
const inventarisController = require('../controllers/inventarisController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(requireAuth); // semua endpoint inventaris wajib login

router.get('/ringkasan', inventarisController.ringkasan);
router.get('/aktivitas-terbaru', inventarisController.aktivitasTerbaru);
router.get('/', inventarisController.list);
router.get('/:id', inventarisController.detail);
router.get('/:id/riwayat', inventarisController.riwayat);

// Hanya admin logistik yang boleh ubah data inventaris.
// Anggota/bidang & ketua/pembina hanya bisa melihat (read-only lewat GET di atas).
router.post('/', requireRole('admin_logistik'), inventarisController.create);
router.put('/:id', requireRole('admin_logistik'), inventarisController.update);
router.delete('/:id', requireRole('admin_logistik'), inventarisController.remove);

module.exports = router;
