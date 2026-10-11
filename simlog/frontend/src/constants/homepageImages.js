export const fallbackBidangImages = [
  'pelantikan hw unimus.jpg',
  'DIKLAT ANGGOTA.jpg',
  'BPH 2025-2026.jpeg',
  'DIKLAT ANGGOTA.jpg',
  'pelantikan hw unimus.jpg',
  'BPH 2025-2026.jpeg',
];

export const fallbackBkmImages = [
  'DIKLAT ANGGOTA.jpg',
  'BPH 2025-2026.jpeg',
];

const fallbackImagesByName = {
  'Bidang Organisasi': fallbackBidangImages[0],
  'Bidang Kominfo': fallbackBidangImages[1],
  'Bidang AIK': fallbackBidangImages[2],
  'Bidang Kepanduan': fallbackBidangImages[3],
  'Bidang Logistik': fallbackBidangImages[4],
  'Bidang Pengkaderan': fallbackBidangImages[5],
  'BKM Kesenian': fallbackBkmImages[0],
  'BKM Kewirausahaan': fallbackBkmImages[1],
};

export function fallbackUnitImage(name, kind = 'bidang') {
  if (fallbackImagesByName[name]) return fallbackImagesByName[name];
  const images = kind === 'bkm' ? fallbackBkmImages : fallbackBidangImages;
  const nameHash = Array.from(name || '').reduce((hash, character) => (
    (hash * 31 + character.charCodeAt(0)) % images.length
  ), 0);
  return images[nameHash];
}
