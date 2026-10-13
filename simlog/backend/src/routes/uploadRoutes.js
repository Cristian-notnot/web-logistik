const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { secureImageUpload } = require('../middleware/secureImageUpload');

const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const imageUpload = secureImageUpload(uploadDir);

// POST /api/upload  (field name: "foto") -> mengembalikan URL relatif untuk disimpan di foto_url
router.post('/', requireAuth, imageUpload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
  const relativeUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({ url: relativeUrl });
});

module.exports = router;
