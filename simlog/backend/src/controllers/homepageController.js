const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const handler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseActive(value, fallback = 1) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase()) ? 1 : 0;
}

function parseOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const order = Number(value);
  if (!Number.isInteger(order) || order < 0) {
    throw httpError(400, 'Urutan harus berupa bilangan bulat positif atau nol.');
  }
  return order;
}

function imageUrl(req, existingUrl = null) {
  return req.file ? `/uploads/homepage/${req.file.filename}` : (req.body.image_url ?? existingUrl);
}

function imageSettings(req, existing = {}) {
  const zoom = req.body.image_zoom === undefined ? Number(existing.image_zoom || 1) : Number(req.body.image_zoom);
  const x = req.body.image_x === undefined ? Number(existing.image_x ?? 50) : Number(req.body.image_x);
  const y = req.body.image_y === undefined ? Number(existing.image_y ?? 50) : Number(req.body.image_y);
  if (!Number.isFinite(zoom) || zoom < 1 || zoom > 3) {
    throw httpError(400, 'Zoom foto harus antara 1x dan 3x.');
  }
  if (!Number.isInteger(x) || x < 0 || x > 100 || !Number.isInteger(y) || y < 0 || y > 100) {
    throw httpError(400, 'Posisi crop foto harus antara 0 dan 100.');
  }
  return [zoom, x, y];
}

function removeHomepageImage(image) {
  if (typeof image !== 'string' || !image.startsWith('/uploads/homepage/')) return;
  const uploadRoot = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
  const homepageRoot = path.resolve(uploadRoot, 'homepage');
  const target = path.resolve(homepageRoot, path.basename(image));
  if (!target.startsWith(`${homepageRoot}${path.sep}`)) return;
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

async function findById(table, id) {
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, 'Konten tidak ditemukan.');
  return rows[0];
}

exports.getPublicHomepage = handler(async (req, res) => {
  const [slides, about, units, bph, activities, news] = await Promise.all([
    pool.query(`SELECT id, image_url, image_zoom, image_x, image_y, image_position, label, title, description, urutan
      FROM homepage_slides WHERE aktif = 1 ORDER BY urutan ASC, id ASC`),
    pool.query(`SELECT label, title, paragraf_pertama, paragraf_kedua
      FROM homepage_about WHERE id = 1 LIMIT 1`),
    pool.query(`SELECT id, jenis, urutan, nama, deskripsi, image_url, image_zoom, image_x, image_y
      FROM homepage_bidang WHERE aktif = 1 ORDER BY urutan ASC, id ASC`),
    pool.query(`SELECT id, jabatan, nama, deskripsi, image_url, image_zoom, image_x, image_y, urutan
      FROM homepage_bph WHERE aktif = 1 ORDER BY urutan ASC, id ASC`),
    pool.query(`SELECT id, image_url, image_zoom, image_x, image_y, title, caption, urutan
      FROM homepage_kegiatan WHERE aktif = 1 ORDER BY urutan ASC, id ASC LIMIT 3`),
    pool.query(`SELECT id, image_url, image_zoom, image_x, image_y, kategori, title, ringkasan, isi, urutan, created_at
      FROM homepage_berita WHERE aktif = 1 ORDER BY urutan ASC, created_at DESC, id DESC LIMIT 6`),
  ]);

  const unitsRows = units[0];
  res.json({
    slides: slides[0],
    about: about[0][0] || null,
    bidang: unitsRows.filter((item) => item.jenis === 'bidang'),
    bkm: unitsRows.filter((item) => item.jenis === 'bkm'),
    bph: bph[0],
    kegiatan: activities[0],
    berita: news[0],
  });
});

exports.listSlides = handler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM homepage_slides ORDER BY urutan ASC, id ASC');
  res.json(rows);
});

