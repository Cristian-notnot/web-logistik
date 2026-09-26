import React, { useEffect, useState } from 'react';
import { FileBarChart2, PackageSearch, CalendarClock, HandCoins, Wrench } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../api/axios';

const format = (number) => new Intl.NumberFormat('id-ID').format(Number(number || 0));
export default function Reports() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/operasional/laporan').then((res) => setData(res.data)).catch((err) => setError(err.response?.data?.message || 'Laporan belum dapat dimuat.')); }, []);
  const cards = data ? [
    ['Inventaris', `${format(data.inventaris.unit)} unit`, `${format(data.inventaris.bermasalah)} barang bermasalah`, PackageSearch],
    ['Piket', `${format(data.piket.selesai)} selesai`, `${format(data.piket.total)} pelaksanaan tercatat`, CalendarClock],
    ['Peminjaman Aktif', `${format(data.sewa.unit)} unit`, `${format(data.sewa.aktif)} transaksi berjalan`, HandCoins],
    ['Pengadaan', `${format(data.pengadaan.total)} catatan`, `Nilai Rp${format(data.pengadaan.nilai)}`, FileBarChart2],
    ['Kerusakan', `${format(data.revitalisasi.terbuka)} terbuka`, `${format(data.revitalisasi.total)} laporan tercatat`, Wrench],
  ] : [];
  return <DashboardLayout title="Laporan Operasional" subtitle="Ringkasan data logistik untuk pemantauan dan evaluasi.">{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>} {!data && !error && <p className="text-sm text-slate-400">Memuat laporan…</p>}<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([title, value, detail, Icon]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">{title}</p><Icon size={18} className="text-brand" /></div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></div>)}</div></DashboardLayout>;
}
