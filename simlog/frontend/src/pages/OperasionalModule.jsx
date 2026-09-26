import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const today = () => new Date().toISOString().slice(0, 10);
const configs = {
  unboxing: {
    title: 'Unboxing Mako', subtitle: 'Pendataan kondisi ruang dan checklist Mako.',
    sections: [{ key: 'data', title: 'Riwayat Pendataan Barang', columns: ['tanggal', 'nama_barang', 'kondisi_umum', 'catatan'] }],
    forms: [{ title: 'Catat Pemeriksaan Barang', path: '/operasional/unboxing', fields: [['inventaris_id', 'Barang Inventaris', 'select', 'inventaris'], ['tanggal', 'Tanggal', 'date'], ['kondisi_umum', 'Kondisi', 'select', 'kondisiRuang'], ['catatan', 'Catatan Pemeriksaan', 'textarea']] }],
  },
  piket: {
    title: 'Piket Harian', subtitle: 'Jadwal dan pelaksanaan piket Mako.',
    sections: [{ key: 'jadwal', title: 'Jadwal Piket', columns: ['minggu_mulai', 'minggu_selesai', 'nama_bidang'] }, { key: 'pelaksanaan', title: 'Pelaksanaan Terbaru', columns: ['tanggal', 'nama_bidang', 'status', 'nama_pengisi', 'catatan'] }],
    forms: [{ title: 'Buat Jadwal', path: '/operasional/piket/jadwal', fields: [['bidang_id', 'Bidang', 'select', 'bidang'], ['minggu_mulai', 'Mulai', 'date'], ['minggu_selesai', 'Selesai', 'date']] }, { title: 'Catat Pelaksanaan', path: '/operasional/piket/pelaksanaan', fields: [['jadwal_id', 'Jadwal', 'select', 'jadwal'], ['tanggal', 'Tanggal', 'date'], ['status', 'Status', 'select', 'statusPiket'], ['nama_pengisi', 'Petugas', 'text'], ['catatan', 'Catatan', 'textarea']] }],
  },
  sewa: {
    title: 'Ruang / Barang Sewa', subtitle: 'Pantau ketersediaan dan peminjaman.',
    sections: [{ key: 'barang', title: 'Barang Sewa', columns: ['nama_barang', 'jumlah_total', 'jumlah_tersedia', 'jumlah_disewa', 'status'] }, { key: 'peminjaman', title: 'Peminjaman', columns: ['nama_barang', 'nama_penyewa', 'jumlah_dipinjam', 'tanggal_mulai', 'tanggal_kembali_rencana', 'status'] }],
    forms: [{ title: 'Tambah Barang Sewa', path: '/operasional/sewa/barang', fields: [['nama_barang', 'Nama barang', 'text'], ['kategori_id', 'Kategori', 'select', 'kategori'], ['jumlah_total', 'Jumlah', 'number']] }, { title: 'Catat Peminjaman', path: '/operasional/sewa/peminjaman', fields: [['barang_sewa_id', 'Barang', 'select', 'barang'], ['nama_penyewa', 'Penyewa', 'text'], ['kontak_penyewa', 'Kontak', 'text'], ['jumlah_dipinjam', 'Jumlah', 'number'], ['tanggal_mulai', 'Mulai', 'date'], ['tanggal_kembali_rencana', 'Kembali', 'date'], ['catatan', 'Catatan', 'textarea']] }],
  },
  pengadaan: {
    title: 'Pengadaan Inventaris', subtitle: 'Catat pengadaan dan asal dana sebelum barang masuk inventaris.',
    sections: [{ key: 'data', title: 'Riwayat Pengadaan', columns: ['tanggal', 'nama_barang', 'jumlah', 'harga', 'sumber_dana', 'nama_ruangan'] }],
    forms: [{ title: 'Catat Pengadaan', path: '/operasional/pengadaan', fields: [['nama_barang', 'Nama barang', 'text'], ['jumlah', 'Jumlah', 'number'], ['tanggal', 'Tanggal', 'date'], ['harga', 'Harga', 'number'], ['sumber_dana', 'Sumber dana', 'text'], ['lokasi_id', 'Ruangan', 'select', 'ruangan'], ['catatan', 'Catatan', 'textarea']] }],
  },
  revitalisasi: {
    title: 'Revitalisasi Inventaris', subtitle: 'Laporkan kerusakan dan dokumentasikan tindak lanjut perbaikan.',
    sections: [{ key: 'laporan', title: 'Laporan Kerusakan', columns: ['tanggal_lapor', 'nama_barang', 'deskripsi', 'status'] }, { key: 'revitalisasi', title: 'Tindakan Revitalisasi', columns: ['tanggal_perbaikan', 'nama_barang', 'tindakan', 'biaya', 'status'] }],
    forms: [{ title: 'Laporkan Kerusakan', path: '/operasional/revitalisasi/laporan', fields: [['inventaris_id', 'Inventaris', 'select', 'inventaris'], ['tanggal_lapor', 'Tanggal', 'date'], ['deskripsi', 'Deskripsi', 'textarea']] }, { title: 'Tambah Tindakan', path: '/operasional/revitalisasi', fields: [['inventaris_id', 'Inventaris', 'select', 'inventaris'], ['tanggal_perbaikan', 'Tanggal', 'date'], ['tindakan', 'Tindakan', 'text'], ['biaya', 'Biaya', 'number'], ['status', 'Status', 'select', 'statusRevitalisasi'], ['catatan', 'Catatan', 'textarea']] }],
  },
};
const selectStatic = { kondisiRuang: ['Baik', 'Perlu Perhatian', 'Rusak'], statusPiket: ['Selesai', 'Tidak Terlaksana'], statusRevitalisasi: ['Diajukan', 'Proses', 'Selesai', 'Dibatalkan'] };
const label = (key) => key.replaceAll('_', ' ').replace(/\b\w/g, (x) => x.toUpperCase());

