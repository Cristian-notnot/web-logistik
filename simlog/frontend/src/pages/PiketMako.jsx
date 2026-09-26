import React, { useState, useEffect } from 'react';
import { exportToExcel } from '../utils/exportToExcel';
import { FileSpreadsheet, CalendarDays, UserCheck, ShieldAlert, Camera } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../api/axios';

export default function PiketMako() {
  const { user, isAdmin } = useAuth();
  
  const [bidangList, setBidangList] = useState([]);
  const [jadwalAktif, setJadwalAktif] = useState(null);
  const [riwayatPiket, setRiwayatPiket] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [adminForm, setAdminForm] = useState({
    bidang_id: '',
    piket_hari_ke: '1',
    minggu_mulai: '',
    minggu_selesai: ''
  });

  const [petugasForm, setPetugasForm] = useState({
    nama_pengisi: '',
    catatan: ''
  });
  const [fotoFile, setFotoFile] = useState(null);

  const loadInitialData = async () => {
    try {
      const [resBidang, resJadwal, resPelaksanaan] = await Promise.all([
        api.get('/master/bidang'),
        api.get('/piket/jadwal-aktif'),
        api.get('/piket/pelaksanaan')
      ]);
      setBidangList(resBidang.data);
      setJadwalAktif(resJadwal.data);
      setRiwayatPiket(resPelaksanaan.data);
    } catch (err) {
      setError('Gagal memuat data sistem piket.');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/piket/jadwal', adminForm);
      setSuccess('Jadwal rotasi piket bidang berhasil diterbitkan!');
      setAdminForm({ bidang_id: '', piket_hari_ke: '1', minggu_mulai: '', minggu_selesai: '' });
      loadInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan jadwal piket.');
    } finally {
      setLoading(false);
    }
  };

  const handlePetugasSubmit = async (e) => {
    e.preventDefault();
    if (!jadwalAktif) {
      setError('Tidak ada jadwal piket yang aktif hari ini.');
      return;
    }
    if (!fotoFile) {
      setError('Dokumentasi foto kegiatan piket wajib diunggah!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('jadwal_id', jadwalAktif.id);
    formData.append('bidang_id', user?.bidang_id || jadwalAktif.bidang_id);
    formData.append('tanggal', new Date().toISOString().split('T')[0]);
    formData.append('nama_pengisi', petugasForm.nama_pengisi);
    formData.append('catatan', petugasForm.catatan);
    formData.append('foto', fotoFile);

    try {
      await api.post('/piket/pelaksanaan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Absensi dan dokumentasi piket Anda berhasil disimpan!');
      setPetugasForm({ nama_pengisi: '', catatan: '' });
      setFotoFile(null);
      loadInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim laporan piket.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = riwayatPiket.map((item, index) => ({
      No: index + 1,
      Tanggal: item.tanggal,
      'Nama Petugas': item.nama_pengisi,
      Bidang: item.nama_bidang,
      Status: item.status,
      Catatan: item.catatan || '—'
    }));
    exportToExcel(dataToExport, 'Laporan_Pelaksanaan_Piket_Mako');
  };

  return (
    <DashboardLayout title="Piket Mako" subtitle="Manajemen penugasan piket bidang dan absensi mandiri petugas mako">
      {error && <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {isAdmin ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-1">
            <div className="mb-4 flex items-center gap-2 text-slate-800">
              <CalendarDays size={20} className="text-brand" />
              <h3 className="text-lg font-bold">Atur Rotasi Piket (Admin)</h3>
            </div>
            <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Pilih Bidang</label>
                <select
                  value={adminForm.bidang_id}
                  onChange={(e) => setAdminForm({ ...adminForm, bidang_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Bidang Logistik --</option>
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>{b.nama_bidang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Piket Hari Ke-</label>
                <input
                  type="number"
                  min="1"
                  value={adminForm.piket_hari_ke}
                  onChange={(e) => setAdminForm({ ...adminForm, piket_hari_ke: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 focus:border-brand focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Mulai</label>
                <input
                  type="date"
                  value={adminForm.minggu_mulai}
                  onChange={(e) => setAdminForm({ ...adminForm, minggu_mulai: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 focus:border-brand focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Selesai</label>
                <input
                  type="date"
                  value={adminForm.minggu_selesai}
                  onChange={(e) => setAdminForm({ ...adminForm, minggu_selesai: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 focus:border-brand focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:bg-slate-300"
              >
                {loading ? 'Memproses...' : 'Terbitkan Jadwal'}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-1">
            <div className="mb-4 flex items-center gap-2 text-slate-800">
              <UserCheck size={20} className="text-brand" />
              <h3 className="text-lg font-bold">Isi Dokumentasi Piket</h3>
            </div>

            {jadwalAktif ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Piket Aktif Saat Ini</p>
                <p className="mt-0.5 text-base font-bold text-slate-800">{jadwalAktif.nama_bidang}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Hari ke-{jadwalAktif.piket_hari_ke} ({jadwalAktif.minggu_mulai} s/d {jadwalAktif.minggu_selesai})
                </p>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <ShieldAlert size={18} />
                <span>Belum ada jadwal penugasan piket aktif dari admin hari ini.</span>
              </div>
            )}

            <form onSubmit={handlePetugasSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Lengkap Petugas</label>
                <input
                  type="text"
                  value={petugasForm.nama_pengisi}
                  onChange={(e) => setPetugasForm({ ...petugasForm, nama_pengisi: e.target.value })}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 focus:border-brand focus:outline-none"
                  required
                  disabled={!jadwalAktif}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan Kegiatan</label>
                <textarea
                  value={petugasForm.catatan}
                  onChange={(e) => setPetugasForm({ ...petugasForm, catatan: e.target.value })}
                  placeholder="Kondisi mako selama piket atau agenda yang terlaksana..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 focus:border-brand focus:outline-none"
                  disabled={!jadwalAktif}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Unggah Dokumentasi Foto</label>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <Camera size={18} className="text-slate-400" />
                    <span className="truncate">
                      {fotoFile ? fotoFile.name : 'Ambil/Pilih Foto Kegiatan'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFotoFile(e.target.files[0])}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={!jadwalAktif}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !jadwalAktif}
                className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:bg-slate-300"
              >
                {loading ? 'Mengirim...' : 'Kirim Laporan Piket'}
              </button>
            </form>
          </div>
        )}

        {/* Riwayat Pelaksanaan Piket */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Riwayat Pelaksanaan Piket</h3>
            {riwayatPiket.length > 0 && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                Ekspor Piket Excel
              </button>
            )}
          </div>

          {riwayatPiket.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Belum ada riwayat pelaksanaan piket.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium">Petugas</th>
                    <th className="pb-3 font-medium">Bidang</th>
                    <th className="pb-3 font-medium">Foto</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatPiket.map((item) => (
                    <tr key={item.id || item.tanggal + item.nama_pengisi} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 text-slate-700">{item.tanggal}</td>
                      <td className="py-3 font-medium text-slate-800">{item.nama_pengisi}</td>
                      <td className="py-3 text-slate-700">{item.nama_bidang}</td>
                      <td className="py-3">
                        {item.foto_url ? (
                          <a
                            href={item.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:underline"
                          >
                            Lihat Foto
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {item.status || 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}