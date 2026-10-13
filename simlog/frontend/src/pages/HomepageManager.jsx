import React, { useEffect, useRef, useState } from 'react';
import { FileImage, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Button from '../components/UI/Button';
import api from '../api/axios';
import { fallbackUnitImage } from '../constants/homepageImages';

const tabs = [
  ['slides', 'Slider'],
  ['about', 'Tentang'],
  ['units', 'Struktur'],
  ['activities', 'Kegiatan'],
  ['news', 'Berita'],
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

function ImageCropEditor({ file, aspectRatio, onCancel, onApply }) {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [image, setImage] = useState(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setSourceUrl(objectUrl);
    setImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError('');
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!frameRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  const baseScale = image && frameSize.width && frameSize.height
    ? Math.max(frameSize.width / image.naturalWidth, frameSize.height / image.naturalHeight)
    : 0;
  const displayedWidth = image ? image.naturalWidth * baseScale * zoom : 0;
  const displayedHeight = image ? image.naturalHeight * baseScale * zoom : 0;

  function clampOffset(nextOffset, nextZoom = zoom) {
    if (!image || !frameSize.width || !frameSize.height) return nextOffset;
    const width = image.naturalWidth * baseScale * nextZoom;
    const height = image.naturalHeight * baseScale * nextZoom;
    return {
      x: Math.max(-(width - frameSize.width) / 2, Math.min((width - frameSize.width) / 2, nextOffset.x)),
      y: Math.max(-(height - frameSize.height) / 2, Math.min((height - frameSize.height) / 2, nextOffset.y)),
    };
  }

  function handleZoom(event) {
    const nextZoom = Number(event.target.value);
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current, nextZoom));
  }

  function handlePointerDown(event) {
    if (processing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(clampOffset({
      x: drag.offsetX + event.clientX - drag.clientX,
      y: drag.offsetY + event.clientY - drag.clientY,
    }));
  }

  function handlePointerEnd(event) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function applyCrop() {
    if (!image || !frameSize.width || !frameSize.height) {
      setError('Pratinjau foto belum siap. Coba lagi.');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const scale = baseScale * zoom;
      const sourceWidth = frameSize.width / scale;
      const sourceHeight = frameSize.height / scale;
      const imageLeft = (frameSize.width - image.naturalWidth * scale) / 2 + offset.x;
      const imageTop = (frameSize.height - image.naturalHeight * scale) / 2 + offset.y;
      const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceWidth, -imageLeft / scale));
      const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceHeight, -imageTop / scale));
      const canvas = document.createElement('canvas');
      const outputScale = Math.min(1, 2400 / Math.max(sourceWidth, sourceHeight));
      canvas.width = Math.max(1, Math.round(sourceWidth * outputScale));
      canvas.height = Math.max(1, Math.round(sourceHeight * outputScale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Browser tidak dapat memproses crop foto.');
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const outputType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
      const croppedBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Hasil crop foto gagal dibuat.'));
        }, outputType, 0.92);
      });
      const finalType = croppedBlob.type || outputType;
      const extension = finalType === 'image/jpeg' ? '.jpg' : finalType === 'image/png' ? '.png' : '.webp';
      const croppedFile = new File(
        [croppedBlob],
        `crop-${Date.now()}${extension}`,
        { type: finalType, lastModified: Date.now() }
      );
      if (croppedFile.size > 5 * 1024 * 1024) {
        throw new Error('Hasil crop masih lebih dari 5 MB. Atur zoom lebih dekat atau gunakan foto yang lebih kecil.');
      }
      onApply(croppedFile);
    } catch (cropError) {
      setError(cropError.message || 'Foto gagal dipotong.');
    } finally {
      setProcessing(false);
    }
  }

  const cropFrameStyle = {
    aspectRatio,
    width: `min(100%, 680px, ${aspectRatio * 62}vh)`,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="crop-title" className="font-semibold text-slate-900">Potong foto sebelum diunggah</h2>
            <p className="mt-1 text-xs text-slate-500">Area terang masuk ke website. Area gelap di luar bingkai akan dipotong. Seret foto untuk mengatur posisinya.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Batal
          </button>
        </div>

        <div className="relative isolate flex min-h-[280px] items-center justify-center overflow-hidden bg-slate-700 p-4 sm:min-h-[360px] sm:p-8">
          <div
            ref={frameRef}
            style={cropFrameStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="relative touch-none cursor-grab overflow-hidden bg-slate-800 shadow-[0_0_0_9999px_rgba(2,6,23,0.68)] outline outline-2 outline-white active:cursor-grabbing"
          >
            {sourceUrl && (
              <img
                src={sourceUrl}
                alt="Atur crop foto"
                draggable="false"
                onLoad={(event) => setImage(event.currentTarget)}
                style={{
                  width: displayedWidth,
                  height: displayedHeight,
                  maxWidth: 'none',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 border border-white/80" />
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="grid gap-2 text-sm text-slate-700">
            Zoom: {zoom.toFixed(1)}x
            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={handleZoom} className="w-full accent-emerald-700" />
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" className="px-4 py-2" onClick={onCancel}>Batal</Button>
            <Button type="button" disabled={!image || processing} className="px-4 py-2" onClick={applyCrop}>
              {processing && <Loader2 size={15} className="animate-spin" />}
              Gunakan foto ini
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function ItemEditor({ kind, record, fallbackImage, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState(record || {});
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(imageSrc(record?.image_url || fallbackImage));
  const [cropOpen, setCropOpen] = useState(false);
  const [cropConfirmed, setCropConfirmed] = useState(true);
  const [cropError, setCropError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initialForm = {
      image_zoom: 1,
      image_x: 50,
      image_y: 50,
      ...(record || {}),
    };
    if (Number(initialForm.image_y) === 50 && initialForm.image_position === 'top') initialForm.image_y = 0;
    if (Number(initialForm.image_y) === 50 && initialForm.image_position === 'bottom') initialForm.image_y = 100;
    setForm({
      ...initialForm,
    });
    setImageFile(null);
    setPreview(imageSrc(record?.image_url || fallbackImage));
    setCropOpen(false);
    setCropConfirmed(true);
    setCropError('');
  }, [record, fallbackImage]);

  useEffect(() => {
    if (!imageFile) return undefined;
    const objectUrl = URL.createObjectURL(imageFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const isSlide = kind === 'slide';
  const isNews = kind === 'news';
  const isBph = kind === 'bph';
  const isUnit = ['unit', 'bidang', 'bkm'].includes(kind);
  const isPerson = isUnit || isBph;
  const bphTitles = {
    ketua_kafilah: 'Ketua Kafilah',
    sekretaris_kafilah: 'Sekretaris Kafilah',
    bendahara_kafilah: 'Bendahara Kafilah',
  };
  const imagePositionClass = {
    center: 'object-center',
    top: 'object-top',
    bottom: 'object-bottom',
  }[form.image_position] || 'object-center';
  const cropAspectRatio = isPerson ? 10 / 9 : isNews ? 0.82 : isSlide ? 16 / 9 : 1.25;
  const cancelCrop = () => {
    setImageFile(null);
    setPreview(imageSrc(record?.image_url || fallbackImage));
    setCropConfirmed(true);
    setCropOpen(false);
  };

  async function openCropEditor() {
    setCropError('');
    if (imageFile) {
      setCropOpen(true);
      return;
    }
    if (!preview) {
      setCropError('Pilih foto terlebih dahulu.');
      return;
    }
    try {
      const response = await fetch(preview);
      if (!response.ok) throw new Error('Foto gagal dimuat untuk diedit.');
      const blob = await response.blob();
      const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const currentImage = new File([blob], `homepage-photo.${extension}`, { type: blob.type || 'image/jpeg' });
      setImageFile(currentImage);
      setCropConfirmed(false);
      setCropOpen(true);
    } catch (loadError) {
      setCropError(loadError.message || 'Foto gagal dimuat untuk diedit.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!cropConfirmed) {
      setCropOpen(true);
      return;
    }
    setSaving(true);
    const payload = new FormData(event.currentTarget);
    payload.set('aktif', form.aktif === false || Number(form.aktif) === 0 ? '0' : '1');
    payload.set('image_zoom', '1');
    payload.set('image_x', '50');
    payload.set('image_y', '50');
    if (imageFile) {
      payload.set('image_position', 'center');
      payload.set('image', imageFile);
    }
    try {
      await onSave(payload, record?.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
      <div className="relative bg-emerald-50" style={{ aspectRatio: cropAspectRatio }}>
        {preview ? (
          <img src={preview} alt="Preview konten" className={`h-full w-full object-cover ${imagePositionClass}`} />
        ) : (
          <div className="flex h-full items-center justify-center text-emerald-700">
            <FileImage size={30} />
          </div>
        )}
        {isPerson && !record?.image_url && !imageFile && (
          <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-600 shadow">
            Foto default beranda — unggah foto lalu simpan untuk menggantinya
          </span>
        )}
        <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-md">
          <FileImage size={15} />
          {preview ? 'Ganti foto' : 'Pilih foto'}
          <input
            className="sr-only"
            type="file"
            name="image"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            required={isNews && !record && !imageFile}
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] || null;
              event.target.value = '';
              setImageFile(selectedFile);
              if (selectedFile) {
                setCropConfirmed(false);
                setCropOpen(true);
              }
            }}
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={openCropEditor}
            className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-md"
          >
            Potong / ganti crop
          </button>
        )}
      </div>
      {cropError && <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{cropError}</p>}

      <div className="grid gap-3 p-4">
        {!cropConfirmed && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Foto belum dipotong. Sesuaikan area terang, lalu pilih “Gunakan foto ini” sebelum menyimpan.
          </p>
        )}
        {isBph && (
          <p className="text-sm font-semibold text-emerald-800">
            {bphTitles[record?.jabatan] || 'BPH'}
          </p>
        )}
        {(isSlide || isNews) && (
          <input
            name={isNews ? 'kategori' : 'label'}
            value={isNews ? (form.kategori || '') : (form.label || '')}
            onChange={(event) => update(isNews ? 'kategori' : 'label', event.target.value)}
            placeholder={isNews ? 'Kategori berita, contoh: PRESS RELEASE' : 'Label slide'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        )}
        {isPerson ? (
          <input
            name="nama"
            value={form.nama || ''}
            onChange={(event) => update('nama', event.target.value)}
            placeholder={isBph ? 'Nama pengurus' : 'Nama bidang/BKM'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        ) : (
          <input
            name="title"
            required
            value={form.title || ''}
            onChange={(event) => update('title', event.target.value)}
            placeholder={isSlide ? 'Judul slide' : isNews ? 'Judul berita' : 'Judul kegiatan'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        )}
        <textarea
          name={isPerson ? 'deskripsi' : isSlide ? 'description' : isNews ? 'ringkasan' : 'caption'}
          value={(isPerson ? form.deskripsi : isSlide ? form.description : isNews ? form.ringkasan : form.caption) || ''}
          onChange={(event) => update(isPerson ? 'deskripsi' : isSlide ? 'description' : isNews ? 'ringkasan' : 'caption', event.target.value)}
          placeholder={isPerson ? (isBph ? 'Deskripsi singkat (opsional)' : 'Deskripsi') : isSlide ? 'Deskripsi slide' : isNews ? 'Ringkasan berita' : 'Caption kegiatan'}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
        />
        {isNews && (
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            Isi berita
            <textarea
              name="isi"
              value={form.isi || ''}
              onChange={(event) => update('isi', event.target.value)}
              placeholder="Tulis isi berita lengkap"
              rows={6}
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal focus:border-emerald-600 focus:outline-none"
            />
          </label>
        )}
        {isSlide && (
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            Posisi Foto
            <select
              name="image_position"
              value={form.image_position || 'center'}
              onChange={(event) => {
                const positionY = event.target.value === 'top' ? 0 : event.target.value === 'bottom' ? 100 : 50;
                setForm((current) => ({ ...current, image_position: event.target.value, image_y: positionY }));
              }}
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
          {!isBph && <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            Urutan
            <input
              name="urutan"
              type="number"
              min="0"
              value={form.urutan ?? 0}
              onChange={(event) => update('urutan', event.target.value)}
              className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          {record && !isBph && (
            <Button type="button" variant="danger" className="px-3 py-2" onClick={() => onDelete(record)}>
              <Trash2 size={15} /> Hapus
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="secondary" className="px-3 py-2" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button type="submit" disabled={saving || !cropConfirmed} className="px-3 py-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {!cropConfirmed ? 'Terapkan crop dulu' : record ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </div>
      {cropOpen && imageFile && (
        <ImageCropEditor
          key={imageFile.name + imageFile.lastModified}
          file={imageFile}
          aspectRatio={cropAspectRatio}
          onCancel={cancelCrop}
          onApply={(croppedFile) => {
            setImageFile(croppedFile);
            setForm((current) => ({ ...current, image_zoom: 1, image_x: 50, image_y: 50, image_position: 'center' }));
            setCropConfirmed(true);
            setCropOpen(false);
          }}
        />
      )}
    </form>
  );
}

export default function HomepageManager() {
  const [activeTab, setActiveTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [about, setAbout] = useState(aboutFallback);
  const [bidang, setBidang] = useState([]);
  const [bkm, setBkm] = useState([]);
  const [bph, setBph] = useState([]);
  const [kegiatan, setKegiatan] = useState([]);
  const [berita, setBerita] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAbout, setSavingAbout] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadContent() {
    setLoading(true);
    setError('');
    try {
      const [publicData, slideData, bidangData, bkmData, bphData, kegiatanData, beritaData] = await Promise.all([
        api.get('/public/homepage'),
        api.get('/admin/homepage/slides'),
        api.get('/admin/homepage/bidang'),
        api.get('/admin/homepage/bkm'),
        api.get('/admin/homepage/bph'),
        api.get('/admin/homepage/kegiatan'),
        api.get('/admin/homepage/berita'),
      ]);
      setSlides(slideData.data);
      setAbout(publicData.data.about || aboutFallback);
      setBidang(bidangData.data);
      setBkm(bkmData.data);
      setBph(bphData.data);
      setKegiatan(kegiatanData.data);
      setBerita(beritaData.data);
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
    if (kind === 'bph') return 'bph';
    if (kind === 'news') return 'berita';
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

  function editor(kind, record, isNew = false, fallbackImage = '') {
    const actualKind = kind === 'unit' && isNew ? creating : kind;
    return (
      <ItemEditor
        key={`${actualKind}-${record?.id || 'new'}`}
        kind={actualKind}
        record={record}
        fallbackImage={fallbackImage}
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
        {!creating && activeTab === 'news' && (
          <Button onClick={() => setCreating(true)}><Plus size={16} /> Tambah berita</Button>
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
          {creating && activeTab !== 'units' && <div className="mb-5 max-w-3xl">{editor(activeTab === 'slides' ? 'slide' : activeTab === 'news' ? 'news' : 'activity', null, true)}</div>}
          {creating && activeTab === 'units' && <div className="mb-5 max-w-3xl">{editor('unit', null, true)}</div>}
          {activeTab === 'slides' && (
            <div className="grid gap-5 xl:grid-cols-2">{slides.map((slide) => editor('slide', slide))}</div>
          )}
          {activeTab === 'units' && (
            <>
              <h3 className="mb-3 font-semibold text-emerald-900">BPH (Badan Pengurus Harian)</h3>
                  <p className="mb-3 text-sm text-slate-600">Ketua Kafilah, Sekretaris Kafilah, dan Bendahara Kafilah.</p>
                  <div className="mb-8 grid gap-5 xl:grid-cols-3">{bph.map((item) => editor('bph', item, false, 'BPH 2025-2026.jpeg'))}</div>
                  <h3 className="mb-3 font-semibold text-emerald-900">Bidang dan Bina Karya Mandiri (BKM)</h3>
                  <div className="grid gap-5 xl:grid-cols-2">
                    {[...bidang, ...bkm]
                      .sort((first, second) => Number(first.urutan) - Number(second.urutan))
                      .map((item) => editor(item.jenis === 'bkm' ? 'bkm' : 'unit', item, false, fallbackUnitImage(item.nama, item.jenis)))}
                  </div>
            </>
          )}
          {activeTab === 'activities' && (
            <div className="grid gap-5 xl:grid-cols-2">{kegiatan.map((item) => editor('activity', item))}</div>
          )}
          {activeTab === 'news' && (
            <div className="grid gap-5 xl:grid-cols-2">{berita.map((item) => editor('news', item))}</div>
          )}
          {activeTab === 'slides' && !slides.length && !creating && <p className="text-sm text-slate-500">Belum ada slide. Halaman publik tetap memakai konten fallback.</p>}
          {activeTab === 'activities' && !kegiatan.length && !creating && <p className="text-sm text-slate-500">Belum ada kegiatan.</p>}
          {activeTab === 'news' && !berita.length && !creating && <p className="text-sm text-slate-500">Belum ada berita. Tambahkan berita agar tampil di beranda publik.</p>}
        </>
      )}
    </DashboardLayout>
  );
}
