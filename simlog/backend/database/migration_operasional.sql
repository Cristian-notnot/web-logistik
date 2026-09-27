USE simlog_hw_unimus;

-- =====================================================
-- 1. UNBOXING
-- =====================================================

ALTER TABLE unboxing_pendataan
ADD COLUMN IF NOT EXISTS nama_barang_manual VARCHAR(150) NULL
AFTER inventaris_id;


-- =====================================================
-- 2. PIKET
-- =====================================================

ALTER TABLE piket_pelaksanaan
MODIFY COLUMN nama_pengisi VARCHAR(100) NULL;

ALTER TABLE piket_pelaksanaan
MODIFY COLUMN bidang_id INT NULL;

ALTER TABLE piket_pelaksanaan
MODIFY COLUMN foto_url VARCHAR(255) NULL;


-- =====================================================
-- 3. PENGADAAN
-- =====================================================

ALTER TABLE pengadaan
ADD COLUMN IF NOT EXISTS nama_barang VARCHAR(150) NULL,
ADD COLUMN IF NOT EXISTS tanggal DATE NULL,
ADD COLUMN IF NOT EXISTS harga DECIMAL(15,2) NULL,
ADD COLUMN IF NOT EXISTS sumber_dana VARCHAR(150) NULL,
ADD COLUMN IF NOT EXISTS kondisi VARCHAR(50) NULL DEFAULT 'Baik',
ADD COLUMN IF NOT EXISTS lokasi_id INT NULL,
ADD COLUMN IF NOT EXISTS catatan TEXT NULL,
ADD COLUMN IF NOT EXISTS dicatat_oleh INT NULL;

UPDATE pengadaan
SET nama_barang = nama_pengadaan
WHERE nama_barang IS NULL;

UPDATE pengadaan
SET harga = anggaran
WHERE harga IS NULL;

ALTER TABLE pengadaan
MODIFY COLUMN nama_barang VARCHAR(150) NOT NULL;

ALTER TABLE pengadaan
ADD CONSTRAINT fk_pengadaan_ruangan
FOREIGN KEY (lokasi_id)
REFERENCES ruangan(id)
ON DELETE SET NULL;

ALTER TABLE pengadaan
ADD CONSTRAINT fk_pengadaan_user
FOREIGN KEY (dicatat_oleh)
REFERENCES users(id)
ON DELETE SET NULL;


-- =====================================================
-- 4. LAPORAN KERUSAKAN
-- =====================================================

CREATE TABLE IF NOT EXISTS kerusakan_laporan (
  id INT AUTO_INCREMENT PRIMARY KEY,

  inventaris_id INT NULL,

  dilaporkan_oleh INT NULL,

  tanggal_lapor DATE NOT NULL,

  deskripsi TEXT NOT NULL,

  foto_url VARCHAR(255) NULL,

  status ENUM(
    'Terbuka',
    'Diproses',
    'Selesai',
    'Dibatalkan'
  ) NOT NULL DEFAULT 'Terbuka',

  created_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_kerusakan_inventaris
    FOREIGN KEY (inventaris_id)
    REFERENCES inventaris(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_kerusakan_user
    FOREIGN KEY (dilaporkan_oleh)
    REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;


-- =====================================================
-- 5. REVITALISASI
-- =====================================================

CREATE TABLE IF NOT EXISTS revitalisasi (
  id INT AUTO_INCREMENT PRIMARY KEY,

  inventaris_id INT NOT NULL,

  laporan_id INT NULL,

  tanggal_perbaikan DATE NOT NULL,

  tindakan VARCHAR(255) NOT NULL,

  biaya DECIMAL(15,2) NOT NULL DEFAULT 0,

  status ENUM(
    'Diajukan',
    'Proses',
    'Selesai',
    'Dibatalkan'
  ) NOT NULL DEFAULT 'Diajukan',

  catatan TEXT NULL,

  dicatat_oleh INT NULL,

  created_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_revitalisasi_inventaris
    FOREIGN KEY (inventaris_id)
    REFERENCES inventaris(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_revitalisasi_laporan
    FOREIGN KEY (laporan_id)
    REFERENCES kerusakan_laporan(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_revitalisasi_user
    FOREIGN KEY (dicatat_oleh)
    REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;