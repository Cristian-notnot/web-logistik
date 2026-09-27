require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { testConnection } = require('./src/config/db');
const routes = require('./src/routes');

const app = express();

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

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ========================================
// GLOBAL MIDDLEWARE
// ========================================

app.use(cors());

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
  express.static(uploadDir)
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
        'Ukuran file terlalu besar. Maksimal 5 MB.',
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



app.listen(PORT, async () => {
  console.log(
    `SIM Logistik HW UNIMUS API berjalan di http://localhost:${PORT}`
  );

  await testConnection();
});