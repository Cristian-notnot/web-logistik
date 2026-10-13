const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { sanitizeImageBuffer } = require('../middleware/secureImageUpload');

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const requestCounts = new Map();
const piketUploadDir = path.resolve(__dirname, '..', '..', 'private_uploads', 'piket');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function rateLimit(req, key) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateKey = `${key}:${ip}`;
  const maxRequests = key === 'piket-submit' ? 60 : 120;
  const current = requestCounts.get(rateKey);
  if (!current || current.expiresAt <= now) {
    requestCounts.set(rateKey, { count: 1, expiresAt: now + RATE_WINDOW_MS });
    return;
  }
  if (current.count >= maxRequests) {
    throw httpError(429, 'Terlalu banyak percobaan. Silakan tunggu beberapa menit lalu coba lagi.');
  }
  current.count += 1;
  if (requestCounts.size > 10000) {
    for (const [entry, value] of requestCounts) {
      if (value.expiresAt <= now) requestCounts.delete(entry);
    }
  }
}

function challengeSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw httpError(500, 'Keamanan formulir piket belum dikonfigurasi.');
  }
  return process.env.JWT_SECRET;
}

function signChallenge(issuedAt, nonce) {
  return crypto.createHmac('sha256', challengeSecret()).update(`${issuedAt}.${nonce}`).digest('hex');
}

function issueChallenge() {
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(32).toString('hex');
  return `${issuedAt}.${nonce}.${signChallenge(issuedAt, nonce)}`;
}

function verifyChallenge(token) {
  if (typeof token !== 'string') throw httpError(400, 'Sesi formulir tidak valid. Muat ulang halaman.');
  const [issuedAtText, nonce, signature, ...extra] = token.split('.');
  const issuedAt = Number(issuedAtText);
  if (extra.length || !Number.isSafeInteger(issuedAt) || !/^[a-f0-9]{64}$/i.test(nonce || '') || !/^[a-f0-9]{64}$/i.test(signature || '')) {
    throw httpError(400, 'Sesi formulir tidak valid. Muat ulang halaman.');
  }
  if (Date.now() - issuedAt > CHALLENGE_TTL_MS || issuedAt > Date.now() + 30000) {
    throw httpError(410, 'Sesi formulir sudah kedaluwarsa. Muat ulang halaman untuk mengambil foto baru.');
  }
  const expected = Buffer.from(signChallenge(issuedAtText, nonce), 'hex');
  const provided = Buffer.from(signature, 'hex');
  if (!crypto.timingSafeEqual(expected, provided)) {
    throw httpError(400, 'Sesi formulir tidak valid. Muat ulang halaman.');
  }
  return nonce;
}

exports.getFormData = async (req, res, next) => {
  try {
    rateLimit(req, 'piket-form');
    const [schedules] = await pool.query(`
      SELECT
        j.id AS jadwal_id,
        j.bidang_id,
        b.nama_bidang,
        j.minggu_mulai,
        j.minggu_selesai,
        (CURDATE() BETWEEN j.minggu_mulai AND j.minggu_selesai) AS aktif_hari_ini,
        NOT EXISTS (
          SELECT 1
          FROM piket_jadwal conflicting
          WHERE conflicting.id <> j.id
            AND conflicting.minggu_mulai <= j.minggu_selesai
            AND conflicting.minggu_selesai >= j.minggu_mulai
        ) AS periode_valid
      FROM piket_jadwal j
      JOIN bidang b ON b.id = j.bidang_id AND b.aktif = 1
      WHERE j.minggu_selesai >= CURDATE()
        AND j.minggu_mulai <= j.minggu_selesai
      ORDER BY j.minggu_mulai, b.urutan_rotasi, j.id
    `);
    res.set('Cache-Control', 'no-store');
    res.json({
      jadwal: schedules,
      serverDate: new Date().toISOString(),
      challenge: issueChallenge(),
    });
  } catch (error) {
    next(error);
  }
};

