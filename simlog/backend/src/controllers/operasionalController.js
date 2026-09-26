const { pool } = require('../config/db');

const required = (value, label) => {
  if (!value) {
    const error = new Error(`${label} wajib diisi.`);
    error.status = 400;
    throw error;
  }
};

const handler = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (err) {
    console.error('[operasional]', err);
    res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan pada server.' });
  }
};

exports.listUnboxing = handler(async (req, res) => {
  const [rows] = await pool.query(`SELECT id, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, kondisi_umum, catatan, foto_url, nama_barang_manual AS nama_barang FROM unboxing_pendataan ORDER BY tanggal DESC, id DESC`);
  res.json(rows);
});

exports.createUnboxing = handler(async (req, res) => {
  const nama_barang = req.body.nama_barang;
  const tanggal = req.body.tanggal;
  const kondisi_umum = req.body.kondisi_umum || 'Baik';
  const catatan = req.body.catatan;
  const foto_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!nama_barang) {
    return res.status(400).json({ message: 'Barang inventaris wajib diisi.' });
  }
  if (!tanggal) {
    return res.status(400).json({ message: 'Tanggal wajib diisi.' });
  }
  
  const [result] = await pool.query(
    'INSERT INTO unboxing_pendataan (tanggal, kondisi_umum, catatan, foto_url, nama_barang_manual, dilakukan_oleh) VALUES (?, ?, ?, ?, ?, ?)', 
    [tanggal, kondisi_umum, catatan || null, foto_url, nama_barang.trim(), req.user.id]
  );
  
  res.status(201).json({ id: result.insertId, message: 'Pendataan unboxing tersimpan.' });
});

exports.listPiket = handler(async (req, res) => {
  const [jadwal] = await pool.query(`SELECT j.*, b.nama_bidang FROM piket_jadwal j JOIN bidang b ON b.id=j.bidang_id ORDER BY j.minggu_mulai DESC`);
  const [pelaksanaan] = await pool.query(`SELECT p.*, b.nama_bidang FROM piket_pelaksanaan p JOIN piket_jadwal j ON j.id=p.jadwal_id JOIN bidang b ON b.id=j.bidang_id ORDER BY p.tanggal DESC`);
  res.json({ jadwal, pelaksanaan });
});

exports.createJadwalPiket = handler(async (req, res) => {
  const { bidang_id, minggu_mulai, minggu_selesai } = req.body;
  required(bidang_id, 'Bidang'); required(minggu_mulai, 'Tanggal mulai'); required(minggu_selesai, 'Tanggal selesai');
  const [result] = await pool.query('INSERT INTO piket_jadwal (bidang_id,minggu_mulai,minggu_selesai) VALUES (?,?,?)', [bidang_id, minggu_mulai, minggu_selesai]);
  res.status(201).json({ id: result.insertId, message: 'Jadwal piket tersimpan.' });
});

exports.createPelaksanaanPiket = handler(async (req, res) => {
  const { jadwal_id, tanggal, status = 'Selesai', nama_pengisi, catatan, foto_url } = req.body;
  required(jadwal_id, 'Jadwal piket'); required(tanggal, 'Tanggal');
  const [result] = await pool.query('INSERT INTO piket_pelaksanaan (jadwal_id,tanggal,status,nama_pengisi,catatan,foto_url,sumber_input) VALUES (?,?,?,?,?,?,?)', [jadwal_id, tanggal, status, nama_pengisi || null, catatan || null, foto_url || null, 'Manual']);
  res.status(201).json({ id: result.insertId, message: 'Pelaksanaan piket tersimpan.' });
});

exports.listSewa = handler(async (req, res) => {
  const [barang] = await pool.query('SELECT bs.*, k.nama_kategori FROM barang_sewa bs LEFT JOIN kategori_barang k ON k.id=bs.kategori_id ORDER BY bs.updated_at DESC');
  const [peminjaman] = await pool.query(`SELECT p.*, bs.nama_barang FROM peminjaman p JOIN barang_sewa bs ON bs.id=p.barang_sewa_id ORDER BY p.created_at DESC`);
  res.json({ barang, peminjaman });
});

