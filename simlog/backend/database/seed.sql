USE simlog_hw_unimus;

-- 8 Bidang untuk rotasi piket (sesuaikan nama sesuai struktur HW UNIMUS kalian)
INSERT INTO bidang (nama_bidang, urutan_rotasi) VALUES
  ('Bidang Organisasi', 1),
  ('Bidang Kepanduan', 2),
  ('AIK', 3),
  ('Kominfo', 4),
  ('Logistik', 5),
  ('Perkaderan', 6),
  ('BKM Kesenian', 7),
  ('BKM Kewirausahaan', 8);

-- Ruangan Mako
INSERT INTO ruangan (nama_ruangan, lokasi) VALUES
  ('Ruang Sekretariat', 'Mako Lantai 1'),
  ('Gudang Logistik', 'Mako Lantai 1'),
  ('Ruang Rapat', 'Mako Lantai 2');

-- Kategori barang
INSERT INTO kategori_barang (nama_kategori) VALUES
  ('Perlengkapan Lapangan'),
  ('Elektronik'),
  ('Furniture'),
  ('Perlengkapan Kesekretariatan'),
  ('P3K & Medis'),
  ('Tenda & Perkemahan');

-- Admin default (username: admin, password: ganti_password_ini)
-- Password awal belum diisi secara sengaja. Setelah menjalankan seed,
-- set password admin dengan: npm run reset-admin-password -- "password-aman"
INSERT INTO users (nama, username, email, password_hash, role) VALUES
  ('Admin Logistik', 'admin', 'admin@hwunimus.ac.id', '$2b$10$PLACEHOLDER_JALANKAN_SCRIPT_HASH', 'admin_logistik');
