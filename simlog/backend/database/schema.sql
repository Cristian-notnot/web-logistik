CREATE DATABASE IF NOT EXISTS simlog_hw_unimus
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE simlog_hw_unimus;

CREATE TABLE bidang (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama_bidang   VARCHAR(100) NOT NULL,
  deskripsi     VARCHAR(255) NULL,
  urutan_rotasi INT NOT NULL DEFAULT 0,   
  aktif         TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(100) NULL,
  foto_url      VARCHAR(255) NULL,
  deskripsi     TEXT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin_logistik','anggota_bidang','ketua_pembina') NOT NULL DEFAULT 'anggota_bidang',
  bidang_id     INT NULL,
  aktif         TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_bidang FOREIGN KEY (bidang_id) REFERENCES bidang(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE ruangan (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nama_ruangan VARCHAR(100) NOT NULL,
  lokasi      VARCHAR(150) NULL,
  deskripsi   VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE kategori_barang (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(100) NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE inventaris (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nama_barang       VARCHAR(150) NOT NULL,
  kategori_id       INT NULL,
  jumlah            INT NOT NULL DEFAULT 1,
  kondisi           ENUM('Baik','Rusak','Hilang','Maintenance') NOT NULL DEFAULT 'Baik',
  ruangan_id        INT NULL,
  lokasi_detail     VARCHAR(150) NULL,   
  foto_url          VARCHAR(255) NULL,
  catatan           TEXT NULL,
  tanggal_pendataan DATE NOT NULL,
  sumber            ENUM('Pendataan Awal','Pengadaan','Manual') NOT NULL DEFAULT 'Manual',
  is_disewakan      TINYINT(1) NOT NULL DEFAULT 0, 
  created_by        INT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL, 
  CONSTRAINT fk_inv_kategori FOREIGN KEY (kategori_id) REFERENCES kategori_barang(id) ON DELETE SET NULL,
  CONSTRAINT fk_inv_ruangan FOREIGN KEY (ruangan_id) REFERENCES ruangan(id) ON DELETE SET NULL,
  CONSTRAINT fk_inv_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inv_kondisi (kondisi),
  INDEX idx_inv_nama (nama_barang)
) ENGINE=InnoDB;

CREATE TABLE inventaris_riwayat (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  inventaris_id  INT NOT NULL,
  tipe_perubahan ENUM(
    'Ditambahkan','Diperbarui','Diperbaiki','Disewa','Dikembalikan',
    'Kondisi Berubah','Dipindah Lokasi','Dihapus'
  ) NOT NULL,
  keterangan     VARCHAR(255) NULL,
  data_sebelum   JSON NULL,
  data_sesudah   JSON NULL,
  changed_by     INT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_riwayat_inventaris FOREIGN KEY (inventaris_id) REFERENCES inventaris(id) ON DELETE CASCADE,
  CONSTRAINT fk_riwayat_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_riwayat_inventaris (inventaris_id)
) ENGINE=InnoDB;

CREATE TABLE unboxing_pendataan (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  ruangan_id     INT NULL,
  inventaris_id  INT NULL,
  tanggal        DATE NOT NULL,
  kondisi_umum   ENUM('Baik','Perlu Perhatian','Rusak') NOT NULL DEFAULT 'Baik',
  catatan        TEXT NULL,
  foto_url       VARCHAR(255) NULL,
  dilakukan_oleh INT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_unboxing_ruangan FOREIGN KEY (ruangan_id) REFERENCES ruangan(id) ON DELETE CASCADE,
  CONSTRAINT fk_unboxing_inventaris KEY (inventaris_id) REFERENCES inventaris(id) ON DELETE SET NULL,
  CONSTRAINT fk_unboxing_user FOREIGN KEY (dilakukan_oleh) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE unboxing_checklist_item (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  unboxing_id   INT NOT NULL,
  item          VARCHAR(150) NOT NULL,   
  status        ENUM('Baik','Kurang','Buruk') NOT NULL DEFAULT 'Baik',
  catatan       VARCHAR(255) NULL,
  CONSTRAINT fk_checklist_unboxing FOREIGN KEY (unboxing_id) REFERENCES unboxing_pendataan(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE unboxing_inventaris (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  unboxing_id   INT NOT NULL,
  inventaris_id INT NOT NULL,
  CONSTRAINT fk_ui_unboxing FOREIGN KEY (unboxing_id) REFERENCES unboxing_pendataan(id) ON DELETE CASCADE,
  CONSTRAINT fk_ui_inventaris FOREIGN KEY (inventaris_id) REFERENCES inventaris(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE piket_jadwal (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  bidang_id      INT NOT NULL,
  piket_hari_ke  INT NOT NULL DEFAULT 1,
  minggu_mulai   DATE NOT NULL,
  minggu_selesai DATE NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_jadwal_bidang FOREIGN KEY (bidang_id) REFERENCES bidang(id) ON DELETE CASCADE,
  UNIQUE KEY uq_minggu_hari (minggu_mulai, bidang_id, piket_hari_ke)
) ENGINE=InnoDB;

CREATE TABLE piket_pelaksanaan (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  jadwal_id              INT NOT NULL,
  tanggal                DATE NOT NULL,
  status                 ENUM('Belum','Selesai','Tidak Terlaksana') NOT NULL DEFAULT 'Belum',
  nama_pengisi           VARCHAR(100) NOT NULL,   
  bidang_id              INT NOT NULL,
  catatan                TEXT NULL,
  foto_url               VARCHAR(255) NOT NULL,
  sumber_input           ENUM('Google Form','Manual') NOT NULL DEFAULT 'Manual',
  google_form_response_id VARCHAR(150) NULL UNIQUE,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pelaksanaan_jadwal FOREIGN KEY (jadwal_id) REFERENCES piket_jadwal(id) ON DELETE CASCADE,
  CONSTRAINT fk_pelaksanaan_bidang FOREIGN KEY (bidang_id) REFERENCES bidang(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE barang_sewa (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  inventaris_id    INT NULL,   
  nama_barang      VARCHAR(150) NOT NULL,
  kategori_id      INT NULL,
  jumlah_total     INT NOT NULL DEFAULT 0,
  jumlah_tersedia  INT NOT NULL DEFAULT 0,
  jumlah_disewa    INT NOT NULL DEFAULT 0,
  status           ENUM('Ready','Sebagian Disewa','Disewa','Rusak','Maintenance','Hilang') NOT NULL DEFAULT 'Ready',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sewa_inventaris FOREIGN KEY (inventaris_id) REFERENCES inventaris(id) ON DELETE SET NULL,
  CONSTRAINT fk_sewa_kategori FOREIGN KEY (kategori_id) REFERENCES kategori_barang(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE peminjaman (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  barang_sewa_id         INT NOT NULL,
  nama_penyewa           VARCHAR(150) NOT NULL,
  kontak_penyewa         VARCHAR(100) NULL,
  jumlah_dipinjam        INT NOT NULL DEFAULT 1,
  tanggal_mulai          DATE NOT NULL,
  tanggal_kembali_rencana DATE NOT NULL,
  tanggal_kembali_aktual  DATE NULL,
  status                 ENUM('Berjalan','Selesai','Terlambat') NOT NULL DEFAULT 'Berjalan',
  surat_peminjaman_url   VARCHAR(255) NULL,
  ktm_url                VARCHAR(255) NULL,
  catatan                TEXT NULL,
  sumber_input           ENUM('Google Form','Manual') NOT NULL DEFAULT 'Manual',
  google_form_response_id VARCHAR(150) NULL UNIQUE,
  dicatat_oleh           INT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pinjam_barang FOREIGN KEY (barang_sewa_id) REFERENCES barang_sewa(id) ON DELETE CASCADE,
  CONSTRAINT fk_pinjam_user FOREIGN KEY (dicatat_oleh) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE pengadaan (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama_pengadaan VARCHAR(150) NOT NULL,
  jumlah        INT NOT NULL DEFAULT 1,
  anggaran      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status        ENUM('Diajukan','Disetujui','Ditolak','Selesai') NOT NULL DEFAULT 'Diajukan',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