exports.createBarangSewa = handler(async (req, res) => {
  const { nama_barang, kategori_id, jumlah_total } = req.body; required(nama_barang, 'Nama barang'); required(jumlah_total, 'Jumlah');
  const jumlah = Number(jumlah_total); if (!Number.isInteger(jumlah) || jumlah < 1) { const e = new Error('Jumlah harus minimal 1.'); e.status = 400; throw e; }
  const [result] = await pool.query('INSERT INTO barang_sewa (nama_barang,kategori_id,jumlah_total,jumlah_tersedia) VALUES (?,?,?,?)', [nama_barang.trim(), kategori_id || null, jumlah, jumlah]);
  res.status(201).json({ id: result.insertId, message: 'Barang sewa tersimpan.' });
});

exports.createPeminjaman = handler(async (req, res) => {
  const { barang_sewa_id, nama_penyewa, kontak_penyewa, jumlah_dipinjam, tanggal_mulai, tanggal_kembali_rencana, catatan } = req.body;
  required(barang_sewa_id, 'Barang'); required(nama_penyewa, 'Penyewa'); required(tanggal_mulai, 'Tanggal mulai'); required(tanggal_kembali_rencana, 'Tanggal kembali');
  const jumlah = Number(jumlah_dipinjam); const conn = await pool.getConnection();
  try {
    await conn.beginTransaction(); const [[barang]] = await conn.query('SELECT * FROM barang_sewa WHERE id=? FOR UPDATE', [barang_sewa_id]);
    if (!barang || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > barang.jumlah_tersedia) { const e = new Error('Stok barang tidak mencukupi.'); e.status = 400; throw e; }
    const [result] = await conn.query('INSERT INTO peminjaman (barang_sewa_id,nama_penyewa,kontak_penyewa,jumlah_dipinjam,tanggal_mulai,tanggal_kembali_rencana,catatan,dicatat_oleh) VALUES (?,?,?,?,?,?,?,?)', [barang_sewa_id, nama_penyewa, kontak_penyewa || null, jumlah, tanggal_mulai, tanggal_kembali_rencana, catatan || null, req.user.id]);
    const tersedia = barang.jumlah_tersedia - jumlah; await conn.query('UPDATE barang_sewa SET jumlah_tersedia=?,jumlah_disewa=jumlah_disewa+?,status=? WHERE id=?', [tersedia, jumlah, tersedia === 0 ? 'Disewa' : 'Sebagian Disewa', barang_sewa_id]);
    await conn.commit(); res.status(201).json({ id: result.insertId, message: 'Peminjaman tersimpan.' });
  } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
});

exports.listPengadaan = handler(async (req, res) => { const [rows] = await pool.query('SELECT p.*, r.nama_ruangan FROM pengadaan p LEFT JOIN ruangan r ON r.id=p.lokasi_id ORDER BY p.tanggal DESC,p.id DESC'); res.json(rows); });

exports.createPengadaan = handler(async (req, res) => {
  const { nama_barang, jumlah = 1, tanggal, harga, sumber_dana, kondisi = 'Baik', lokasi_id, catatan } = req.body; required(nama_barang, 'Nama barang'); required(tanggal, 'Tanggal');
  const [result] = await pool.query('INSERT INTO pengadaan (nama_barang,jumlah,tanggal,harga,sumber_dana,kondisi,lokasi_id,catatan,dicatat_oleh) VALUES (?,?,?,?,?,?,?,?,?)', [nama_barang.trim(), jumlah, tanggal, harga || null, sumber_dana || null, kondisi, lokasi_id || null, catatan || null, req.user.id]);
  res.status(201).json({ id: result.insertId, message: 'Pengadaan tersimpan.' });
});

exports.listRevitalisasi = handler(async (req, res) => { const [laporan] = await pool.query(`SELECT k.*, i.nama_barang FROM kerusakan_laporan k LEFT JOIN inventaris i ON i.id=k.inventaris_id ORDER BY k.created_at DESC`); const [revitalisasi] = await pool.query(`SELECT r.*, i.nama_barang FROM revitalisasi r JOIN inventaris i ON i.id=r.inventaris_id ORDER BY r.created_at DESC`); res.json({ laporan, revitalisasi }); });

exports.createLaporanKerusakan = handler(async (req, res) => { const { inventaris_id, tanggal_lapor, deskripsi, foto_url } = req.body; required(tanggal_lapor, 'Tanggal laporan'); required(deskripsi, 'Deskripsi'); const [result] = await pool.query('INSERT INTO kerusakan_laporan (inventaris_id,dilaporkan_oleh,tanggal_lapor,deskripsi,foto_url) VALUES (?,?,?,?,?)', [inventaris_id || null, req.user.id, tanggal_lapor, deskripsi, foto_url || null]); res.status(201).json({ id: result.insertId, message: 'Laporan kerusakan tersimpan.' }); });
