import React, { useEffect, useState, useCallback } from 'react';
import { exportToExcel } from '../../utils/exportToExcel';
import { Plus, Search, Pencil, Trash2, Eye, Package, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import KondisiBadge from '../../components/UI/KondisiBadge';
import InventarisFormModal from './InventarisFormModal';
import InventarisDetailModal from './InventarisDetailModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function InventarisList() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [kategoriList, setKategoriList] = useState([]);
  const [ruanganList, setRuanganList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [kategoriId, setKategoriId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/inventaris', {
        params: { search: search || undefined, kondisi: kondisi || undefined, kategori_id: kategoriId || undefined, page },
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setData([]);
      setError(err.response?.data?.message || 'Data inventaris belum dapat dimuat. Coba muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, [search, kondisi, kategoriId]);

  useEffect(() => {
    Promise.all([api.get('/master/kategori'), api.get('/master/ruangan')])
      .then(([kategori, ruangan]) => {
        setKategoriList(kategori.data);
        setRuanganList(ruangan.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Data kategori atau ruangan belum dapat dimuat.'));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadData(1), 300);
    return () => clearTimeout(t);
  }, [loadData]);

  async function handleDelete(item) {
    if (!confirm(`Hapus "${item.nama_barang}" dari inventaris?`)) return;
    try {
      await api.delete(`/inventaris/${item.id}`);
      loadData(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus barang.');
    }
  }

  const handleExport = () => {
    const formattedData = data.map((item) => ({
      'Nama Barang': item.nama_barang,
      'Kategori': item.nama_kategori || '—',
      'Jumlah': item.jumlah,
      'Kondisi': item.kondisi,
      'Ruangan': item.nama_ruangan || '—',
      'Catatan': item.catatan || '—',
      'Tanggal Pendataan': item.tanggal_pendataan
    }));
    exportToExcel(formattedData, 'Laporan_Inventaris_HW_UNIMUS');
  };

  return (
    <DashboardLayout title="Inventaris" subtitle="Kelola seluruh barang logistik Mako beserta riwayat perubahannya">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama barang…"
            className="w-full rounded-xl border border-slate-300 bg-white/90 py-2.5 pl-10 pr-3.5 text-sm text-slate-800 shadow-sm transition focus:border-brand focus:outline-none"
          />
        </div>
        <select
          value={kondisi}
          onChange={(e) => setKondisi(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white/90 px-3.5 py-2.5 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none"
        >
          <option value="">Semua Kondisi</option>
          <option value="Baik">Baik</option>
          <option value="Rusak">Rusak</option>
          <option value="Hilang">Hilang</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <select
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white/90 px-3.5 py-2.5 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
        </select>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none"
        >
          <FileSpreadsheet size={16} /> Ekspor Excel
        </button>

        {isAdmin && (
          <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
            <Plus size={16} /> Tambah Barang
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="px-5 py-3">Barang</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Jumlah</th>
              <th className="px-5 py-3">Kondisi</th>
              <th className="px-5 py-3">Lokasi</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Memuat data…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  <Package size={28} className="mx-auto mb-2 text-slate-300" />
                  Belum ada barang yang cocok dengan filter ini.
                </td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="flex items-center gap-3 px-5 py-3">
                  {item.foto_url ? (
                    <img src={item.foto_url} className="h-9 w-9 rounded-lg border border-slate-200 object-cover" alt="" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-slate-100" />
                  )}
                  <span className="font-medium text-slate-800">{item.nama_barang}</span>
                </td>
                <td className="px-5 py-3 text-slate-500">{item.nama_kategori || '—'}</td>
                <td className="px-5 py-3 font-medium text-slate-700">{item.jumlah}</td>
                <td className="px-5 py-3"><KondisiBadge kondisi={item.kondisi} /></td>
                <td className="px-5 py-3 text-slate-500">{item.nama_ruangan || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => setDetailItem(item)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-ring" title="Lihat detail & riwayat">
                      <Eye size={16} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditingItem(item); setFormOpen(true); }} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand focus-ring" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-ring" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <InventarisFormModal
          item={editingItem}
          onClose={() => setFormOpen(false)}
          onSuccess={() => { setFormOpen(false); loadData(pagination.page); }}
          kategoriList={kategoriList}
          ruanganList={ruanganList}
        />
      )}

      {detailItem && (
        <InventarisDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </DashboardLayout>
  );
}
