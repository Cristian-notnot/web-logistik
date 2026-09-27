import React, { useEffect, useState, useCallback } from 'react';
import { exportToExcel } from '../../utils/exportToExcel';
import { Plus, Search, Pencil, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
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
        params: {
          search: search || undefined,
          kondisi: kondisi || undefined,
          kategori_id: kategoriId || undefined,
          page
        }
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setData([]);
      setError(err.response?.data?.message || 'Data inventaris gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, [search, kondisi, kategoriId]);

  useEffect(() => {
    Promise.all([
      api.get('/master/kategori'),
      api.get('/master/ruangan')
    ])
    .then(([kategori, ruangan]) => {
      setKategoriList(kategori.data);
      setRuanganList(ruangan.data);
    })
    .catch(err => {
      setError(err.response?.data?.message || 'Data master gagal dimuat.');
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1);
    }, 300);
    return () => clearTimeout(timer);
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
    const formatted = data.map(item => ({
      'Nama Barang': item.nama_barang,
      'Kategori': item.nama_kategori || '—',
      'Jumlah': item.jumlah,
      'Kondisi': item.kondisi,
      'Ruangan': item.nama_ruangan || '—',
      'Catatan': item.catatan || '—',
      'Tanggal Pendataan': item.tanggal_pendataan
    }));
    exportToExcel(formatted, 'Laporan_Inventaris_HW_UNIMUS');
  };

  const renderFoto = (item) => {
    const namaFoto = item.foto || item.foto_url;
    if (!namaFoto) return <span className="text-xs text-slate-400 italic">Tanpa foto</span>;

    const srcUrl = namaFoto.startsWith('http') 
      ? namaFoto 
      : `http://localhost:5000/uploads/${namaFoto}`;

    return (
      <img
        src={srcUrl}
        className="h-9 w-9 rounded-lg object-cover"
        alt={item.nama_barang}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `http://localhost:5000${namaFoto.startsWith('/') ? '' : '/'}${namaFoto}`;
        }}
      />
    );
  };

  return (
    <DashboardLayout
      title="Inventaris"
      subtitle="Kelola seluruh barang logistik Mako beserta riwayat perubahannya"
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama barang..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10"
          />
        </div>

        <select
          value={kondisi}
          onChange={(e) => setKondisi(e.target.value)}
          className="rounded-xl border px-3 py-2"
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
          className="rounded-xl border px-3 py-2"
        >
          <option value="">Semua Kategori</option>
          {kategoriList.map(k => (
            <option key={k.id} value={k.id}>{k.nama_kategori}</option>
          ))}
        </select>

        <button onClick={handleExport} className="rounded-xl bg-emerald-600 px-4 py-2 text-white flex items-center gap-2">
          <FileSpreadsheet size={16} />
          Ekspor Excel
        </button>

        {isAdmin && (
          <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
            <Plus size={16} />
            Tambah Barang
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-5 py-3">Barang</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Jumlah</th>
              <th className="px-5 py-3">Kondisi</th>
              <th className="px-5 py-3">Lokasi</th>
              <th className="px-5 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-400">Memuat data...</td>
              </tr>
            )}

            {!loading && data.map(item => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="flex items-center gap-3 px-5 py-3">
                  {renderFoto(item)}
                  {item.nama_barang}
                </td>
                <td className="px-5">{item.nama_kategori || '—'}</td>
                <td className="px-5">{item.jumlah}</td>
                <td className="px-5">
                  <KondisiBadge kondisi={item.kondisi} />
                </td>
                <td className="px-5 py-3 text-slate-500">
  <div>
    <div>{item.nama_ruangan || '—'}</div>
    {item.lokasi_detail && (
      <div className="text-xs text-slate-400">
        {item.lokasi_detail}
      </div>
    )}
  </div>
</td>
                <td className="px-5">
                  <div className="flex gap-2">
                    <button onClick={() => setDetailItem(item)} className="text-slate-500 hover:text-slate-700">
                      <Eye size={16} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditingItem(item); setFormOpen(true); }} className="text-slate-500 hover:text-slate-700">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700">
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
          onSuccess={() => {
            setFormOpen(false);
            loadData(pagination.page);
          }}
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
