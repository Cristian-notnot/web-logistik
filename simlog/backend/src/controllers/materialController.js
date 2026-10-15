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

function materialFilePath(filename) {
  const uploadRoot = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
  const materialRoot = path.resolve(uploadRoot, 'materi');
  const target = path.resolve(materialRoot, path.basename(filename || ''));
  if (!target.startsWith(`${materialRoot}${path.sep}`)) {
    throw httpError(400, 'Lokasi file materi tidak valid.');
  }
  return target;
}

async function removeMaterialFile(filename) {
  if (!filename) return;
  try {
    await fs.promises.unlink(materialFilePath(filename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function requiredText(value, label, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw httpError(400, `${label} wajib diisi.`);
  if (text.length > maxLength) throw httpError(400, `${label} maksimal ${maxLength} karakter.`);
  return text;
}

exports.listPublic = handler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, judul, deskripsi, nama_asli AS nama_file, ukuran_file, created_at
     FROM materi ORDER BY created_at DESC, id DESC`
  );
  res.json(rows.map((row) => ({
    ...row,
    download_url: `/api/public/materi/${row.id}/file`,
  })));
});

exports.download = handler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT nama_file, nama_asli FROM materi WHERE id = ? LIMIT 1',
    [req.params.id]
  );
  if (!rows.length) throw httpError(404, 'File materi tidak ditemukan.');

  const filePath = materialFilePath(rows[0].nama_file);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch (error) {
    if (error.code === 'ENOENT') throw httpError(404, 'File materi tidak ditemukan di penyimpanan.');
    throw error;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(filePath, path.basename(rows[0].nama_asli));
});

exports.listAdmin = handler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, judul, deskripsi, nama_file, nama_asli, mime_type, ukuran_file, created_at
     FROM materi ORDER BY created_at DESC, id DESC`
  );
  res.json(rows.map((row) => ({
    ...row,
    download_url: `/api/public/materi/${row.id}/file`,
  })));
});

exports.create = handler(async (req, res) => {
  if (!req.file) throw httpError(400, 'File materi wajib dipilih.');
  try {
    const judul = requiredText(req.body.judul, 'Judul', 180);
    const deskripsi = requiredText(req.body.deskripsi, 'Deskripsi', 2000);
    const namaAsli = path.basename(req.file.originalname).slice(0, 255) || 'materi';
    const [result] = await pool.query(
      `INSERT INTO materi (judul, deskripsi, nama_file, nama_asli, mime_type, ukuran_file)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [judul, deskripsi, req.file.filename, namaAsli, req.file.mimetype, req.file.size]
    );
    res.status(201).json({ id: result.insertId, message: 'Materi berhasil ditambahkan.' });
  } catch (error) {
    await removeMaterialFile(req.file.filename);
    throw error;
  }
});

exports.update = handler(async (req, res) => {
  let rows;
  try {
    [rows] = await pool.query('SELECT * FROM materi WHERE id = ? LIMIT 1', [req.params.id]);
  } catch (error) {
    if (req.file) await removeMaterialFile(req.file.filename);
    throw error;
  }
  if (!rows.length) {
    if (req.file) await removeMaterialFile(req.file.filename);
    throw httpError(404, 'Materi tidak ditemukan.');
  }
  const existing = rows[0];
  let judul;
  let deskripsi;
  try {
    judul = requiredText(req.body.judul, 'Judul', 180);
    deskripsi = requiredText(req.body.deskripsi, 'Deskripsi', 2000);
    await pool.query(
      `UPDATE materi
       SET judul = ?, deskripsi = ?, nama_file = ?, nama_asli = ?, mime_type = ?, ukuran_file = ?
       WHERE id = ?`,
      [
        judul,
        deskripsi,
        req.file?.filename || existing.nama_file,
        req.file ? (path.basename(req.file.originalname).slice(0, 255) || 'materi') : existing.nama_asli,
        req.file?.mimetype || existing.mime_type,
        req.file?.size ?? existing.ukuran_file,
        req.params.id,
      ]
    );
  } catch (error) {
    if (req.file) await removeMaterialFile(req.file.filename);
    throw error;
  }
  if (req.file) await removeMaterialFile(existing.nama_file);
  res.json({ message: 'Materi berhasil diperbarui.' });
});

exports.remove = handler(async (req, res) => {
  const [rows] = await pool.query('SELECT nama_file FROM materi WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw httpError(404, 'Materi tidak ditemukan.');
  await pool.query('DELETE FROM materi WHERE id = ?', [req.params.id]);
  await removeMaterialFile(rows[0].nama_file);
  res.json({ message: 'Materi berhasil dihapus.' });
});
