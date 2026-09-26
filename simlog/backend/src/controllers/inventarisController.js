const { pool } = require('../config/db');

const KONDISI_VALID = new Set(['Baik', 'Rusak', 'Hilang', 'Maintenance']);

function angkaPositif(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

// Helper: catat satu baris riwayat/audit trail untuk sebuah barang
async function catatRiwayat(conn, { inventaris_id, tipe_perubahan, keterangan, data_sebelum, data_sesudah, changed_by }) {
  await conn.query(
    `INSERT INTO inventaris_riwayat
      (inventaris_id, tipe_perubahan, keterangan, data_sebelum, data_sesudah, changed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      inventaris_id,
      tipe_perubahan,
      keterangan || null,
      data_sebelum ? JSON.stringify(data_sebelum) : null,
      data_sesudah ? JSON.stringify(data_sesudah) : null,
      changed_by || null,
    ]
  );
}

// GET /api/inventaris?kondisi=&kategori_id=&ruangan_id=&search=&page=&limit=
async function list(req, res) {
  try {
    const { kondisi, kategori_id, ruangan_id, search } = req.query;
    const safePage = angkaPositif(req.query.page, 1, 1000000);
    const safeLimit = angkaPositif(req.query.limit, 20, 100);
    if (kondisi && !KONDISI_VALID.has(kondisi)) {
      return res.status(400).json({ message: 'Nilai kondisi tidak valid.' });
    }
    const where = ['i.deleted_at IS NULL'];
    const params = [];

    if (kondisi) { where.push('i.kondisi = ?'); params.push(kondisi); }
    if (kategori_id) { where.push('i.kategori_id = ?'); params.push(kategori_id); }
    if (ruangan_id) { where.push('i.ruangan_id = ?'); params.push(ruangan_id); }
    if (search) { where.push('i.nama_barang LIKE ?'); params.push(`%${search}%`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (safePage - 1) * safeLimit;

    const [rows] = await pool.query(
      `SELECT i.*, k.nama_kategori, r.nama_ruangan
       FROM inventaris i
       LEFT JOIN kategori_barang k ON k.id = i.kategori_id
       LEFT JOIN ruangan r ON r.id = i.ruangan_id
       ${whereClause}
       ORDER BY i.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventaris i ${whereClause}`,
      params
    );

    return res.json({
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / safeLimit),
      },
    });
  } catch (err) {
    console.error('[inventarisController.list]', err);
    return res.status(500).json({ message: 'Gagal mengambil data inventaris.' });
  }
}

// GET /api/inventaris/:id
async function detail(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, k.nama_kategori, r.nama_ruangan
       FROM inventaris i
       LEFT JOIN kategori_barang k ON k.id = i.kategori_id
       LEFT JOIN ruangan r ON r.id = i.ruangan_id
       WHERE i.id = ? AND i.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('[inventarisController.detail]', err);
    return res.status(500).json({ message: 'Gagal mengambil detail barang.' });
  }
}

// GET /api/inventaris/:id/riwayat
async function riwayat(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT ir.*, u.nama AS nama_pengubah
       FROM inventaris_riwayat ir
       LEFT JOIN users u ON u.id = ir.changed_by
       WHERE ir.inventaris_id = ?
       ORDER BY ir.created_at DESC`,
      [req.params.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[inventarisController.riwayat]', err);
    return res.status(500).json({ message: 'Gagal mengambil riwayat barang.' });
  }
}

// POST /api/inventaris
async function create(req, res) {
  const conn = await pool.getConnection();
  try {
    const {
      nama_barang, kategori_id, jumlah, kondisi, ruangan_id,
      lokasi_detail, foto_url, catatan, tanggal_pendataan, sumber,
    } = req.body;

    if (!nama_barang?.trim() || !tanggal_pendataan) {
      return res.status(400).json({ message: 'Nama barang dan tanggal pendataan wajib diisi.' });
    }
    if (kondisi && !KONDISI_VALID.has(kondisi)) {
      return res.status(400).json({ message: 'Nilai kondisi tidak valid.' });
    }
    if (jumlah !== undefined && (!Number.isInteger(Number(jumlah)) || Number(jumlah) < 1)) {
      return res.status(400).json({ message: 'Jumlah barang harus berupa bilangan bulat minimal 1.' });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO inventaris
        (nama_barang, kategori_id, jumlah, kondisi, ruangan_id, lokasi_detail, foto_url, catatan, tanggal_pendataan, sumber, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_barang.trim(), kategori_id || null, jumlah || 1, kondisi || 'Baik',
        ruangan_id || null, lokasi_detail || null, foto_url || null,
        catatan || null, tanggal_pendataan, sumber || 'Manual', req.user.id,
      ]
    );

    const inventarisId = result.insertId;

    await catatRiwayat(conn, {
      inventaris_id: inventarisId,
      tipe_perubahan: 'Ditambahkan',
      keterangan: `Barang "${nama_barang}" ditambahkan ke inventaris.`,
      data_sesudah: req.body,
      changed_by: req.user.id,
    });

    await conn.commit();
    return res.status(201).json({ id: inventarisId, message: 'Barang berhasil ditambahkan.' });
  } catch (err) {
    await conn.rollback();
    console.error('[inventarisController.create]', err);
    return res.status(500).json({ message: 'Gagal menambahkan barang.' });
  } finally {
    conn.release();
  }
}

// PUT /api/inventaris/:id
async function update(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const [existingRows] = await conn.query('SELECT * FROM inventaris WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    }
    const before = existingRows[0];

    const {
      nama_barang, kategori_id, jumlah, kondisi, ruangan_id,
      lokasi_detail, foto_url, catatan, tanggal_pendataan,
    } = req.body;

    if (nama_barang !== undefined && !nama_barang.trim()) {
      return res.status(400).json({ message: 'Nama barang tidak boleh kosong.' });
    }
    if (kondisi !== undefined && !KONDISI_VALID.has(kondisi)) {
      return res.status(400).json({ message: 'Nilai kondisi tidak valid.' });
    }
    if (jumlah !== undefined && (!Number.isInteger(Number(jumlah)) || Number(jumlah) < 1)) {
      return res.status(400).json({ message: 'Jumlah barang harus berupa bilangan bulat minimal 1.' });
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE inventaris SET
        nama_barang = ?, kategori_id = ?, jumlah = ?, kondisi = ?, ruangan_id = ?,
        lokasi_detail = ?, foto_url = ?, catatan = ?, tanggal_pendataan = ?
       WHERE id = ?`,
      [
        nama_barang?.trim() ?? before.nama_barang,
        kategori_id ?? before.kategori_id,
        jumlah ?? before.jumlah,
        kondisi ?? before.kondisi,
        ruangan_id ?? before.ruangan_id,
        lokasi_detail ?? before.lokasi_detail,
        foto_url ?? before.foto_url,
        catatan ?? before.catatan,
        tanggal_pendataan ?? before.tanggal_pendataan,
        id,
      ]
    );

    // Kalau kondisi berubah, catat sebagai tipe khusus supaya gampang difilter di laporan
    const tipePerubahan = (kondisi && kondisi !== before.kondisi) ? 'Kondisi Berubah' : 'Diperbarui';

    await catatRiwayat(conn, {
      inventaris_id: id,
      tipe_perubahan: tipePerubahan,
      keterangan: tipePerubahan === 'Kondisi Berubah'
        ? `Kondisi berubah dari "${before.kondisi}" menjadi "${kondisi}".`
        : `Data barang "${before.nama_barang}" diperbarui.`,
      data_sebelum: before,
      data_sesudah: req.body,
      changed_by: req.user.id,
    });

    await conn.commit();
    return res.json({ message: 'Barang berhasil diperbarui.' });
  } catch (err) {
    await conn.rollback();
    console.error('[inventarisController.update]', err);
    return res.status(500).json({ message: 'Gagal memperbarui barang.' });
  } finally {
    conn.release();
  }
}

// DELETE /api/inventaris/:id  (soft delete, riwayat tetap tersimpan)
async function remove(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const [existingRows] = await conn.query('SELECT * FROM inventaris WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    }

    await conn.beginTransaction();
    await conn.query('UPDATE inventaris SET deleted_at = NOW() WHERE id = ?', [id]);
    await catatRiwayat(conn, {
      inventaris_id: id,
      tipe_perubahan: 'Dihapus',
      keterangan: `Barang "${existingRows[0].nama_barang}" dihapus dari inventaris.`,
      data_sebelum: existingRows[0],
      changed_by: req.user.id,
    });
    await conn.commit();

    return res.json({ message: 'Barang berhasil dihapus.' });
  } catch (err) {
    await conn.rollback();
    console.error('[inventarisController.remove]', err);
    return res.status(500).json({ message: 'Gagal menghapus barang.' });
  } finally {
    conn.release();
  }
}

// GET /api/inventaris/ringkasan  (untuk kartu statistik dashboard)
async function ringkasan(req, res) {
  try {
    const [[total]] = await pool.query('SELECT COUNT(*) AS jumlah FROM inventaris WHERE deleted_at IS NULL');
    const [perKondisi] = await pool.query(
      `SELECT kondisi, COUNT(*) AS jumlah FROM inventaris WHERE deleted_at IS NULL GROUP BY kondisi`
    );

    const ringkasanKondisi = { Baik: 0, Rusak: 0, Hilang: 0, Maintenance: 0 };
    perKondisi.forEach((row) => { ringkasanKondisi[row.kondisi] = row.jumlah; });

    return res.json({
      total_inventaris: total.jumlah,
      ready: ringkasanKondisi.Baik,
      rusak_hilang: ringkasanKondisi.Rusak + ringkasanKondisi.Hilang,
      maintenance: ringkasanKondisi.Maintenance,
      detail_kondisi: ringkasanKondisi,
    });
  } catch (err) {
    console.error('[inventarisController.ringkasan]', err);
    return res.status(500).json({ message: 'Gagal mengambil ringkasan inventaris.' });
  }
}

// GET /api/inventaris/aktivitas-terbaru?limit=8  (untuk kartu "Aktivitas Logistik Terbaru" di dashboard)
async function aktivitasTerbaru(req, res) {
  try {
    const limit = angkaPositif(req.query.limit, 8, 100);
    const [rows] = await pool.query(
      `SELECT ir.id, ir.tipe_perubahan, ir.keterangan, ir.created_at,
              i.nama_barang, u.nama AS nama_pengubah
       FROM inventaris_riwayat ir
       JOIN inventaris i ON i.id = ir.inventaris_id
       LEFT JOIN users u ON u.id = ir.changed_by
       ORDER BY ir.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[inventarisController.aktivitasTerbaru]', err);
    return res.status(500).json({ message: 'Gagal mengambil aktivitas terbaru.' });
  }
}

module.exports = { list, detail, riwayat, create, update, remove, ringkasan, aktivitasTerbaru };
