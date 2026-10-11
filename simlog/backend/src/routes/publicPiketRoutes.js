const express = require('express');
const multer = require('multer');
const controller = require('../controllers/publicPiketController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Foto harus berformat JPEG, PNG, atau WebP.');
      error.status = 415;
      return callback(error);
    }
    callback(null, true);
  },
});

router.get('/', controller.getFormData);
router.post('/', upload.single('foto'), controller.submitPiket);

module.exports = router;
