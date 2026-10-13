const express = require('express');
const multer = require('multer');
const controller = require('../controllers/publicPiketController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get('/', controller.getFormData);
router.post('/', upload.single('foto'), controller.submitPiket);

module.exports = router;
