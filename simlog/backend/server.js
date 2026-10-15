require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./src/config/db');
const routes = require('./src/routes');

const app = express();

// Izinkan semua HP dan device luar untuk mengakses API ini
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


const PORT = Number(
  process.env.PORT || 5000
);

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.resolve(
  __dirname,
  process.env.UPLOAD_DIR || 'uploads'
);

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// ========================================
// STATIC UPLOAD
// ========================================

app.use(
  '/uploads',
  (req, res, next) => {
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(req.path).toLowerCase())) {
      return res.status(404).json({ message: 'File tidak ditemukan.' });
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return next();
  },
  express.static(uploadDir, {
    dotfiles: 'deny',
    index: false,
  })
);

// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service:
      'SIM Logistik HW UNIMUS API',
    time: new Date().toISOString(),
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const { pool } = require('./src/config/db');
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM users');
    res.json({ ok: true, jumlah_user: rows[0].total, db_host: process.env.DB_HOST ? 'terisi' : 'KOSONG' });
  } catch (e) {
    res.status(500).json({ ok: false, code: e.code, message: e.message });
  }
});

app.use('/api', routes);



app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan.',
  });
});



app.use((err, req, res, next) => {
  console.error(
    '[Unhandled Error]',
    err
  );

  if (
    err?.code === 'LIMIT_FILE_SIZE'
  ) {
    return res.status(413).json({
      message:
        'Ukuran file terlalu besar. Periksa batas ukuran untuk jenis unggahan ini.',
    });
  }

  return res
    .status(err.status || 500)
    .json({
      message:
        err.message ||
        'Terjadi kesalahan pada server.',
    });
});



if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(
      `SIM Logistik HW UNIMUS API berjalan di http://localhost:${PORT}`
    );

    await testConnection();
  });
}

module.exports = app;