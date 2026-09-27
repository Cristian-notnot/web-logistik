import React, { useState, useEffect } from 'react';
import { exportToExcel } from '../utils/exportToExcel';
import { FileSpreadsheet, PackagePlus, ClipboardList, Camera } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../api/axios';

export default function UnboxingPendataan() {
  const [formData, setFormData] = useState({
    nama_barang: '',
    tanggal: new Date().toISOString().split('T')[0],
    kondisi_umum: 'Baik',
    catatan: ''
  });
  
  const [fotoFile, setFotoFile] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRiwayat = async () => {
    try {
      const response = await api.get('/unboxing');
      setRiwayat(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append('nama_barang', formData.nama_barang);
    data.append('tanggal', formData.tanggal);
    data.append('kondisi_umum', formData.kondisi_umum);
    data.append('catatan', formData.catatan);
    if (fotoFile) {
      data.append('foto', fotoFile);
    }

    try {
      const response = await api.post('/unboxing', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.status === 201 || response.status === 200) {
        setSuccess('Data pemeriksaan barang berhasil disimpan!');
        setFormData({
          nama_barang: '',
          tanggal: new Date().toISOString().split('T')[0],
          kondisi_umum: 'Baik',
          catatan: ''
        });
        setFotoFile(null);
        fetchRiwayat();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = riwayat.map((item, index) => ({
      No: index + 1,
      Tanggal: item.tanggal,
      'Nama Barang': item.nama_barang,
      'Kondisi Umum': item.kondisi_umum,
      Catatan: item.catatan || '—'
    }));
    exportToExcel(dataToExport, 'Riwayat_Pendataan_Unboxing');
  };

  return (
    <DashboardLayout title="Unboxing Mako" subtitle="Pendataan kondisi ruang dan checklist Mako.">
      <div className="mb-4">
        <button className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
          Catat Pemeriksaan Barang
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-1">
          {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Barang Inventaris</label>
              <input
                type="text"
                name="nama_barang"
                value={formData.nama_barang}
                onChange={handleChange}
                placeholder="Masukkan nama barang manual (cth: Pataka)"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 transition focus:border-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal</label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 transition focus:border-brand focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Pilih Kondisi</label>
              <select
                name="kondisi_umum"
                value={formData.kondisi_umum}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-700 transition focus:border-brand focus:outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Rusak">Rusak</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan Pemeriksaan</label>
              <textarea
                name="catatan"
                value={formData.catatan}
                onChange={handleChange}
                placeholder="Masukkan catatan pemeriksaan barang di sini..."
                rows="3"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-800 transition focus:border-brand focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Dokumentasi Foto</label>
              <div className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 transition hover:border-brand">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoFile(e.target.files[0])}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="text-center text-slate-500">
                  <Camera size={24} className="mx-auto mb-1 text-slate-400" />
                  <span className="text-xs font-medium">{fotoFile ? fotoFile.name : 'Ambil/Pilih Foto Dokumentasi'}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-800 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 disabled:bg-slate-300"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800">Riwayat Pendataan Barang</h3>
            {riwayat.length > 0 && (
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <FileSpreadsheet size={16} /> Ekspor Excel
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Kondisi Umum</th>
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riwayat.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  riwayat.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">{item.tanggal}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.nama_barang}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.kondisi_umum === 'Baik' ? 'bg-green-50 text-green-700' :
                          item.kondisi_umum === 'Rusak' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.kondisi_umum}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.foto_url && (
                          <img src={`http://localhost:5000${item.foto_url}`} className="h-10 w-16 rounded border object-cover shadow-sm" alt="Dokumentasi" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{item.catatan || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}