import React, { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Button from '../components/UI/Button';
import api from '../api/axios';

const emptyForm = { judul: '', deskripsi: '' };
const acceptedFiles = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialsManager() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadMaterials() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/materi');
      setMaterials(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Daftar materi gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  function startEditing(material) {
    setEditingId(material.id);
    setForm({ judul: material.judul, deskripsi: material.deskripsi });
    setFile(null);
    setError('');
    setNotice('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = new FormData();
    payload.append('judul', form.judul);
    payload.append('deskripsi', form.deskripsi);
    if (file) payload.append('file', file);

    try {
      await api[editingId ? 'put' : 'post'](
        `/admin/materi${editingId ? `/${editingId}` : ''}`,
        payload
      );
      setNotice(editingId ? 'Materi berhasil diperbarui.' : 'Materi berhasil ditambahkan.');
      resetForm();
      await loadMaterials();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Materi gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function removeMaterial(material) {
    if (!window.confirm(`Hapus materi "${material.judul}" beserta file-nya?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/materi/${material.id}`);
      if (editingId === material.id) resetForm();
      setNotice('Materi dan file-nya berhasil dihapus.');
      await loadMaterials();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Materi gagal dihapus.');
    }
  }

  return (
    <DashboardLayout title="Kelola Materi" subtitle="Atur file pembelajaran yang tersedia di halaman publik">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#0d5145] to-[#08785d] p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Pusat Materi</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Materi HW UNIMUS</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
          Tambahkan judul, deskripsi, dan file materi. Materi yang tersimpan akan langsung tersedia untuk diunduh di halaman publik.
        </p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <form onSubmit={submit} className="mb-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            {editingId ? <Pencil size={19} /> : <Plus size={20} />}
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">{editingId ? 'Ubah materi' : 'Tambah materi baru'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Format PDF, Word, Excel, PowerPoint, atau TXT · Maksimal 25 MB</p>
          </div>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Judul materi
            <input
              required
              maxLength={180}
              value={form.judul}
              onChange={(event) => setForm({ ...form, judul: event.target.value })}
              placeholder="Contoh: Panduan Dasar Kepanduan"
              className="rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Deskripsi
            <textarea
              required
              maxLength={2000}
              rows={3}
              value={form.deskripsi}
              onChange={(event) => setForm({ ...form, deskripsi: event.target.value })}
              placeholder="Jelaskan ringkasan atau kegunaan materi ini."
              className="resize-y rounded-xl border border-slate-200 px-3.5 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4 text-sm text-emerald-900 transition hover:bg-emerald-50">
            <Upload size={19} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{file?.name || (editingId ? 'Pilih file pengganti (opsional)' : 'Pilih file materi')}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{editingId ? 'Kosongkan jika file yang ada tetap digunakan.' : 'File diperlukan untuk menambahkan materi.'}</span>
            </span>
            <input
              type="file"
              accept={acceptedFiles}
              required={!editingId}
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah materi'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                <X size={16} /> Batal mengubah
              </Button>
            )}
          </div>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Materi tersimpan</h2>
          <p className="mt-1 text-sm text-slate-500">{materials.length} file tersedia untuk publik</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Memuat materi...</div>
      ) : materials.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {materials.map((material) => (
            <article key={material.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <FileText size={21} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{material.judul}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{material.deskripsi}</p>
                  <p className="mt-2 truncate text-xs text-slate-400">{material.nama_asli} · {formatBytes(material.ukuran_file)}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 sm:flex-col">
                <a
                  href={material.download_url}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download size={15} /> File
                </a>
                <button type="button" onClick={() => startEditing(material)} aria-label={`Ubah ${material.judul}`} className="inline-flex h-9 w-10 items-center justify-center rounded-xl border border-emerald-200 text-emerald-800 transition hover:bg-emerald-50">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => removeMaterial(material)} aria-label={`Hapus ${material.judul}`} className="inline-flex h-9 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
          <FileText size={30} className="mx-auto text-emerald-700" />
          <p className="mt-3 font-semibold text-slate-800">Belum ada materi</p>
          <p className="mt-1 text-sm text-slate-500">Tambahkan file materi pertama melalui formulir di atas.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
