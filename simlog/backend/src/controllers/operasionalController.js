const { pool } = require('../config/db');

const required = (value, label) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    const error = new Error(`${label} wajib diisi.`);
    error.status = 400;
    throw error;
  }
};

const handler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error('[operasional]', err);

    res.status(err.status || 500).json({
      message:
        err.message ||
        'Terjadi kesalahan pada server.',
    });
  }
};

exports.listUnboxing = handler(
  async (req, res) => {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        DATE_FORMAT(
          u.tanggal,
          '%Y-%m-%d'
        ) AS tanggal,
        u.kondisi_umum,
        u.catatan,
        u.foto_url,
        u.nama_barang_manual AS nama_barang
      FROM unboxing_pendataan u
      ORDER BY
        u.tanggal DESC,
        u.id DESC
    `);

    res.json(rows);
  }
);

exports.createUnboxing = handler(
  async (req, res) => {
    const {
      nama_barang,
      tanggal,
      kondisi_umum,
      catatan,
    } = req.body;

    required(
      nama_barang,
      'Barang Inventaris'
    );

    required(
      tanggal,
      'Tanggal'
    );

     required(
      kondisi_umum,
      'Kondisi'
    );

    const foto_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const [result] = await pool.query(
      `
      INSERT INTO unboxing_pendataan (
        tanggal,
        kondisi_umum,
        catatan,
        foto_url,
        nama_barang_manual,
        dilakukan_oleh
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        tanggal,
        kondisi_umum,
        catatan || null,
        foto_url,
        nama_barang.trim(),
        req.user?.id || null,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message:
        'Pendataan barang berhasil disimpan.',
    });
  }
);

exports.listPiket = handler(
  async (req, res) => {
    const [jadwal] = await pool.query(`
      SELECT
        j.*,
        b.nama_bidang
      FROM piket_jadwal j
      LEFT JOIN bidang b
        ON b.id = j.bidang_id
      ORDER BY
        j.minggu_mulai DESC,
        j.id DESC
    `);

    const [pelaksanaan] = await pool.query(`
      SELECT
        p.*,
        j.bidang_id,
        b.nama_bidang
      FROM piket_pelaksanaan p
      LEFT JOIN piket_jadwal j
        ON j.id = p.jadwal_id
      LEFT JOIN bidang b
        ON b.id = j.bidang_id
      ORDER BY
        p.tanggal DESC,
        p.id DESC
    `);

    res.json({
      jadwal,
      pelaksanaan,
    });
  }
);

exports.createJadwalPiket = handler(
  async (req, res) => {
    const {
      bidang_id,
      minggu_mulai,
      minggu_selesai,
    } = req.body;

    required(
      bidang_id,
      'Bidang'
    );

    required(
      minggu_mulai,
      'Tanggal mulai'
    );

    required(
      minggu_selesai,
      'Tanggal selesai'
    );

    if (
      new Date(minggu_selesai) <
      new Date(minggu_mulai)
    ) {
      const error = new Error(
        'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
      );

      error.status = 400;

      throw error;
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO piket_jadwal (
          bidang_id,
          minggu_mulai,
          minggu_selesai
        )
        VALUES (?, ?, ?)
        `,
        [
          bidang_id,
          minggu_mulai,
          minggu_selesai,
        ]
      );

    res.status(201).json({
      id: result.insertId,
      message:
        'Jadwal piket tersimpan.',
    });
  }
);

exports.createPelaksanaanPiket =
  handler(async (req, res) => {
    const {
      jadwal_id,
      tanggal,
      status = 'Selesai',
      nama_pengisi,
      catatan,
    } = req.body;

    required(
      jadwal_id,
      'Jadwal piket'
    );

    required(
      tanggal,
      'Tanggal'
    );

    const [[jadwal]] =
      await pool.query(
        `
        SELECT
          id,
          bidang_id,
          minggu_mulai,
          minggu_selesai
        FROM piket_jadwal
        WHERE id = ?
        LIMIT 1
        `,
        [jadwal_id]
      );

    if (!jadwal) {
      const error = new Error(
        'Jadwal piket tidak ditemukan.'
      );

      error.status = 404;

      throw error;
    }

    const foto_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const [result] =
      await pool.query(
        `
        INSERT INTO piket_pelaksanaan (
          jadwal_id,
          tanggal,
          status,
          nama_pengisi,
          catatan,
          foto_url,
          sumber_input
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          jadwal_id,
          tanggal,
          status,
          nama_pengisi || null,
          catatan || null,
          foto_url,
          'Manual',
        ]
      );

    res.status(201).json({
      id: result.insertId,
      message:
        'Pelaksanaan piket berhasil disimpan.',
    });
  });

