import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Camera, CheckCircle2, Clock3, RefreshCw, SwitchCamera } from 'lucide-react';
import api from '../api/axios';

const monthName = (value) =>
  new Date(2000, Number(value) - 1, 1).toLocaleDateString('id-ID', { month: 'long' });

const formatScheduleDate = (value) => {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const weekOfMonth = (value) => Math.ceil(Number(String(value).slice(8, 10)) / 7);

export default function PiketQRForm() {
  const cameraInputRef = useRef(null);
  const photoUrlRef = useRef('');
  const [formData, setFormData] = useState(null);
  const [nama, setNama] = useState('');
  const [jadwalId, setJadwalId] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadForm = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/public/piket');
      setFormData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Form piket belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);

  const openPhoneCamera = () => {
    setError('');
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = '';
    setPhoto(null);
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Foto tidak dapat diproses di perangkat ini.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => result
            ? resolve(result)
            : reject(new Error('Foto tidak dapat dikompres. Silakan ambil ulang.')),
          'image/jpeg',
          0.5
        );
      });
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = URL.createObjectURL(blob);
      setPhoto(new File([blob], 'foto-piket.jpg', { type: 'image/jpeg' }));
    } catch (err) {
      setError(err.message || 'Foto tidak dapat dibuka. Coba ambil ulang dengan kamera.');
    }
  };

  const openScheduleForm = async (schedule) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/public/piket');
      const refreshedSchedule = data.jadwal.find(
        (item) => String(item.jadwal_id) === String(schedule.jadwal_id)
      );
      if (!refreshedSchedule || !Number(refreshedSchedule.aktif_hari_ini)) {
        setFormData(data);
        setError('Jadwal ini belum aktif atau sudah selesai. Pilih jadwal yang sedang berjalan.');
        return;
      }
      setFormData(data);
      setJadwalId(String(refreshedSchedule.jadwal_id));
      setSelectedSchedule(refreshedSchedule);
    } catch (err) {
      setError(err.response?.data?.message || 'Form piket belum dapat dimuat.');
    } finally {
      setLoading(false);
    }
  };

  const returnToSchedule = () => {
    setSelectedSchedule(null);
    setPhoto(null);
    setNama('');
    setCatatan('');
    setError('');
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!photo) {
      setError('Ambil foto kegiatan menggunakan kamera sebelum mengirim.');
      return;
    }
    const payload = new FormData();
    payload.set('nama_pengisi', nama);
    payload.set('jadwal_id', jadwalId);
    payload.set('catatan', catatan);
    payload.set('challenge', formData.challenge);
    payload.set('foto', photo);

    setSaving(true);
    try {
      const { data } = await api.post('/public/piket', payload);
      setSuccess(data.message);
      setSelectedSchedule(null);
      setNama('');
      setCatatan('');
      setPhoto(null);
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = '';
      await loadForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Pengiriman gagal. Silakan coba kembali.');
      if ([400, 409, 410].includes(err.response?.status)) await loadForm();
    } finally {
      setSaving(false);
    }
  };

  const validSchedules = (formData?.jadwal || []).filter(
    (schedule) => Number(schedule.periode_valid) === 1
  );
  const groupedSchedules = validSchedules.reduce((groups, schedule) => {
    const monthKey = String(schedule.minggu_mulai).slice(0, 7);
    if (!groups.has(monthKey)) groups.set(monthKey, []);
    groups.get(monthKey).push(schedule);
    return groups;
  }, new Map());

  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(6,78,59,0.12)]">
        <header className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
          <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              {selectedSchedule ? <Camera size={23} /> : <CalendarDays size={23} />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">HW UNIMUS · MAKO</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {selectedSchedule ? 'Dokumentasi Piket' : 'Jadwal Piket'}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-emerald-50/90">
                {selectedSchedule
                  ? 'Lengkapi laporan untuk giliran bidang yang sudah dipilih.'
                  : 'Pilih bidang yang sedang mendapat giliran untuk mengisi laporan kegiatan.'}
              </p>
            </div>
          </div>
          <div className="relative mt-6 flex items-center gap-2 text-xs font-medium text-emerald-50/80">
            <span className={`rounded-full px-3 py-1 ${selectedSchedule ? 'bg-white/10' : 'bg-white/20 text-white'}`}>1. Pilih bidang</span>
            <span className="h-px w-6 bg-white/30" />
            <span className={`rounded-full px-3 py-1 ${selectedSchedule ? 'bg-white/20 text-white' : 'bg-white/10'}`}>2. Isi laporan</span>
          </div>
        </header>
        <div className="px-5 py-6 sm:px-9 sm:py-8">

        {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-700"><span className="font-bold">!</span><span>{error}</span></div>}
        {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} />{success}</div>}

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
            Memuat data jadwal...
          </div>
        ) : selectedSchedule ? (
          <>
              <button type="button" onClick={returnToSchedule} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-600">
                <ArrowLeft size={16} /> Kembali ke jadwal
            </button>
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white"><CalendarDays size={19} /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Jadwal terpilih</p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-950">Saya piket dari {selectedSchedule.nama_bidang}</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Minggu ke-{weekOfMonth(selectedSchedule.minggu_mulai)} bulan {monthName(selectedSchedule.minggu_mulai.slice(5, 7))} · {formatScheduleDate(selectedSchedule.minggu_mulai)} – {formatScheduleDate(selectedSchedule.minggu_selesai)}
                  </p>
                </div>
              </div>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="nama-piket" className="mb-2 block text-sm font-bold text-slate-800">Nama lengkap</label>
                <input id="nama-piket" value={nama} onChange={(e) => setNama(e.target.value)} minLength={3} maxLength={100} required autoComplete="name" placeholder="Masukkan nama lengkap" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">Foto kegiatan</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">WAJIB · KAMERA</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                  {photo ? (
                    <img src={photoUrlRef.current} alt="Foto piket yang diambil" className="aspect-video w-full object-contain" />
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-2 text-sm text-slate-300">
                      <Camera size={28} className="text-slate-500" />
                      Kamera perangkat akan terbuka saat tombol ditekan
                    </div>
                  )}
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  capture={cameraFacing}
                  onChange={handleCameraCapture}
                  className="hidden"
                  aria-label="Ambil foto kegiatan"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraFacing((facing) => facing === 'environment' ? 'user' : 'environment')}
                    aria-label={`Ganti ke kamera ${cameraFacing === 'environment' ? 'depan' : 'belakang'}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <SwitchCamera size={17} />
                    Ganti ke kamera {cameraFacing === 'environment' ? 'depan' : 'belakang'}
                  </button>
                  <button type="button" onClick={openPhoneCamera} className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">
                    <Camera size={16} />{photo ? 'Ambil ulang foto' : 'Buka kamera'}
                  </button>
                  {photo && <button type="button" onClick={() => { if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current); photoUrlRef.current = ''; setPhoto(null); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"><RefreshCw size={15} />Hapus foto</button>}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">Pilih kamera depan atau belakang sebelum membuka kamera perangkat. Foto dikompres maksimal 800 px dan kualitas 50% sebelum dikirim.</p>
              </div>
              <div>
                <label htmlFor="catatan-piket" className="mb-2 block text-sm font-bold text-slate-800">Catatan <span className="font-normal text-slate-400">(opsional)</span></label>
                <textarea id="catatan-piket" value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={2000} rows={3} placeholder="Tambahkan keterangan kegiatan piket..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
              </div>
              <button type="submit" disabled={saving || !photo} className="w-full rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 px-4 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:from-emerald-900 hover:to-teal-800 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none">
                {saving ? 'Mengirim laporan...' : 'Kirim dokumentasi piket'}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500"><Clock3 size={13} />Waktu laporan dicatat otomatis oleh server.</p>
            </form>
          </>
        ) : !validSchedules.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <p className="font-bold">Jadwal piket belum tersedia.</p>
            <p className="mt-1">Admin perlu menambahkan jadwal atau memperbaiki jadwal yang tanggalnya bertabrakan.</p>
          </div>
        ) : (
          <section>
            <h2 className="text-lg font-extrabold text-emerald-950">Jadwal Piket per Bidang</h2>
            <p className="mb-5 mt-1 text-sm text-slate-600">Pilih bidang yang sedang bertugas untuk membuka formulir.</p>
            <div className="space-y-6">
              {Array.from(groupedSchedules.entries()).map(([monthKey, schedules]) => (
                <div key={monthKey}>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <CalendarDays size={15} />
                    {monthName(monthKey.slice(5, 7))} {monthKey.slice(0, 4)}
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="space-y-3">
                    {schedules.map((item) => {
                      const isActive = Number(item.aktif_hari_ini) === 1;
                      return (
                        <article key={item.jadwal_id} className={`rounded-2xl border p-4 transition sm:p-5 ${isActive ? 'border-emerald-300 bg-emerald-50/70 shadow-sm shadow-emerald-900/5' : 'border-slate-200 bg-white'}`}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {weekOfMonth(item.minggu_mulai)}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-extrabold text-slate-900">{item.nama_bidang}</p>
                                  {isActive && <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Sedang bertugas</span>}
                                </div>
                                <p className="mt-1 text-sm font-medium text-slate-600">
                                  Minggu ke-{weekOfMonth(item.minggu_mulai)} · {formatScheduleDate(item.minggu_mulai)} – {formatScheduleDate(item.minggu_selesai)}
                                </p>
                              </div>
                            </div>
                            {isActive ? (
                              <button type="button" onClick={() => openScheduleForm(item)} className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 sm:w-auto">
                                Isi laporan bidang ini
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Clock3 size={14} />Belum waktunya</span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      </div>
    </main>
  );
}
