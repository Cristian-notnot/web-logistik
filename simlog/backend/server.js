require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./src/config/db');
const routes = require('./src/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Foto barang yang diunggah bisa diakses langsung, misal:
// http://localhost:5000/uploads/nama-file.jpg
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SIM Logistik HW UNIMUS API' });
});

app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// Error handler umum (termasuk error dari multer)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan pada server.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\nSIM Logistik HW UNIMUS API berjalan di http://localhost:${PORT}`);
  await testConnection();
});