exports.listSewa = handler(
  async (req, res) => {
    const [barang] =
      await pool.query(`
        SELECT
          bs.*,
          k.nama_kategori
        FROM barang_sewa bs
        LEFT JOIN kategori_barang k
          ON k.id = bs.kategori_id
        ORDER BY
          bs.updated_at DESC,
          bs.id DESC
      `);

    const [peminjaman] =
      await pool.query(`
        SELECT
          p.*,
          bs.nama_barang
        FROM peminjaman p
        JOIN barang_sewa bs
          ON bs.id = p.barang_sewa_id
        ORDER BY
          p.created_at DESC,
          p.id DESC
      `);

    res.json({
      barang,
      peminjaman,
    });
  }
);

exports.createBarangSewa = handler(
  async (req, res) => {
    const {
      nama_barang,
      kategori_id,
      jumlah_total,
    } = req.body;

    required(
      nama_barang,
      'Nama barang'
    );

    required(
      jumlah_total,
      'Jumlah'
    );

    const jumlah =
      Number(jumlah_total);

    if (
      !Number.isInteger(jumlah) ||
      jumlah < 1
    ) {
      const error = new Error(
        'Jumlah harus berupa angka minimal 1.'
      );

      error.status = 400;

      throw error;
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO barang_sewa (
          nama_barang,
          kategori_id,
          jumlah_total,
          jumlah_tersedia
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          nama_barang.trim(),
          kategori_id || null,
          jumlah,
          jumlah,
        ]
      );

    res.status(201).json({
      id: result.insertId,
      message:
        'Barang sewa tersimpan.',
    });
  }
);