exports.createSlide = handler(async (req, res) => {
  const { label = '', title = '', description = '', image_position = 'center' } = req.body;
  const [zoom, x, y] = imageSettings(req);
  if (!['center', 'top', 'bottom'].includes(image_position)) {
    throw httpError(400, 'Posisi foto tidak valid.');
  }
  const [result] = await pool.query(
    `INSERT INTO homepage_slides (image_url, image_zoom, image_x, image_y, image_position, label, title, description, urutan, aktif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [imageUrl(req), zoom, x, y, image_position, label.trim(), title.trim(), description.trim(), parseOrder(req.body.urutan), parseActive(req.body.aktif)]
  );
  res.status(201).json({ id: result.insertId, message: 'Slide berhasil ditambahkan.' });
});

exports.updateSlide = handler(async (req, res) => {
  const existing = await findById('homepage_slides', req.params.id);
  const { label = existing.label, title = existing.title, description = existing.description, image_position = existing.image_position } = req.body;
  if (!['center', 'top', 'bottom'].includes(image_position)) {
    throw httpError(400, 'Posisi foto tidak valid.');
  }
  const nextImage = imageUrl(req, existing.image_url);
  const [zoom, x, y] = imageSettings(req, existing);
  await pool.query(
    `UPDATE homepage_slides SET image_url = ?, image_zoom = ?, image_x = ?, image_y = ?, image_position = ?, label = ?, title = ?, description = ?, urutan = ?, aktif = ? WHERE id = ?`,
    [nextImage, zoom, x, y, image_position, label.trim(), title.trim(), description.trim(), parseOrder(req.body.urutan, existing.urutan), parseActive(req.body.aktif, existing.aktif), req.params.id]
  );
  if (req.file && existing.image_url !== nextImage) removeHomepageImage(existing.image_url);
  res.json({ message: 'Slide berhasil diperbarui.' });
});

exports.deleteSlide = handler(async (req, res) => {
  const existing = await findById('homepage_slides', req.params.id);
  await pool.query('DELETE FROM homepage_slides WHERE id = ?', [req.params.id]);
  removeHomepageImage(existing.image_url);
  res.json({ message: 'Slide berhasil dihapus.' });
});

exports.updateAbout = handler(async (req, res) => {
  const { label = '', title = '', paragraf_pertama = '', paragraf_kedua = '' } = req.body;
  await pool.query(
    `INSERT INTO homepage_about (id, label, title, paragraf_pertama, paragraf_kedua)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE label = VALUES(label), title = VALUES(title),
       paragraf_pertama = VALUES(paragraf_pertama), paragraf_kedua = VALUES(paragraf_kedua)`,
    [label.trim(), title.trim(), paragraf_pertama.trim(), paragraf_kedua.trim()]
  );
  res.json({ message: 'Konten Tentang berhasil disimpan.' });
});

exports.listUnits = handler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM homepage_bidang WHERE jenis = ? ORDER BY urutan ASC, id ASC',
    [req.homepageKind]
  );
  res.json(rows);
});

exports.createUnit = handler(async (req, res) => {
  const { nama = '', deskripsi = '' } = req.body;
  const [zoom, x, y] = imageSettings(req);
  if (!nama.trim()) throw httpError(400, 'Nama bidang wajib diisi.');
  const [result] = await pool.query(
    `INSERT INTO homepage_bidang (jenis, urutan, nama, deskripsi, image_url, image_zoom, image_x, image_y, aktif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.homepageKind, parseOrder(req.body.urutan), nama.trim(), deskripsi.trim(), imageUrl(req), zoom, x, y, parseActive(req.body.aktif)]
  );
  res.status(201).json({ id: result.insertId, message: 'Data berhasil ditambahkan.' });
});

exports.updateUnit = handler(async (req, res) => {
  const existing = await findById('homepage_bidang', req.params.id);
  if (existing.jenis !== req.homepageKind) throw httpError(404, 'Konten tidak ditemukan.');
  const { nama = existing.nama, deskripsi = existing.deskripsi } = req.body;
  if (!nama.trim()) throw httpError(400, 'Nama bidang wajib diisi.');
  const nextImage = imageUrl(req, existing.image_url);
  const [zoom, x, y] = imageSettings(req, existing);
  await pool.query(
    `UPDATE homepage_bidang SET urutan = ?, nama = ?, deskripsi = ?, image_url = ?, image_zoom = ?, image_x = ?, image_y = ?, aktif = ? WHERE id = ? AND jenis = ?`,
    [parseOrder(req.body.urutan, existing.urutan), nama.trim(), deskripsi.trim(), nextImage, zoom, x, y, parseActive(req.body.aktif, existing.aktif), req.params.id, req.homepageKind]
  );
  if (req.file && existing.image_url !== nextImage) removeHomepageImage(existing.image_url);
  res.json({ message: 'Data berhasil diperbarui.' });
});

exports.deleteUnit = handler(async (req, res) => {
  const existing = await findById('homepage_bidang', req.params.id);
  if (existing.jenis !== req.homepageKind) throw httpError(404, 'Konten tidak ditemukan.');
  await pool.query('DELETE FROM homepage_bidang WHERE id = ? AND jenis = ?', [req.params.id, req.homepageKind]);
  removeHomepageImage(existing.image_url);
  res.json({ message: 'Data berhasil dihapus.' });
});

exports.listBph = handler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM homepage_bph ORDER BY urutan ASC, id ASC');
  res.json(rows);
});

exports.updateBph = handler(async (req, res) => {
  const existing = await findById('homepage_bph', req.params.id);
  const { nama = existing.nama, deskripsi = existing.deskripsi } = req.body;
  const nextImage = imageUrl(req, existing.image_url);
  const [zoom, x, y] = imageSettings(req, existing);
  await pool.query(
    `UPDATE homepage_bph SET nama = ?, deskripsi = ?, image_url = ?, image_zoom = ?, image_x = ?, image_y = ?, aktif = ? WHERE id = ?`,
    [
      nama.trim(),
      deskripsi.trim(),
      nextImage,
      zoom,
      x,
      y,
      parseActive(req.body.aktif, existing.aktif),
      req.params.id,
    ]
  );
  if (req.file && existing.image_url !== nextImage) removeHomepageImage(existing.image_url);
  res.json({ message: 'Data BPH berhasil diperbarui.' });
});

