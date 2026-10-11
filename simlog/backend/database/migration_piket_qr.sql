ALTER TABLE piket_pelaksanaan
  MODIFY COLUMN sumber_input ENUM('Google Form', 'Manual', 'QR Website') NOT NULL DEFAULT 'Manual';

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'foto_hash') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN foto_hash CHAR(64) NULL',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

INSERT INTO piket_jadwal (bidang_id, minggu_mulai, minggu_selesai)
SELECT b.id, jadwal.minggu_mulai, jadwal.minggu_selesai
FROM (
  SELECT 'Bidang Organisasi' AS nama_bidang, '2026-10-08' AS minggu_mulai, '2026-10-14' AS minggu_selesai
  UNION ALL SELECT 'Bidang Kepanduan', '2026-10-15', '2026-10-21'
  UNION ALL SELECT 'Kominfo', '2026-10-22', '2026-10-31'
  UNION ALL SELECT 'AIK', '2026-11-01', '2026-11-07'
  UNION ALL SELECT 'Logistik', '2026-11-08', '2026-11-14'
  UNION ALL SELECT 'BKM Kesenian', '2026-11-15', '2026-11-21'
  UNION ALL SELECT 'BKM Kewirausahaan', '2026-11-22', '2026-11-30'
  UNION ALL SELECT 'Perkaderan', '2026-12-01', '2026-12-07'
) AS jadwal
JOIN bidang b ON b.nama_bidang = jadwal.nama_bidang
LEFT JOIN piket_jadwal existing
  ON existing.bidang_id = b.id
  AND existing.minggu_mulai = jadwal.minggu_mulai
WHERE existing.id IS NULL;

DELETE mistaken
FROM piket_jadwal mistaken
JOIN bidang mistaken_bidang
  ON mistaken_bidang.id = mistaken.bidang_id
JOIN bidang correct_bidang
  ON correct_bidang.nama_bidang = 'Kominfo'
JOIN piket_jadwal correct_schedule
  ON correct_schedule.bidang_id = correct_bidang.id
  AND correct_schedule.minggu_mulai = '2026-10-22'
  AND correct_schedule.minggu_selesai = '2026-10-31'
WHERE mistaken_bidang.nama_bidang = 'Bidang Kepanduan'
  AND mistaken.minggu_mulai = '2026-10-22'
  AND mistaken.minggu_selesai = '2026-11-30'
  AND NOT EXISTS (
    SELECT 1
    FROM piket_pelaksanaan submitted
    WHERE submitted.jadwal_id = mistaken.id
  );

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'submission_nonce') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN submission_nonce CHAR(64) NULL',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'submission_day') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN submission_day DATE NULL',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'bidang_id') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN bidang_id INT NULL',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

UPDATE piket_pelaksanaan p
JOIN piket_jadwal j ON j.id = p.jadwal_id
SET p.bidang_id = j.bidang_id
WHERE p.bidang_id IS NULL;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'nama_key') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN nama_key VARCHAR(100) NULL',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND INDEX_NAME = 'uq_piket_foto_hash') = 0,
  'ALTER TABLE piket_pelaksanaan ADD UNIQUE KEY uq_piket_foto_hash (foto_hash)',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND INDEX_NAME = 'uq_piket_submission_nonce') = 0,
  'ALTER TABLE piket_pelaksanaan ADD UNIQUE KEY uq_piket_submission_nonce (submission_nonce)',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND INDEX_NAME = 'uq_piket_nama_bidang_hari') = 0,
  'ALTER TABLE piket_pelaksanaan ADD UNIQUE KEY uq_piket_nama_bidang_hari (submission_day, bidang_id, nama_key)',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;

SET @piket_qr_sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND INDEX_NAME = 'idx_piket_created_at') = 0,
  'CREATE INDEX idx_piket_created_at ON piket_pelaksanaan (created_at)',
  'SELECT 1'
);
PREPARE piket_qr_stmt FROM @piket_qr_sql;
EXECUTE piket_qr_stmt;
DEALLOCATE PREPARE piket_qr_stmt;