exports.createPeminjaman = handler(
  async (req, res) => {
    const {
      barang_sewa_id,
      nama_penyewa,
      kontak_penyewa,
      jumlah_dipinjam,
      tanggal_mulai,
      tanggal_kembali_rencana,
      catatan,
    } = req.body;

    required(
      barang_sewa_id,
      'Barang'
    );

    required(
      nama_penyewa,
      'Penyewa'
    );

    required(
      jumlah_dipinjam,
      'Jumlah'
    );

    required(
      tanggal_mulai,
      'Tanggal mulai'
    );

    required(
      tanggal_kembali_rencana,
      'Tanggal kembali'
    );

    if (
      new Date(
        tanggal_kembali_rencana
      ) <
      new Date(tanggal_mulai)
    ) {
      const error = new Error(
        'Tanggal kembali tidak boleh lebih awal dari tanggal mulai.'
      );

      error.status = 400;

      throw error;
    }

    const jumlah =
      Number(jumlah_dipinjam);

    const conn =
      await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [[barang]] =
        await conn.query(
          `
          SELECT *
          FROM barang_sewa
          WHERE id = ?
          FOR UPDATE
          `,
          [barang_sewa_id]
        );

      if (!barang) {
        const error = new Error(
          'Barang sewa tidak ditemukan.'
        );

        error.status = 404;

        throw error;
      }

      if (
        !Number.isInteger(jumlah) ||
        jumlah < 1
      ) {
        const error = new Error(
          'Jumlah peminjaman tidak valid.'
        );

        error.status = 400;

        throw error;
      }

      if (
        jumlah >
        Number(barang.jumlah_tersedia)
      ) {
        const error = new Error(
          'Stok barang tidak mencukupi.'
        );

        error.status = 400;

        throw error;
      }

      const [result] =
        await conn.query(
          `
          INSERT INTO peminjaman (
            barang_sewa_id,
            nama_penyewa,
            kontak_penyewa,
            jumlah_dipinjam,
            tanggal_mulai,
            tanggal_kembali_rencana,
            catatan,
            dicatat_oleh
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            barang_sewa_id,
            nama_penyewa.trim(),
            kontak_penyewa || null,
            jumlah,
            tanggal_mulai,
            tanggal_kembali_rencana,
            catatan || null,
            req.user?.id || null,
          ]
        );

      const tersedia =
        Number(
          barang.jumlah_tersedia
        ) - jumlah;

      const status =
        tersedia === 0
          ? 'Disewa'
          : 'Sebagian Disewa';

      await conn.query(
        `
        UPDATE barang_sewa
        SET
          jumlah_tersedia = ?,
          jumlah_disewa =
            jumlah_disewa + ?,
          status = ?
        WHERE id = ?
        `,
        [
          tersedia,
          jumlah,
          status,
          barang_sewa_id,
        ]
      );

      await conn.commit();

      res.status(201).json({
        id: result.insertId,
        message:
          'Peminjaman tersimpan.',
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
);

exports.listPengadaan = handler(
  async (req, res) => {
    const [rows] =
      await pool.query(`
        SELECT
          p.*,
          r.nama_ruangan
        FROM pengadaan p
        LEFT JOIN ruangan r
          ON r.id = p.lokasi_id
        ORDER BY
          p.tanggal DESC,
          p.id DESC
      `);

    res.json(rows);
  }
);

exports.createPengadaan = handler(
  async (req, res) => {
    const {
      nama_barang,
      jumlah = 1,
      tanggal,
      harga,
      sumber_dana,
      kondisi = 'Baik',
      lokasi_id,
      catatan,
    } = req.body;

    required(
      nama_barang,
      'Nama barang'
    );

    required(
      tanggal,
      'Tanggal'
    );

    const qty = Number(jumlah);

    if (
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      const error = new Error(
        'Jumlah barang minimal 1.'
      );

      error.status = 400;

      throw error;
    }

    const nilaiHarga =
      Number(harga || 0);

    if (
      Number.isNaN(nilaiHarga) ||
      nilaiHarga < 0
    ) {
      const error = new Error(
        'Harga tidak valid.'
      );

      error.status = 400;

      throw error;
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO pengadaan (
          nama_pengadaan,
          nama_barang,
          jumlah,
          anggaran,
          tanggal,
          harga,
          sumber_dana,
          kondisi,
          lokasi_id,
          catatan,
          dicatat_oleh
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
        [
          nama_barang.trim(),
          nama_barang.trim(),
          qty,
          nilaiHarga,
          tanggal,
          nilaiHarga,
          sumber_dana || null,
          kondisi,
          lokasi_id || null,
          catatan || null,
          req.user?.id || null,
        ]
      );

    res.status(201).json({
      id: result.insertId,
      message:
        'Pengadaan tersimpan.',
    });
  }
);

exports.listRevitalisasi = handler(
  async (req, res) => {
    const [laporan] =
      await pool.query(`
        SELECT
          k.*,
          i.nama_barang
        FROM kerusakan_laporan k
        LEFT JOIN inventaris i
          ON i.id = k.inventaris_id
        ORDER BY
          k.created_at DESC,
          k.id DESC
      `);

    const [revitalisasi] =
      await pool.query(`
        SELECT
          r.*,
          i.nama_barang
        FROM revitalisasi r
        JOIN inventaris i
          ON i.id = r.inventaris_id
        ORDER BY
          r.created_at DESC,
          r.id DESC
      `);

    res.json({
      laporan,
      revitalisasi,
    });
  }
);

exports.createLaporanKerusakan =
  handler(async (req, res) => {
    const {
      inventaris_id,
      tanggal_lapor,
      deskripsi,
    } = req.body;

    required(
      tanggal_lapor,
      'Tanggal laporan'
    );

    required(
      deskripsi,
      'Deskripsi'
    );

    const foto_url = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.foto_url || null;

    const [result] =
      await pool.query(
        `
        INSERT INTO kerusakan_laporan (
          inventaris_id,
          dilaporkan_oleh,
          tanggal_lapor,
          deskripsi,
          foto_url
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          inventaris_id || null,
          req.user?.id || null,
          tanggal_lapor,
          deskripsi.trim(),
          foto_url,
        ]
      );

    res.status(201).json({
      id: result.insertId,
      message:
        'Laporan kerusakan tersimpan.',
    });
  });

