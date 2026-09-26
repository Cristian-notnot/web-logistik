require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { testConnection, db } = require('./src/config/db');
const routes = require('./src/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SIM Logistik HW UNIMUS API' });
});

app.post('/api/inventaris/manual', (req, res) => {
  const { nama_barang, tanggal_pendataan, kondisi, catatan } = req.body;
  const query = `INSERT INTO inventaris (nama_barang, tanggal_pendataan, kondisi, catatan, sumber) VALUES (?, ?, ?, ?, 'Manual')`;
  db.query(query, [nama_barang, tanggal_pendataan, kondisi, catatan], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ status: 'success', id: result.insertId });
  });
});

app.post('/api/piket/jadwal', (req, res) => {
  const { bidang_id, piket_hari_ke, minggu_mulai, minggu_selesai } = req.body;
  const query = `INSERT INTO piket_jadwal (bidang_id, piket_hari_ke, minggu_mulai, minggu_selesai) VALUES (?, ?, ?, ?)`;
  db.query(query, [bidang_id, piket_hari_ke, minggu_mulai, minggu_selesai], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ status: 'success', id: result.insertId });
  });
});

app.post('/api/piket/pelaksanaan', upload.single('foto'), (req, res) => {
  const { jadwal_id, tanggal, nama_pengisi, bidang_id, catatan } = req.body;
  const foto_url = req.file ? `/uploads/${req.file.filename}` : '';
  const query = `INSERT INTO piket_pelaksanaan (jadwal_id, tanggal, nama_pengisi, bidang_id, catatan, foto_url, status, sumber_input) VALUES (?, ?, ?, ?, ?, ?, 'Selesai', 'Manual')`;
  db.query(query, [jadwal_id, tanggal, nama_pengisi, bidang_id, catatan, foto_url], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ status: 'success', id: result.insertId });
  });
});

app.post('/api/pinput/gform-peminjaman', (req, res) => {
  const { barang_sewa_id, nama_penyewa, kontak_penyewa, jumlah_dipinjam, tanggal_mulai, tanggal_kembali_rencana, surat_peminjaman_url, ktm_url, catatan, google_form_response_id } = req.body;
  const query = `INSERT INTO peminjaman (barang_sewa_id, nama_penyewa, kontak_penyewa, jumlah_dipinjam, tanggal_mulai, tanggal_kembali_rencana, status, surat_peminjaman_url, ktm_url, catatan, sumber_input, google_form_response_id) VALUES (?, ?, ?, ?, ?, ?, 'Berjalan', ?, ?, ?, 'Google Form', ?)`;
  db.query(query, [barang_sewa_id, nama_penyewa, kontak_penyewa, jumlah_dipinjam, tanggal_mulai, tanggal_kembali_rencana, surat_peminjaman_url, ktm_url, catatan, google_form_response_id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ status: 'success', id: result.insertId });
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan pada server.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\nSIM Logistik HW UNIMUS API berjalan di http://localhost:${PORT}`);
  await testConnection();
});
