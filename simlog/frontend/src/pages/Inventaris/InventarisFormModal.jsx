import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function InventarisFormModal({ item, onClose, onSuccess, kategoriList, ruanganList }) {
  const [formData, setFormData] = useState({
    nama_barang: '',
    kategori_id: '',
    ruangan_id: '',
    jumlah: 0,
    kondisi: 'Baik',
    lokasi_detail: '',
    tanggal_pendataan: new Date().toISOString().split('T')[0],
    catatan: ''
  });

  const [fotoFile, setFotoFile] = useState(null);
const [previewFoto, setPreviewFoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {

  if (item) {

    setFormData({
      nama_barang: item.nama_barang || '',
      kategori_id: item.kategori_id || '',
      ruangan_id: item.ruangan_id || '',
      jumlah: item.jumlah ?? 0,
      kondisi: item.kondisi || 'Baik',
      lokasi_detail: item.lokasi_detail || '',
      tanggal_pendataan: item.tanggal_pendataan
        ? item.tanggal_pendataan.split('T')[0]
        : new Date().toISOString().split('T')[0],
      catatan: item.catatan || ''
    });

    setPreviewFoto(item.foto_url || '');

  }

}, [item]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    if (fotoFile) {
      data.append('foto', fotoFile);
    }

    try {
      if (item) {
        await api.put(`/inventaris/${item.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/inventaris', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data barang.');
    } finally {
      setLoading(false);
    }
  };

  const dapatkanDaftarRuangan = () => {
    const dataDariAPI = (ruanganList || [])
      .filter(r => {
        const nama = r.nama_ruangan?.toLowerCase() || '';
        return nama.includes('mako') || nama.includes('gudang');
      })
      .map(r => {
        const namaAsli = r.nama_ruangan?.toLowerCase() || '';
        return {
          id: r.id,
          nama: namaAsli.includes('gudang') ? 'Gudang' : 'Mako'
        };
      });

    const adaMako = dataDariAPI.some(r => r.nama === 'Mako');
    const adaGudang = dataDariAPI.some(r => r.nama === 'Gudang');

    if (!adaMako) dataDariAPI.push({ id: 1, nama: 'Mako' });
    if (!adaGudang) dataDariAPI.push({ id: 2, nama: 'Gudang' });

    return dataDariAPI;
  };

  const daftarRuanganFinal = dapatkanDaftarRuangan();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mb-4 flex justify-between border-b pb-3">
          <h3 className="text-lg font-bold">{item ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris'}</h3>
          <button onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label>Nama Barang</label>
            <input
              type="text"
              value={formData.nama_barang}
              onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
              className="w-full border rounded-xl p-2"
              required
            />
          </div>

          <div>
            <label>Kategori</label>
            <select
              value={formData.kategori_id}
              onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
              className="w-full border rounded-xl p-2"
            >
              <option value="">-- Pilih kategori --</option>
              {kategoriList?.map(k => (
                <option key={k.id} value={k.id}>{k.nama_kategori}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Ruangan</label>
            <select
              value={formData.ruangan_id}
              onChange={(e) => setFormData({ ...formData, ruangan_id: e.target.value })}
              className="w-full border rounded-xl p-2"
            >
              <option value="">-- Pilih Ruangan --</option>
              {daftarRuanganFinal.map(r => (
                <option key={r.id} value={r.id}>{r.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Jumlah</label>
            <input
              type="number"
              min="0"
              value={formData.jumlah === 0 ? '' : formData.jumlah}
              onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
              className="w-full border rounded-xl p-2"
            />
          </div>

          <div>
            <label>Kondisi</label>
            <select
              value={formData.kondisi}
              onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
              className="w-full border rounded-xl p-2"
            >
              <option>Baik</option>
              <option>Rusak</option>
              <option>Hilang</option>
              <option>Maintenance</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label>Lokasi Detail</label>
            <input
              value={formData.lokasi_detail}
              onChange={(e) => setFormData({ ...formData, lokasi_detail: e.target.value })}
              className="w-full border rounded-xl p-2"
            />
          </div>

          <div className="sm:col-span-2">
            <label>Tanggal Pendataan</label>
            <input
              type="date"
              value={formData.tanggal_pendataan}
              onChange={(e) => setFormData({ ...formData, tanggal_pendataan: e.target.value })}
              className="w-full border rounded-xl p-2"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label>Foto Barang</label>

            {previewFoto && (
  <img
    src={
      previewFoto.startsWith('/uploads')
      ? `http://localhost:5000${previewFoto}`
      : previewFoto
    }
    className="mb-3 h-24 w-24 rounded-xl object-cover border"
    alt="Foto barang"
  />
)}
            <input
  type="file"
  accept="image/*"
  onChange={(e)=>{

    const file = e.target.files[0];

    setFotoFile(file);

    if(file){
      setPreviewFoto(
        URL.createObjectURL(file)
      );
    }

  }}
/>
          </div>

          <div className="sm:col-span-2">
            <label>Catatan</label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full border rounded-xl p-2"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}>Batal</button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-700 text-white px-4 py-2 rounded-xl"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