exports.submitPiket = async (req, res, next) => {
  let imagePath = null;
  try {
    rateLimit(req, 'piket-submit');
    const nama = typeof req.body.nama_pengisi === 'string' ? req.body.nama_pengisi.trim().replace(/\s+/g, ' ') : '';
    const jadwalId = Number(req.body.jadwal_id);
    const catatan = typeof req.body.catatan === 'string' ? req.body.catatan.trim() : '';
    if (!nama || nama.length < 3 || nama.length > 100) throw httpError(400, 'Nama lengkap wajib diisi (3–100 karakter).');
    if (!Number.isSafeInteger(jadwalId) || jadwalId < 1) throw httpError(400, 'Pilih bidang piket yang aktif.');
    if (catatan.length > 2000) throw httpError(400, 'Catatan maksimal 2000 karakter.');
    if (!req.file) throw httpError(400, 'Ambil foto kegiatan menggunakan kamera sebelum mengirim.');
    const image = await sanitizeImageBuffer(req.file.buffer, req.file);
    req.file.buffer = image.buffer;
    req.file.mimetype = image.mimetype;
    const nonce = verifyChallenge(req.body.challenge);
    const photoHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const namaKey = nama.normalize('NFKC').toLocaleLowerCase('id-ID');
    const [[schedule]] = await pool.query(`
      SELECT j.id, j.bidang_id
      FROM piket_jadwal j
      JOIN bidang b ON b.id = j.bidang_id AND b.aktif = 1
      WHERE j.id = ?
        AND j.minggu_mulai <= CURDATE()
        AND j.minggu_selesai >= CURDATE()
        AND j.minggu_mulai <= j.minggu_selesai
        AND NOT EXISTS (
          SELECT 1
          FROM piket_jadwal conflicting
          WHERE conflicting.id <> j.id
            AND conflicting.minggu_mulai <= j.minggu_selesai
            AND conflicting.minggu_selesai >= j.minggu_mulai
        )
      LIMIT 1
    `, [jadwalId]);
    if (!schedule) throw httpError(400, 'Jadwal piket sudah tidak aktif. Muat ulang halaman.');

    const [[duplicateImage]] = await pool.query(
      'SELECT id FROM piket_pelaksanaan WHERE foto_hash = ? LIMIT 1',
      [photoHash]
    );
    if (duplicateImage) throw httpError(409, 'Foto ini sudah pernah dikirim. Ambil foto kegiatan yang baru secara langsung.');

    const filename = `${Date.now()}-${crypto.randomUUID()}${image.extension}`;
    imagePath = path.join(piketUploadDir, filename);
    try {
      await fs.promises.access(piketUploadDir, fs.constants.W_OK);
      await fs.promises.writeFile(imagePath, req.file.buffer, { flag: 'wx' });
    } catch (storageError) {
      if (storageError.code === 'ENOENT' || storageError.code === 'EACCES' || storageError.code === 'EROFS') {
        throw httpError(
          503,
          'Folder foto piket belum tersedia atau tidak dapat ditulisi. Siapkan foldernya terlebih dahulu atau gunakan penyimpanan file online.'
        );
      }
      throw storageError;
    }

    try {
      const [result] = await pool.query(`
        INSERT INTO piket_pelaksanaan
          (jadwal_id, tanggal, status, nama_pengisi, bidang_id, catatan, foto_url, sumber_input,
           status_verifikasi,
           foto_hash, submission_nonce, submission_day, nama_key)
        VALUES (?, CURDATE(), 'Selesai', ?, ?, ?, ?, 'QR Website', 0, ?, ?, CURDATE(), ?)
      `, [
        schedule.id,
        nama,
        schedule.bidang_id,
        catatan || null,
        `private-piket:${filename}`,
        photoHash,
        nonce,
        namaKey,
      ]);
      res.status(201).json({
        id: result.insertId,
        message: 'Laporan piket berhasil dikirim dan menunggu verifikasi admin.',
      });
    } catch (error) {
      await fs.promises.unlink(imagePath).catch((cleanupError) => {
        console.error('[Piket Upload Cleanup]', cleanupError);
      });
      imagePath = null;
      if (error.code === 'ER_DUP_ENTRY') {
        throw httpError(409, error.sqlMessage?.includes('uq_piket_nama_bidang_hari')
          ? 'Nama ini sudah mengirim laporan piket untuk bidang ini hari ini.'
          : 'Foto atau sesi formulir ini sudah pernah digunakan. Muat ulang dan ambil foto baru.');
      }
      throw error;
    }
  } catch (error) {
    if (imagePath) {
      await fs.promises.unlink(imagePath).catch((cleanupError) => {
        console.error('[Piket Upload Cleanup]', cleanupError);
      });
    }
    next(error);
  }
};

exports.getPiketPhoto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw httpError(404, 'Foto piket tidak ditemukan.');
    const [[record]] = await pool.query(
      'SELECT foto_url FROM piket_pelaksanaan WHERE id = ? LIMIT 1',
      [id]
    );
    if (!record?.foto_url?.startsWith('private-piket:')) {
      throw httpError(404, 'Foto piket tidak ditemukan.');
    }
    const filename = record.foto_url.slice('private-piket:'.length);
    if (!/^[0-9]+-[a-f0-9-]+\.(jpg|png|webp)$/.test(filename)) {
      throw httpError(404, 'Foto piket tidak ditemukan.');
    }
    res.set('Cache-Control', 'private, no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(path.join(piketUploadDir, filename), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    next(error);
  }
};
