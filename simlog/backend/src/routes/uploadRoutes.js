const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Hanya file gambar (jpg, jpeg, png, webp) yang diizinkan.'));
  },
});

// POST /api/upload  (field name: "foto") -> mengembalikan URL relatif untuk disimpan di foto_url
router.post('/', requireAuth, upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
  const relativeUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({ url: relativeUrl });
});

module.exports = router;
