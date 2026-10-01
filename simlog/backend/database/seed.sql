USE simlog_hw_unimus;

INSERT INTO bidang (nama_bidang, urutan_rotasi) VALUES
  ('Bidang Organisasi', 1),
  ('Bidang Kepanduan', 2),
  ('AIK', 3),
  ('Kominfo', 4),
  ('Logistik', 5),
  ('Perkaderan', 6),
  ('BKM Kesenian', 7),
  ('BKM Kewirausahaan', 8);

INSERT INTO ruangan (nama_ruangan, lokasi)
SELECT 'Ruang Mako', 'PKM UNIMUS'
WHERE NOT EXISTS (
  SELECT 1 FROM ruangan WHERE nama_ruangan = 'Ruang Mako'
);

INSERT INTO ruangan (nama_ruangan, lokasi)
SELECT 'Gudang', 'PKM UNIMUS'
WHERE NOT EXISTS (
  SELECT 1 FROM ruangan WHERE nama_ruangan = 'Gudang'
);

INSERT INTO kategori_barang (nama_kategori) VALUES
  ('Perlengkapan Lapangan'),
  ('Elektronik'),
  ('Furniture'),
  ('Perlengkapan Kesekretariatan'),
  ('P3K');

INSERT INTO users (nama, username, email, password_hash, role) VALUES
  ('Admin Logistik', 'admin', 'admin@hwunimus.ac.id', '$2b$10$PLACEHOLDER_JALANKAN_SCRIPT_HASH', 'admin_logistik');
