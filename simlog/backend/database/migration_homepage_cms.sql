CREATE TABLE IF NOT EXISTS homepage_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NULL,
  image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  image_x TINYINT UNSIGNED NOT NULL DEFAULT 50,
  image_y TINYINT UNSIGNED NOT NULL DEFAULT 50,
  image_position ENUM('center', 'top', 'bottom') NOT NULL DEFAULT 'center',
  label VARCHAR(150) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NULL,
  urutan INT NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_homepage_slides_active_order (aktif, urutan, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS homepage_about (
  id TINYINT UNSIGNED PRIMARY KEY,
  label VARCHAR(150) NOT NULL DEFAULT '',
  title VARCHAR(255) NOT NULL DEFAULT '',
  paragraf_pertama TEXT NULL,
  paragraf_kedua TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO homepage_about (id, label, title, paragraf_pertama, paragraf_kedua)
SELECT
  1,
  'Tentang HIZBUL WATHAN UNIMUS',
  'Tempat tumbuh bagi kader yang aktif dan berkarakter',
  'Hizbul Wathan Universitas Muhammadiyah Semarang merupakan organisasi kepanduan Muhammadiyah yang dikenal sebagai Kafilah Jenderal Soedirman. HW UNIMUS menjadi ruang pembinaan karakter, kedisiplinan, kepemimpinan, kemandirian, keterampilan, dan pengabdian mahasiswa.',
  'Setiap bidang memiliki fungsi yang berbeda, tetapi bergerak dalam satu arah untuk mendukung proses kaderisasi dan keberlangsungan kegiatan organisasi.'
WHERE NOT EXISTS (SELECT 1 FROM homepage_about WHERE id = 1);

CREATE TABLE IF NOT EXISTS homepage_bidang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis ENUM('bidang', 'bkm') NOT NULL DEFAULT 'bidang',
  urutan INT NOT NULL DEFAULT 0,
  nama VARCHAR(150) NOT NULL,
  deskripsi TEXT NULL,
  image_url VARCHAR(500) NULL,
  image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  image_x TINYINT UNSIGNED NOT NULL DEFAULT 50,
  image_y TINYINT UNSIGNED NOT NULL DEFAULT 50,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_homepage_bidang_jenis_nama (jenis, nama),
  INDEX idx_homepage_bidang_active_order (aktif, jenis, urutan, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS homepage_bph (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jabatan ENUM('ketua_kafilah', 'sekretaris_kafilah', 'bendahara_kafilah') NOT NULL,
  nama VARCHAR(150) NOT NULL DEFAULT '',
  deskripsi TEXT NULL,
  image_url VARCHAR(500) NULL,
  image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  image_x TINYINT UNSIGNED NOT NULL DEFAULT 50,
  image_y TINYINT UNSIGNED NOT NULL DEFAULT 50,
  urutan INT NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_homepage_bph_jabatan (jabatan),
  INDEX idx_homepage_bph_active_order (aktif, urutan, id)
) ENGINE=InnoDB;

INSERT IGNORE INTO homepage_bph (jabatan, nama, deskripsi, urutan, aktif)
VALUES
  ('ketua_kafilah', '', '', 1, 1),
  ('sekretaris_kafilah', '', '', 2, 1),
  ('bendahara_kafilah', '', '', 3, 1);

INSERT INTO homepage_bidang (jenis, urutan, nama, deskripsi, aktif)
SELECT seed.jenis, seed.urutan, seed.nama, seed.deskripsi, 1
FROM (
  SELECT 'bidang' AS jenis, 1 AS urutan, 'Bidang Organisasi' AS nama, 'Mengelola tata organisasi, koordinasi pengurus, administrasi, dan keberlangsungan program kerja.' AS deskripsi
  UNION ALL SELECT 'bidang', 2, 'Bidang Kominfo', 'Mengelola informasi, publikasi, dokumentasi, media, dan komunikasi HW UNIMUS.'
  UNION ALL SELECT 'bidang', 3, 'Bidang AIK', 'Menguatkan nilai Al-Islam dan Kemuhammadiyahan dalam kegiatan serta kehidupan kader.'
  UNION ALL SELECT 'bidang', 4, 'Bidang Kepanduan', 'Mengembangkan keterampilan kepanduan, kemampuan lapangan, kedisiplinan, dan kerja sama.'
  UNION ALL SELECT 'bidang', 5, 'Bidang Logistik', 'Mengelola inventaris, sarana, pengadaan, ruang, serta kebutuhan operasional organisasi.'
  UNION ALL SELECT 'bidang', 6, 'Bidang Pengkaderan', 'Mengelola penerimaan, pembinaan, pendidikan, dan pengembangan anggota HW UNIMUS.'
  UNION ALL SELECT 'bkm', 7, 'BKM Kesenian', 'Ruang pengembangan minat, bakat, kreativitas, dan kegiatan kesenian anggota HW UNIMUS.'
  UNION ALL SELECT 'bkm', 8, 'BKM Kewirausahaan', 'Mengembangkan kemampuan kewirausahaan dan kemandirian anggota melalui kegiatan produktif.'
) AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM homepage_bidang existing
  WHERE existing.jenis = seed.jenis AND existing.nama = seed.nama
);

CREATE TABLE IF NOT EXISTS homepage_kegiatan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NULL,
  image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  image_x TINYINT UNSIGNED NOT NULL DEFAULT 50,
  image_y TINYINT UNSIGNED NOT NULL DEFAULT 50,
  title VARCHAR(255) NOT NULL DEFAULT '',
  caption TEXT NULL,
  urutan INT NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_homepage_kegiatan_active_order (aktif, urutan, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS homepage_berita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NULL,
  image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  image_x TINYINT UNSIGNED NOT NULL DEFAULT 50,
  image_y TINYINT UNSIGNED NOT NULL DEFAULT 50,
  kategori VARCHAR(150) NOT NULL DEFAULT 'PRESS RELEASE',
  title VARCHAR(255) NOT NULL,
  ringkasan TEXT NULL,
  isi LONGTEXT NULL,
  urutan INT NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_homepage_berita_active_order (aktif, urutan, created_at, id)
) ENGINE=InnoDB;

SET @homepage_crop_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'homepage_slides' AND COLUMN_NAME = 'image_zoom') = 0,
  'ALTER TABLE homepage_slides ADD COLUMN image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00, ADD COLUMN image_x TINYINT UNSIGNED NOT NULL DEFAULT 50, ADD COLUMN image_y TINYINT UNSIGNED NOT NULL DEFAULT 50',
  'SELECT 1'
);
PREPARE homepage_crop_stmt FROM @homepage_crop_sql;
EXECUTE homepage_crop_stmt;
DEALLOCATE PREPARE homepage_crop_stmt;