exports.createRevitalisasi =
  handler(async (req, res) => {
    const {
      inventaris_id,
      tanggal_perbaikan,
      tindakan,
      biaya = 0,
      status = 'Diajukan',
      catatan,
      laporan_id,
    } = req.body;

    required(
      inventaris_id,
      'Inventaris'
    );

    required(
      tanggal_perbaikan,
      'Tanggal perbaikan'
    );

    required(
      tindakan,
      'Tindakan'
    );

    const nilaiBiaya =
      Number(biaya || 0);

    if (
      Number.isNaN(nilaiBiaya) ||
      nilaiBiaya < 0
    ) {
      const error = new Error(
        'Biaya tidak valid.'
      );

      error.status = 400;

      throw error;
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO revitalisasi (
          inventaris_id,
          laporan_id,
          tanggal_perbaikan,
          tindakan,
          biaya,
          status,
          catatan,
          dicatat_oleh
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          inventaris_id,
          laporan_id || null,
          tanggal_perbaikan,
          tindakan.trim(),
          nilaiBiaya,
          status,
          catatan || null,
          req.user?.id || null,
        ]
      );

    if (
      status === 'Selesai'
    ) {
      await pool.query(
        `
        UPDATE inventaris
        SET kondisi = 'Baik'
        WHERE id = ?
        `,
        [inventaris_id]
      );
    }

    res.status(201).json({
      id: result.insertId,
      message:
        'Tindakan revitalisasi tersimpan.',
    });
  });

exports.getLaporan = handler(
  async (req, res) => {
    const [[inventaris]] =
      await pool.query(`
        SELECT
          COALESCE(
            SUM(jumlah),
            0
          ) AS unit,
          COALESCE(
            SUM(
              CASE
                WHEN kondisi <> 'Baik'
                THEN jumlah
                ELSE 0
              END
            ),
            0
          ) AS bermasalah
        FROM inventaris
      `);

    const [[piket]] =
      await pool.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'Selesai'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS selesai
        FROM piket_pelaksanaan
      `);

    const [[sewa]] =
      await pool.query(`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN status = 'Berjalan'
                THEN jumlah_dipinjam
                ELSE 0
              END
            ),
            0
          ) AS unit,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'Berjalan'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS aktif
        FROM peminjaman
      `);

    const [[pengadaan]] =
      await pool.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(
            SUM(
              harga * jumlah
            ),
            0
          ) AS nilai
        FROM pengadaan
      `);

    const [[revitalisasi]] =
      await pool.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(
            SUM(
              CASE
                WHEN status IN (
                  'Terbuka',
                  'Diproses'
                )
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS terbuka
        FROM kerusakan_laporan
      `);

    res.json({
      inventaris: {
        unit:
          Number(
            inventaris.unit || 0
          ),

        bermasalah:
          Number(
            inventaris.bermasalah || 0
          ),
      },

      piket: {
        total:
          Number(
            piket.total || 0
          ),

        selesai:
          Number(
            piket.selesai || 0
          ),
      },

      sewa: {
        unit:
          Number(
            sewa.unit || 0
          ),

        aktif:
          Number(
            sewa.aktif || 0
          ),
      },

      pengadaan: {
        total:
          Number(
            pengadaan.total || 0
          ),

        nilai:
          Number(
            pengadaan.nilai || 0
          ),
      },

      revitalisasi: {
        total:
          Number(
            revitalisasi.total || 0
          ),

        terbuka:
          Number(
            revitalisasi.terbuka || 0
          ),
      },
    });
  }
);