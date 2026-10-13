SET @security_verification_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'status_verifikasi'
);
SET @security_sql = IF(
  @security_verification_exists = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN status_verifikasi TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE security_stmt FROM @security_sql;
EXECUTE security_stmt;
DEALLOCATE PREPARE security_stmt;

SET @security_sql = IF(
  @security_verification_exists = 0,
  'UPDATE piket_pelaksanaan SET status_verifikasi = 0 WHERE sumber_input = ''QR Website''',
  'SELECT 1'
);
PREPARE security_stmt FROM @security_sql;
EXECUTE security_stmt;
DEALLOCATE PREPARE security_stmt;

SET @security_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'diverifikasi_oleh') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN diverifikasi_oleh INT NULL',
  'SELECT 1'
);
PREPARE security_stmt FROM @security_sql;
EXECUTE security_stmt;
DEALLOCATE PREPARE security_stmt;

SET @security_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan' AND COLUMN_NAME = 'diverifikasi_pada') = 0,
  'ALTER TABLE piket_pelaksanaan ADD COLUMN diverifikasi_pada DATETIME NULL',
  'SELECT 1'
);
PREPARE security_stmt FROM @security_sql;
EXECUTE security_stmt;
DEALLOCATE PREPARE security_stmt;

SET @security_sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'piket_pelaksanaan'
     AND CONSTRAINT_NAME = 'fk_piket_verifikasi_user') = 0,
  'ALTER TABLE piket_pelaksanaan ADD CONSTRAINT fk_piket_verifikasi_user FOREIGN KEY (diverifikasi_oleh) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE security_stmt FROM @security_sql;
EXECUTE security_stmt;
DEALLOCATE PREPARE security_stmt;