SET @homepage_crop_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'homepage_bidang' AND COLUMN_NAME = 'image_zoom') = 0,
  'ALTER TABLE homepage_bidang ADD COLUMN image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00, ADD COLUMN image_x TINYINT UNSIGNED NOT NULL DEFAULT 50, ADD COLUMN image_y TINYINT UNSIGNED NOT NULL DEFAULT 50',
  'SELECT 1'
);
PREPARE homepage_crop_stmt FROM @homepage_crop_sql;
EXECUTE homepage_crop_stmt;
DEALLOCATE PREPARE homepage_crop_stmt;

SET @homepage_crop_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'homepage_bph' AND COLUMN_NAME = 'image_zoom') = 0,
  'ALTER TABLE homepage_bph ADD COLUMN image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00, ADD COLUMN image_x TINYINT UNSIGNED NOT NULL DEFAULT 50, ADD COLUMN image_y TINYINT UNSIGNED NOT NULL DEFAULT 50',
  'SELECT 1'
);
PREPARE homepage_crop_stmt FROM @homepage_crop_sql;
EXECUTE homepage_crop_stmt;
DEALLOCATE PREPARE homepage_crop_stmt;

SET @homepage_crop_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'homepage_kegiatan' AND COLUMN_NAME = 'image_zoom') = 0,
  'ALTER TABLE homepage_kegiatan ADD COLUMN image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00, ADD COLUMN image_x TINYINT UNSIGNED NOT NULL DEFAULT 50, ADD COLUMN image_y TINYINT UNSIGNED NOT NULL DEFAULT 50',
  'SELECT 1'
);
PREPARE homepage_crop_stmt FROM @homepage_crop_sql;
EXECUTE homepage_crop_stmt;
DEALLOCATE PREPARE homepage_crop_stmt;

SET @homepage_crop_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'homepage_berita' AND COLUMN_NAME = 'image_zoom') = 0,
  'ALTER TABLE homepage_berita ADD COLUMN image_zoom DECIMAL(3,2) NOT NULL DEFAULT 1.00, ADD COLUMN image_x TINYINT UNSIGNED NOT NULL DEFAULT 50, ADD COLUMN image_y TINYINT UNSIGNED NOT NULL DEFAULT 50',
  'SELECT 1'
);
PREPARE homepage_crop_stmt FROM @homepage_crop_sql;
EXECUTE homepage_crop_stmt;
DEALLOCATE PREPARE homepage_crop_stmt;