export default function OperasionalModule({ type }) {
  const config = configs[type]; const { isAdmin } = useAuth();
  const [data, setData] = useState({}); const [master, setMaster] = useState({}); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [open, setOpen] = useState(null);
  const load = async () => { try { const [module, kategori, ruangan, bidang, inventaris] = await Promise.all([api.get(`/operasional/${type}`), api.get('/master/kategori'), api.get('/master/ruangan'), api.get('/master/bidang'), api.get('/inventaris', { params: { limit: 100 } })]); setData(module.data); setMaster({ kategori: kategori.data, ruangan: ruangan.data, bidang: bidang.data, inventaris: inventaris.data.data }); } catch (err) { setError(err.response?.data?.message || 'Data belum dapat dimuat.'); } };
  useEffect(() => { load(); }, [type]);
  const options = (source) => {
    if (selectStatic[source]) return selectStatic[source].map((v) => [v, v]);
    if (source === 'jadwal') return (data.jadwal || []).map((v) => [v.id, `${v.nama_bidang} (${v.minggu_mulai})`]);
    if (source === 'barang') return (data.barang || []).map((v) => [v.id, `${v.nama_barang} — tersedia ${v.jumlah_tersedia}`]);
    const names = { kategori: 'nama_kategori', ruangan: 'nama_ruangan', bidang: 'nama_bidang', inventaris: 'nama_barang' }; return (master[source] || []).map((v) => [v.id, v[names[source]]]);
  };
  return <DashboardLayout title={config.title} subtitle={config.subtitle}>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
    {isAdmin && <div className="mb-5 flex flex-wrap gap-2">{config.forms.map((form, i) => <Button key={form.title} onClick={() => setOpen(open === i ? null : i)}>{form.title}</Button>)}</div>}
    {isAdmin && open !== null && <ModuleForm form={config.forms[open]} options={options} onDone={() => { setOpen(null); setNotice('Data berhasil disimpan.'); load(); }} onError={setError} />}
    <div className="space-y-5">{config.sections.map((section) => <Section key={section.key} title={section.title} rows={data[section.key] || []} columns={section.columns} />)}</div>
  </DashboardLayout>;
}

function ModuleForm({ form, options, onDone, onError }) {
  const initial = useMemo(() => Object.fromEntries(form.fields.map(([key, , input]) => [key, input === 'date' ? today() : input === 'number' ? 1 : ''])), [form]);
  const [values, setValues] = useState(initial); const [saving, setSaving] = useState(false);
  const submit = async (e) => { e.preventDefault(); setSaving(true); onError(''); try { await api.post(form.path, values); onDone(); } catch (err) { onError(err.response?.data?.message || 'Gagal menyimpan data.'); } finally { setSaving(false); } };
  return <form onSubmit={submit} className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card md:grid-cols-2">{form.fields.map(([key, title, input, source]) => <label key={key} className={input === 'textarea' ? 'md:col-span-2' : ''}><span className="mb-1 block text-sm font-medium text-slate-700">{title}</span>{input === 'select' ? <select required value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Pilih {title}</option>{options(source).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : input === 'textarea' ? <textarea required={key === 'deskripsi'} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows="2" /> : <input required={!['harga', 'biaya', 'sumber_dana', 'kontak_penyewa'].includes(key)} type={input} min={input === 'number' ? 1 : undefined} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />}</label>)}<div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button></div></form>;
}
function Section({ title, rows, columns }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><h2 className="border-b border-slate-100 px-5 py-4 font-bold text-slate-900">{title}</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map((column) => <th key={column} className="px-5 py-3">{label(column)}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-8 text-center text-slate-400">Belum ada data.</td></tr> : rows.map((row) => <tr key={row.id} className="border-t border-slate-100">{columns.map((column) => <td key={column} className="px-5 py-3 text-slate-700">{row[column] ?? '—'}</td>)}</tr>)}</tbody></table></div></section>; }
