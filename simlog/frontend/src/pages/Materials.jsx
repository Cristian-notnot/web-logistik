import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/public/materi')
      .then(({ data }) => {
        if (!cancelled) setMaterials(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.response?.data?.message || 'Materi belum dapat dimuat. Silakan coba lagi nanti.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f8f5] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link to="/login" className="flex items-center gap-3" aria-label="Kembali ke beranda HW UNIMUS">
            <img src="/logo-hw-unimus.png" alt="Logo HW UNIMUS" className="h-10 w-10 object-contain" />
            <span className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">HW UNIMUS</span>
              <span className="mt-1 block text-[13px] font-semibold text-slate-900">Kafilah Jenderal Soedirman</span>
            </span>
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800">
            <ArrowLeft size={16} /> Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-190px)] max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#082f29] via-[#0d5145] to-[#08785d] px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Perpustakaan digital</p>
          <h1 className="relative mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">Materi HW UNIMUS</h1>
          <p className="relative mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
            Temukan dan unduh materi pembelajaran serta panduan yang dibagikan oleh Kafilah Jenderal Soedirman.
          </p>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Koleksi</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Daftar materi</h2>
            </div>
            {!loading && !error && <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900">{materials.length} materi</span>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white py-16 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" /> Memuat daftar materi...
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
          ) : materials.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {materials.map((material) => (
                <article key={material.id} className="group flex flex-col justify-between gap-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-100">
                      <FileText size={23} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">{material.judul}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{material.deskripsi}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="max-w-full truncate text-xs text-slate-500">{material.nama_file} · {formatBytes(material.ukuran_file)}</span>
                    <a
                      href={material.download_url}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#08785d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#06644e]"
                    >
                      <Download size={16} /> Unduh
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
              <FileText size={34} className="mx-auto text-emerald-700" />
              <h3 className="mt-4 font-semibold text-slate-800">Belum ada materi untuk ditampilkan</h3>
              <p className="mt-1 text-sm text-slate-500">Silakan kunjungi kembali nanti untuk melihat materi terbaru.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>HW UNIMUS · Kafilah Jenderal Soedirman</span>
          <span>© {new Date().getFullYear()} Rakanda Charly Agusta Cristiano</span>
        </div>
      </footer>
    </div>
  );
}
