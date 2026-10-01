import React, { useEffect, useState } from 'react';
import { FileImage, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Button from '../components/UI/Button';
import api from '../api/axios';

const tabs = [
  ['slides', 'Slider'],
  ['about', 'Tentang'],
  ['units', 'Bidang & BKM'],
  ['activities', 'Kegiatan'],
];

const aboutFallback = {
  label: 'Tentang HW UNIMUS',
  title: 'Tempat tumbuh bagi kader yang aktif dan berkarakter',
  paragraf_pertama: '',
  paragraf_kedua: '',
};

const imageSrc = (value) => {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return value.startsWith('/') ? value : `/${value}`;
};

function ItemEditor({ kind, record, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState(record || {});
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(imageSrc(record?.image_url));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record || {});
    setImageFile(null);
    setPreview(imageSrc(record?.image_url));
  }, [record]);

  useEffect(() => {
    if (!imageFile) return undefined;
    const objectUrl = URL.createObjectURL(imageFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const isSlide = kind === 'slide';
  const isUnit = ['unit', 'bidang', 'bkm'].includes(kind);
  const imagePositionClass = {
    center: 'object-center',
    top: 'object-top',
    bottom: 'object-bottom',
  }[form.image_position] || 'object-center';

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = new FormData(event.currentTarget);
    payload.set('aktif', form.aktif === false || Number(form.aktif) === 0 ? '0' : '1');
    if (imageFile) payload.set('image', imageFile);
    try {
      await onSave(payload, record?.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
      <div className="relative aspect-[16/7] bg-emerald-50">
        {preview ? (
          <img src={preview} alt="Preview konten" className={`h-full w-full object-cover ${imagePositionClass}`} />
        ) : (
          <div className="flex h-full items-center justify-center text-emerald-700">
            <FileImage size={30} />
          </div>
        )}
        <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-md">
          <FileImage size={15} />
          {preview ? 'Ganti foto' : 'Pilih foto'}
          <input
            className="sr-only"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      <div className="grid gap-3 p-4">
        {isSlide && (
          <input
            name="label"
            value={form.label || ''}
            onChange={(event) => update('label', event.target.value)}
            placeholder="Label slide"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        )}
        {isUnit ? (
          <input
            name="nama"
            required
            value={form.nama || ''}
            onChange={(event) => update('nama', event.target.value)}
            placeholder="Nama bidang/BKM"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        ) : (
          <input
            name="title"
            required
            value={form.title || ''}
            onChange={(event) => update('title', event.target.value)}
            placeholder={isSlide ? 'Judul slide' : 'Judul kegiatan'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        )}
        <textarea
          name={isUnit ? 'deskripsi' : isSlide ? 'description' : 'caption'}
          value={(isUnit ? form.deskripsi : isSlide ? form.description : form.caption) || ''}
          onChange={(event) => update(isUnit ? 'deskripsi' : isSlide ? 'description' : 'caption', event.target.value)}
          placeholder={isUnit ? 'Deskripsi' : isSlide ? 'Deskripsi slide' : 'Caption kegiatan'}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
        />
        {isSlide && (
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            Posisi Foto
            <select
              name="image_position"
              value={form.image_position || 'center'}
              onChange={(event) => update('image_position', event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800"
            >
              <option value="center">Tengah</option>
              <option value="top">Atas</option>
              <option value="bottom">Bawah</option>
            </select>
          </label>
        )}
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.aktif === undefined ? true : Boolean(Number(form.aktif))}
              onChange={(event) => update('aktif', event.target.checked ? 1 : 0)}
              className="h-4 w-4 accent-emerald-700"
            />
            Aktif
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            Urutan
            <input
              name="urutan"
              type="number"
              min="0"
              value={form.urutan ?? 0}
              onChange={(event) => update('urutan', event.target.value)}
              className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          {record && (
            <Button type="button" variant="danger" className="px-3 py-2" onClick={() => onDelete(record)}>
              <Trash2 size={15} /> Hapus
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="secondary" className="px-3 py-2" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button type="submit" disabled={saving} className="px-3 py-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {record ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function HomepageManager() {
  const [activeTab, setActiveTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [about, setAbout] = useState(aboutFallback);
  const [bidang, setBidang] = useState([]);
  const [bkm, setBkm] = useState([]);
  const [kegiatan, setKegiatan] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAbout, setSavingAbout] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadContent() {
    setLoading(true);
    setError('');
    try {
      const [publicData, slideData, bidangData, bkmData, kegiatanData] = await Promise.all([
        api.get('/public/homepage'),
        api.get('/admin/homepage/slides'),
        api.get('/admin/homepage/bidang'),
        api.get('/admin/homepage/bkm'),
        api.get('/admin/homepage/kegiatan'),
      ]);
      setSlides(slideData.data);
      setAbout(publicData.data.about || aboutFallback);
      setBidang(bidangData.data);
      setBkm(bkmData.data);
      setKegiatan(kegiatanData.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Konten beranda gagal dimuat. Pastikan migration homepage sudah dijalankan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const collectionPath = (kind) => {
    if (kind === 'slide') return 'slides';
    if (kind === 'unit' || kind === 'bidang') return 'bidang';
    if (kind === 'bkm') return 'bkm';
    return 'kegiatan';
  };

  async function saveItem(kind, payload, id) {
    const path = `/admin/homepage/${collectionPath(kind)}${id ? `/${id}` : ''}`;
    setError('');
    try {
      await api[id ? 'put' : 'post'](path, payload);
      setCreating(false);
      setNotice('Konten beranda berhasil disimpan.');
      await loadContent();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Konten beranda gagal disimpan.');
    }
  }

  async function deleteItem(kind, item) {
    if (!window.confirm(`Hapus "${item.title || item.nama || item.label}" dari beranda?`)) return;
    setError('');
    try {
      await api.delete(`/admin/homepage/${collectionPath(kind)}/${item.id}`);
      setNotice('Konten beranda berhasil dihapus.');
      await loadContent();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Konten beranda gagal dihapus.');
    }
  }

  async function saveAbout(event) {
    event.preventDefault();
    setSavingAbout(true);
    setError('');
    try {
      await api.put('/admin/homepage/about', about);
      setNotice('Konten Tentang berhasil disimpan.');
      await loadContent();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Konten Tentang gagal disimpan.');
    } finally {
      setSavingAbout(false);
    }
  }

  function editor(kind, record, isNew = false) {
    const actualKind = kind === 'unit' && isNew ? creating : kind;
    return (
      <ItemEditor
        key={`${actualKind}-${record?.id || 'new'}`}
        kind={actualKind}
        record={record}
        onSave={(payload, id) => saveItem(actualKind, payload, id)}
        onDelete={(item) => deleteItem(actualKind, item)}
        onCancel={isNew ? () => setCreating(false) : undefined}
      />
    );
  }

  const pageTab = tabs.find(([key]) => key === activeTab)?.[1];

  return (
    <DashboardLayout title="Kelola Beranda" subtitle="Atur konten publik HW UNIMUS tanpa mengubah source code">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bagian beranda">
          {tabs.map(([key, text]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => { setActiveTab(key); setCreating(false); }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === key ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'}`}
            >
              {text}
            </button>
          ))}
        </div>
        {!creating && activeTab === 'units' && (
          <div className="flex gap-2">
            <Button onClick={() => setCreating('bidang')}><Plus size={16} /> Tambah bidang</Button>
            <Button variant="secondary" onClick={() => setCreating('bkm')}><Plus size={16} /> Tambah BKM</Button>
          </div>
        )}
        {!creating && activeTab === 'slides' && (
          <Button onClick={() => setCreating(true)}><Plus size={16} /> Tambah slide</Button>
        )}
        {!creating && activeTab === 'activities' && (
          <Button onClick={() => setCreating(true)}><Plus size={16} /> Tambah kegiatan</Button>
        )}
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Memuat konten...</div>
      ) : activeTab === 'about' ? (
        <form onSubmit={saveAbout} className="max-w-3xl space-y-4 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Label section<input value={about.label || ''} onChange={(event) => setAbout({ ...about, label: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Judul<input value={about.title || ''} onChange={(event) => setAbout({ ...about, title: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Paragraf pertama<textarea rows={4} value={about.paragraf_pertama || ''} onChange={(event) => setAbout({ ...about, paragraf_pertama: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Paragraf kedua<textarea rows={4} value={about.paragraf_kedua || ''} onChange={(event) => setAbout({ ...about, paragraf_kedua: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <Button type="submit" disabled={savingAbout}>{savingAbout ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Tentang</Button>
        </form>
      ) : (
        <>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{pageTab}</h2>
          {creating && activeTab !== 'units' && <div className="mb-5 max-w-3xl">{editor(activeTab === 'slides' ? 'slide' : 'activity', null, true)}</div>}
          {creating && activeTab === 'units' && <div className="mb-5 max-w-3xl">{editor('unit', null, true)}</div>}
          {activeTab === 'slides' && (
            <div className="grid gap-5 xl:grid-cols-2">{slides.map((slide) => editor('slide', slide))}</div>
          )}
          {activeTab === 'units' && (
            <>
              <h3 className="mb-3 font-semibold text-emerald-900">Bidang</h3>
              <div className="mb-7 grid gap-5 xl:grid-cols-2">{bidang.map((item) => editor('unit', item))}</div>
              <h3 className="mb-3 font-semibold text-emerald-900">Bina Karya Mandiri</h3>
              <div className="grid gap-5 xl:grid-cols-2">{bkm.map((item) => editor('bkm', item))}</div>
            </>
          )}
          {activeTab === 'activities' && (
            <div className="grid gap-5 xl:grid-cols-2">{kegiatan.map((item) => editor('activity', item))}</div>
          )}
          {activeTab === 'slides' && !slides.length && !creating && <p className="text-sm text-slate-500">Belum ada slide. Halaman publik tetap memakai konten fallback.</p>}
          {activeTab === 'activities' && !kegiatan.length && !creating && <p className="text-sm text-slate-500">Belum ada kegiatan.</p>}
        </>
      )}
    </DashboardLayout>
  );
}
