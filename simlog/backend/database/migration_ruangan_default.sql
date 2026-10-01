USE simlog_hw_unimus;

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