exports.listActivities = handler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM homepage_kegiatan ORDER BY urutan ASC, id ASC');
  res.json(rows);
});

exports.createActivity = handler(async (req, res) => {
  const { title = '', caption = '' } = req.body;
  const [zoom, x, y] = imageSettings(req);
  if (!title.trim()) throw httpError(400, 'Judul kegiatan wajib diisi.');
  const [result] = await pool.query(
    `INSERT INTO homepage_kegiatan (image_url, image_zoom, image_x, image_y, title, caption, urutan, aktif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [imageUrl(req), zoom, x, y, title.trim(), caption.trim(), parseOrder(req.body.urutan), parseActive(req.body.aktif)]
  );
  res.status(201).json({ id: result.insertId, message: 'Kegiatan berhasil ditambahkan.' });
});

exports.updateActivity = handler(async (req, res) => {
  const existing = await findById('homepage_kegiatan', req.params.id);
  const { title = existing.title, caption = existing.caption } = req.body;
  if (!title.trim()) throw httpError(400, 'Judul kegiatan wajib diisi.');
  const nextImage = imageUrl(req, existing.image_url);
  const [zoom, x, y] = imageSettings(req, existing);
  await pool.query(
    `UPDATE homepage_kegiatan SET image_url = ?, image_zoom = ?, image_x = ?, image_y = ?, title = ?, caption = ?, urutan = ?, aktif = ? WHERE id = ?`,
    [nextImage, zoom, x, y, title.trim(), caption.trim(), parseOrder(req.body.urutan, existing.urutan), parseActive(req.body.aktif, existing.aktif), req.params.id]
  );
  if (req.file && existing.image_url !== nextImage) removeHomepageImage(existing.image_url);
  res.json({ message: 'Kegiatan berhasil diperbarui.' });
});

exports.deleteActivity = handler(async (req, res) => {
  const existing = await findById('homepage_kegiatan', req.params.id);
  await pool.query('DELETE FROM homepage_kegiatan WHERE id = ?', [req.params.id]);
  removeHomepageImage(existing.image_url);
  res.json({ message: 'Kegiatan berhasil dihapus.' });
});

exports.listNews = handler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM homepage_berita ORDER BY urutan ASC, created_at DESC, id DESC'
  );
  res.json(rows);
});

exports.createNews = handler(async (req, res) => {
  const { kategori = 'PRESS RELEASE', title = '', ringkasan = '', isi = '' } = req.body;
  const [zoom, x, y] = imageSettings(req);
  if (!req.file) throw httpError(400, 'Foto berita wajib diunggah.');
  if (!title.trim()) throw httpError(400, 'Judul berita wajib diisi.');
  const [result] = await pool.query(
    `INSERT INTO homepage_berita (image_url, image_zoom, image_x, image_y, kategori, title, ringkasan, isi, urutan, aktif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      imageUrl(req),
      zoom,
      x,
      y,
      kategori.trim() || 'PRESS RELEASE',
      title.trim(),
      ringkasan.trim(),
      isi.trim(),
      parseOrder(req.body.urutan),
      parseActive(req.body.aktif),
    ]
  );
  res.status(201).json({ id: result.insertId, message: 'Berita berhasil ditambahkan.' });
});

exports.updateNews = handler(async (req, res) => {
  const existing = await findById('homepage_berita', req.params.id);
  const {
    kategori = existing.kategori,
    title = existing.title,
    ringkasan = existing.ringkasan,
    isi = existing.isi,
  } = req.body;
  if (!title.trim()) throw httpError(400, 'Judul berita wajib diisi.');
  const nextImage = imageUrl(req, existing.image_url);
  const [zoom, x, y] = imageSettings(req, existing);
  await pool.query(
    `UPDATE homepage_berita
     SET image_url = ?, image_zoom = ?, image_x = ?, image_y = ?, kategori = ?, title = ?, ringkasan = ?, isi = ?, urutan = ?, aktif = ?
     WHERE id = ?`,
    [
      nextImage,
      zoom,
      x,
      y,
      kategori.trim() || 'PRESS RELEASE',
      title.trim(),
      ringkasan.trim(),
      isi.trim(),
      parseOrder(req.body.urutan, existing.urutan),
      parseActive(req.body.aktif, existing.aktif),
      req.params.id,
    ]
  );
  if (req.file && existing.image_url !== nextImage) removeHomepageImage(existing.image_url);
  res.json({ message: 'Berita berhasil diperbarui.' });
});

exports.deleteNews = handler(async (req, res) => {
  const existing = await findById('homepage_berita', req.params.id);
  await pool.query('DELETE FROM homepage_berita WHERE id = ?', [req.params.id]);
  removeHomepageImage(existing.image_url);
  res.json({ message: 'Berita berhasil dihapus.' });
});
