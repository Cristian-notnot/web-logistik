import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import Modal from '../../components/UI/Modal';
import Button from '../../components/UI/Button';
import api from '../../api/axios';

const kondisiOptions = ['Baik', 'Rusak', 'Hilang', 'Maintenance'];

export default function InventarisFormModal({ item, kategoriList, ruanganList, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState({
    nama_barang: item?.nama_barang || '',
    kategori_id: item?.kategori_id || '',
    jumlah: item?.jumlah || 1,
    kondisi: item?.kondisi || 'Baik',
    ruangan_id: item?.ruangan_id || '',
    lokasi_detail: item?.lokasi_detail || '',
    tanggal_pendataan: item?.tanggal_pendataan || new Date().toISOString().slice(0, 10),
    catatan: item?.catatan || '',
    foto_url: item?.foto_url || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('foto_url', data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/inventaris/${item.id}`, form);
      } else {
        await api.post('/inventaris', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data barang.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Barang' : 'Tambah Barang Inventaris'} onClose={onClose} width="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="px-3.5 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Barang</label>
          <input
            required
            value={form.nama_barang}
            onChange={(e) => set('nama_barang', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm"
            placeholder="mis. Tenda Dome Kapasitas 4"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
            <select
              value={form.kategori_id}
              onChange={(e) => set('kategori_id', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm bg-white"
            >
              <option value="">— Pilih kategori —</option>
              {kategoriList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kategori}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah</label>
            <input
              type="number"
              min={1}
              required
              value={form.jumlah}
              onChange={(e) => set('jumlah', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kondisi</label>
            <select
              value={form.kondisi}
              onChange={(e) => set('kondisi', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm bg-white"
            >
              {kondisiOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ruangan</label>
            <select
              value={form.ruangan_id}
              onChange={(e) => set('ruangan_id', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm bg-white"
            >
              <option value="">— Pilih ruangan —</option>
              {ruanganList.map((r) => (
                <option key={r.id} value={r.id}>{r.nama_ruangan}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Lokasi Detail</label>
            <input
              value={form.lokasi_detail}
              onChange={(e) => set('lokasi_detail', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm"
              placeholder="mis. Rak 2, sisi kiri"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Pendataan</label>
            <input
              type="date"
              required
              value={form.tanggal_pendataan}
              onChange={(e) => set('tanggal_pendataan', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Foto Barang</label>
          <div className="flex items-center gap-3">
            {form.foto_url && (
              <img src={form.foto_url} alt="Pratinjau" className="h-14 w-14 rounded-lg object-cover border border-slate-200" />
            )}
            <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 cursor-pointer hover:bg-slate-50">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {uploading ? 'Mengunggah…' : 'Unggah foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
          <textarea
            rows={2}
            value={form.catatan}
            onChange={(e) => set('catatan', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-ring text-sm resize-none"
            placeholder="Catatan tambahan (opsional)"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Barang'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
