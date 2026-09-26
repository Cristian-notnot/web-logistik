const { pool } = require('../config/db');

// GET /api/master/kategori
async function listKategori(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM kategori_barang ORDER BY nama_kategori');
    return res.json(rows);
  } catch (err) {
    console.error('[masterDataController.listKategori]', err);
    return res.status(500).json({ message: 'Gagal mengambil data kategori.' });
  }
}

// POST /api/master/kategori
async function createKategori(req, res) {
  try {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    const [result] = await pool.query('INSERT INTO kategori_barang (nama_kategori) VALUES (?)', [nama_kategori]);
    return res.status(201).json({ id: result.insertId, nama_kategori });
  } catch (err) {
    console.error('[masterDataController.createKategori]', err);
    return res.status(500).json({ message: 'Gagal menambahkan kategori (mungkin sudah ada).' });
  }
}

// GET /api/master/ruangan
async function listRuangan(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM ruangan ORDER BY nama_ruangan');
    return res.json(rows);
  } catch (err) {
    console.error('[masterDataController.listRuangan]', err);
    return res.status(500).json({ message: 'Gagal mengambil data ruangan.' });
  }
}

// POST /api/master/ruangan
async function createRuangan(req, res) {
  try {
    const { nama_ruangan, lokasi, deskripsi } = req.body;
    if (!nama_ruangan) return res.status(400).json({ message: 'Nama ruangan wajib diisi.' });
    const [result] = await pool.query(
      'INSERT INTO ruangan (nama_ruangan, lokasi, deskripsi) VALUES (?, ?, ?)',
      [nama_ruangan, lokasi || null, deskripsi || null]
    );
    return res.status(201).json({ id: result.insertId, nama_ruangan });
  } catch (err) {
    console.error('[masterDataController.createRuangan]', err);
    return res.status(500).json({ message: 'Gagal menambahkan ruangan.' });
  }
}

// GET /api/master/bidang
async function listBidang(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM bidang WHERE aktif = 1 ORDER BY urutan_rotasi');
    return res.json(rows);
  } catch (err) {
    console.error('[masterDataController.listBidang]', err);
    return res.status(500).json({ message: 'Gagal mengambil data bidang.' });
  }
}

module.exports = { listKategori, createKategori, listRuangan, createRuangan, listBidang };
