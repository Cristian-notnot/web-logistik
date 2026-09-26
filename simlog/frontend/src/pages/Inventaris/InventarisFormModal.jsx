import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function InventarisFormModal({ item, onClose, onSuccess, kategoriList }) {
  const [formData, setFormData] = useState({
    nama_barang: '',
    kategori_id: '',
    jumlah: 1,
    kondisi: 'Baik',
    lokasi_detail: '',
    tanggal_pendataan: new Date().toISOString().split('T')[0],
    catatan: ''
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        nama_barang: item.nama_barang || '',
        kategori_id: item.kategori_id || '',
        jumlah: item.jumlah || 1,
        kondisi: item.kondisi || 'Baik',
        lokasi_detail: item.lokasi_detail || '',
        tanggal_pendataan: item.tanggal_pendataan ? item.tanggal_pendataan.split('T')[0] : new Date().toISOString().split('T')[0],
        catatan: item.catatan || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (fotoFile) data.append('foto', fotoFile);

    try {
      if (item) {
        await api.put(`/inventaris/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/inventaris', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data barang.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">{item ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Barang</label>
            <input type="text" value={formData.nama_barang} onChange={e => setFormData({ ...formData, nama_barang: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-brand focus:outline-none" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
            <select value={formData.kategori_id} onChange={e => setFormData({ ...formData, kategori_id: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-brand focus:outline-none" required>
              <option value="">-- Pilih kategori --</option>
              {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jumlah</label>
            <input type="number" min="1" value={formData.jumlah} onChange={e => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 1 })} className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-brand focus:outline-none" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kondisi</label>
            <select value={formData.kondisi} onChange={e => setFormData({ ...formData, kondisi: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-brand focus:outline-none">
              <option value="Baik">Baik</option>
              <option value="Rusak">Rusak</option>
              <option value="Hilang">Hilang</option>
              <option value="Perbaikan">Perbaikan</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lokasi Detail</label>
            <input type="text" value={formData.lokasi_detail} onChange={e => setFormData({ ...formData, lokasi_detail: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-brand focus:outline-none" placeholder="mis. Rak 2, sisi kiri" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Pendataan</label>
            <input type="date" value={formData.tanggal_pendataan} onChange={e => setFormData({ ...formData, tanggal_pendataan: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-brand focus:outline-none" required />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Foto Barang</label>
            <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files[0])} className="w-full text-sm text-slate-600" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Catatan</label>
            <textarea value={formData.catatan} onChange={e => setFormData({ ...formData, catatan: e.target.value })} rows="3" className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-brand focus:outline-none"></textarea>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:bg-slate-300">{loading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}