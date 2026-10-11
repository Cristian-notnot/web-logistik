# SIM Logistik HW UNIMUS

Sistem Informasi Manajemen Logistik khusus untuk **Mako & Bidang Logistik HW UNIMUS**
(bukan website HW UNIMUS secara keseluruhan). Dashboard bergaya pusat monitoring
(mirip BPBD): modern, sederhana, responsif.

## Status pengembangan saat ini — Fase 1 ✅

Sesuai urutan prioritas yang diminta, fase yang **sudah jalan penuh**:

- ✅ **Database** — skema relasional lengkap untuk *semua* modul (lihat `backend/database/schema.sql`), termasuk tabel `inventaris_riwayat` sebagai audit trail.
- ✅ **Login** — JWT auth, 3 role: `admin_logistik`, `anggota_bidang`, `ketua_pembina`.
- ✅ **Inventaris** — CRUD penuh, upload foto, riwayat/audit trail otomatis di setiap perubahan, kartu statistik di dashboard, filter & pencarian.

Modul berikut **sudah punya tabel database & tempat di sidebar**, tapi API dan
UI-nya belum dibangun — menyusul sesuai urutan yang kamu tentukan:

1. Unboxing & Pendataan Mako
2. Piket Mako (QR website)
3. Ruang/Barang Sewa
4. Pengadaan
5. Revitalisasi
6. Dashboard & Laporan lanjutan (grafik, export)

Kabari saja kalau mau lanjut ke modul berikutnya — struktur project ini sudah
disiapkan supaya tinggal "disambung" (controller, route, dan halaman baru
mengikuti pola yang sama seperti modul Inventaris).

## Teknologi

- **Frontend:** React + Vite + Tailwind CSS, react-router-dom, axios, lucide-react
- **Backend:** Node.js + Express, mysql2, JWT (jsonwebtoken), bcrypt, multer (upload foto)
- **Database:** MySQL (dev: Laragon)

## Struktur folder

```
simlog/
├── backend/
│   ├── database/
│   │   ├── schema.sql      # semua tabel (jalankan ini duluan)
│   │   └── seed.sql        # data awal: 8 bidang, ruangan, kategori, admin
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/     # auth.js (JWT), role.js (RBAC)
│   │   ├── controllers/    # authController, inventarisController, masterDataController
│   │   ├── routes/
│   │   └── utils/          # jwt.js, hashPassword.js
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/Layout/ (Sidebar, Topbar, DashboardLayout)
        ├── components/UI/     (Button, Modal, StatCard, KondisiBadge)
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            └── Inventaris/ (List, FormModal, DetailModal)
```

## Cara menjalankan (dengan Laragon)

### 1. Siapkan database

1. Nyalakan Laragon (pastikan MySQL aktif).
2. Buka HeidiSQL / phpMyAdmin bawaan Laragon, lalu jalankan:
   - `backend/database/schema.sql` (membuat database & seluruh tabel)
   - `backend/database/migration_homepage_cms.sql` (tabel konten beranda, berita, BPH, dan pengaturan zoom/crop foto)
   - `backend/database/migration_piket_qr.sql` (keamanan foto, anti-duplikasi, dan dukungan form QR)
   - `backend/database/seed.sql` (data awal 8 bidang, ruangan, kategori, admin)
3. Untuk menolak unggahan yang sama dengan foto piket lama yang file-nya masih tersedia, jalankan dari folder `backend`:

   ```bash
   node scripts/backfillPiketPhotoHashes.js
   ```

### 2. Buat password admin

Password di `seed.sql` masih placeholder. Generate hash asli:

```bash
cd backend
npm install
node src/utils/hashPassword.js "password_pilihanmu"
```

Salin hasil hash ke kolom `password_hash` pada baris user `admin` di tabel `users`
(lewat HeidiSQL/phpMyAdmin), menggantikan `$2b$10$PLACEHOLDER_JALANKAN_SCRIPT_HASH`.

### 3. Jalankan backend

```bash
cd backend
cp .env.example .env
# sesuaikan .env kalau perlu (default sudah cocok untuk Laragon: root / tanpa password)
npm run dev
```

Backend jalan di `http://localhost:5000`. Cek `http://localhost:5000/api/health`.

### 4. Jalankan frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173`, login dengan username `admin` dan password yang
kamu buat di langkah 2.

## Tentang audit trail

Setiap kali barang di Inventaris ditambah, diedit, kondisinya berubah, atau
dihapus, sistem otomatis menulis satu baris ke `inventaris_riwayat` (siapa,
kapan, apa yang berubah, data sebelum & sesudah dalam format JSON). Ini yang
nanti jadi dasar untuk Laporan dan feed "Aktivitas Logistik Terbaru" di
dashboard — dan sudah aktif dari sekarang, bukan fitur yang menyusul.

## Piket melalui QR website

Jalankan atau impor ulang `backend/database/migration_piket_qr.sql` pada
database yang sama dengan backend. Migration ini menambahkan jadwal dari gambar
untuk Organisasi (minggu ke-2 Oktober 2026), Kepanduan (ke-3 Oktober), Kominfo
(ke-4 Oktober), AIK (ke-1 November), Logistik (ke-2 November), BKM Kesenian
(ke-3 November), BKM Kewirausahaan (ke-4 November), dan Perkaderan
(ke-1 Desember). Aman diulang; jadwal dengan tanggal mulai yang sama tidak
digandakan. Migration juga menghapus jadwal Kepanduan 22 Oktober–30 November
yang keliru bila jadwal Kominfo yang benar tersedia dan belum ada laporan piket
yang merujuk ke jadwal keliru tersebut. Admin dapat
mencetak QR dari halaman **Piket Harian**; QR membuka `/form-piket`, tempat
anggota melihat jadwal per bidang terlebih dahulu; tombol pengisian hanya
tersedia untuk bidang yang sedang bertugas. Setelah dipilih, anggota mengisi
nama, foto kamera, dan catatan opsional.
Riwayat serta foto hanya dapat dilihat lewat halaman piket admin yang meminta
login. Waktu pencatatan berasal dari server, hash SHA-256 menolak file yang
identik, dan nama yang sama hanya dapat mengirim satu laporan untuk bidangnya
per hari. Foto yang dikirim melalui QR disimpan di direktori privat dan dibuka
melalui endpoint yang memerlukan login admin.

Akses kamera ponsel memerlukan HTTPS. Form memakai petunjuk capture kamera
native dengan pilihan kamera depan/belakang; perilakunya bergantung pada browser
dan perangkat, sehingga browser tetap tidak dapat membuktikan secara mutlak
bahwa foto diambil saat kegiatan berlangsung. Hash SHA-256 tidak mengenali foto yang sama
setelah diedit atau dikompres. Nama yang diisi sendiri juga bukan verifikasi
identitas anggota; gunakan autentikasi akun jika verifikasi identitas diwajibkan.
Admin dapat melihat seluruh jadwal dan status bentrok pada bagian **Jadwal
Piket**. Gunakan **Tambah Jadwal Piket** untuk memilih bidang dan tanggal mulai
sampai tanggal akhir; sistem menolak rentang terbalik atau yang bertabrakan
dengan jadwal lain.
Backfill hash foto lama hanya dapat mencakup file foto yang masih ada di folder
unggahan lokal.
