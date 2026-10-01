import React, { useEffect, useState, useCallback } from 'react';
import { exportToExcel } from '../../utils/exportToExcel';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
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
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1
  });

  const [kategoriList, setKategoriList] = useState([]);
  const [ruanganList, setRuanganList] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [ruanganError, setRuanganError] = useState('');
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
      setError(
        err.response?.data?.message ||
        'Data inventaris gagal dimuat.'
      );
    } finally {

      setLoading(false);

    }
  }, [search, kondisi, kategoriId]);

  const loadMasterData = useCallback(async () => {
    setLoadingRooms(true);
    setRuanganError('');
    const [kategoriResult, ruanganResult] = await Promise.allSettled([
      api.get('/master/kategori'),
      api.get('/master/ruangan')
    ]);

    if (kategoriResult.status === 'fulfilled') {
      setKategoriList(Array.isArray(kategoriResult.value.data) ? kategoriResult.value.data : []);
    } else {
      setError(kategoriResult.reason.response?.data?.message || 'Data kategori gagal dimuat.');
    }

    if (ruanganResult.status === 'fulfilled') {
      const ruanganData = Array.isArray(ruanganResult.value.data) ? ruanganResult.value.data : [];
      setRuanganList(ruanganData);
      setRuanganError(ruanganData.length ? '' : 'Belum ada ruangan yang terdaftar.');
    } else {
      setRuanganList([]);
      setRuanganError(ruanganResult.reason.response?.data?.message || 'Data ruangan gagal dimuat.');
    }

    setLoadingRooms(false);
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1);
    }, 300);

    return () => clearTimeout(timer);

  }, [loadData]);

  async function handleDelete(item) {

    if (!confirm(`Hapus "${item.nama_barang}" dari inventaris?`)) {
      return;
    }
    try {
      await api.delete(`/inventaris/${item.id}`);
      loadData(pagination.page);
    } catch (err) {

      setError(
        err.response?.data?.message ||
        'Gagal menghapus barang.'
      );
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

    exportToExcel(
      formatted,
      'Laporan_Inventaris_HW_UNIMUS'
    );
  };
  const renderFoto = (item) => {
    const namaFoto = item.foto || item.foto_url;

    if (!namaFoto) {
      return (
        <span className="
          text-xs
          italic
          text-slate-400
        ">
          Tanpa foto
        </span>
      );
    }
    const srcUrl = namaFoto.startsWith('http')
      ? namaFoto
      : `http://localhost:5000/uploads/${namaFoto}`;

    return (
      <img
        src={srcUrl}
        className="
          h-10
          w-10
          rounded-lg
          border
          border-slate-200
          object-cover
        "

        alt={item.nama_barang}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            `http://localhost:5000${namaFoto.startsWith('/') ? '' : '/'}${namaFoto}`;

        }}

      />
    );

  };
  return (

    <DashboardLayout
      title="Inventaris"
      subtitle="Kelola seluruh barang logistik Mako beserta riwayat perubahannya"
    >
      <div className="
        mb-5
        flex
        flex-wrap
        items-center
        gap-3
      ">
        <div className="
          relative
          min-w-[220px]
          flex-1
        ">
          <Search

            size={16}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama barang..."
            className="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              py-2.5
              pl-10
              text-sm
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />

        </div>
        <select
          value={kondisi}
          onChange={(e) => setKondisi(e.target.value)}
          className="
            rounded-lg
            border
            border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
          "

        >
          <option value="">
            Semua Kondisi
          </option>

          <option value="Baik">
            Baik
          </option>

          <option value="Rusak">
            Rusak
          </option>

          <option value="Hilang">
            Hilang
          </option>

          <option value="Maintenance">
            Maintenance
          </option>

        </select>

        <select
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
          className="
            rounded-lg
            border
            border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
          "
        >
          <option value="">
            Semua Kategori
          </option>

          {
            kategoriList.map(k => (

              <option
                key={k.id}
                value={k.id}
              >

                {k.nama_kategori}

              </option>
            ))
          }

        </select>

        <button
          onClick={handleExport}
          className="
            flex
            items-center
            gap-2
            rounded-lg
            bg-emerald-600
            px-4
            py-2
            text-sm
            font-medium
            text-white
            shadow-sm
            transition
            hover:bg-emerald-700
          "
        >
          <FileSpreadsheet size={16}/>
          Ekspor Excel

        </button>

        {
          isAdmin && (
            <Button
              onClick={() => {
                setEditingItem(null);
                loadMasterData();
                setFormOpen(true);
              }}

            >
              <Plus size={16}/>
              Tambah Barang
            </Button>

          )
        }

      </div>
      {
        error && (
          <div
            className="
              mb-5
              rounded-lg
              border
              border-red-200
              bg-red-50
              p-3
              text-sm
              text-red-700
            "
          >
            {error}
          </div>

        )
      }

      {/* TABLE */}
      <div

        className="
          overflow-hidden
          rounded-xl
          border
          border-emerald-100
          bg-white
          shadow-[0_10px_30px_rgba(21,78,66,0.08)]
        "
      >
        <table className="w-full text-sm">

          <thead>

            <tr className="bg-emerald-800 text-left text-white">
              <th className="
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
              ">
                Barang
              </th>

              <th className="
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
              ">
                Kategori
              </th>

              <th className="
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
              ">
                Jumlah
              </th>

              <th className="
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
              ">
                Kondisi
              </th>

              <th className="
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
              ">
                Lokasi
              </th>

              <th className="
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
              ">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>

            {
              loading && (
                <tr>

                  <td

                    colSpan="6"
                    className="
                      p-10
                      text-center
                      text-slate-400
                    "
                  >
                    Memuat data...

                  </td>
                </tr>

              )
            }
            {
              !loading &&
              data.map(item => (
                <tr
                  key={item.id}

                  className="
                    border-b
                    border-emerald-50
                    odd:bg-white
                    even:bg-emerald-50/50
                    transition
                    hover:bg-amber-50
                    last:border-0
                  "
                >
                  <td className="
                    flex
                    items-center
                    gap-3
                    px-5
                    py-3
                  ">

                    {renderFoto(item)}
                    <span className="
                      font-medium
                      text-slate-800
                    ">
                      {item.nama_barang}
                    </span>

                  </td>
                  <td className="px-5 text-slate-700">

                    {item.nama_kategori || '—'}

                  </td>
                  <td className="
                    px-5
                    font-medium
                    text-slate-700
                  ">

                    {item.jumlah}

                  </td>
                  <td className="px-5">

                    <KondisiBadge
                      kondisi={item.kondisi}
                    />
                  </td>
                  <td className="
                    px-5
                    py-3
                    text-slate-500
                  ">
                    <div>
                      <div className="text-slate-700">
                        {item.nama_ruangan || '—'}

                      </div>
                      {
                        item.lokasi_detail && (
                          <div className="
                            text-xs
                            text-slate-400
                          ">

                            {item.lokasi_detail}

                          </div>
                        )
                      }
                    </div>
                  </td>

                  <td className="px-5">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setDetailItem(item)}

                        className="
                          rounded-lg
                          p-1.5
                          text-slate-500
                          transition
                          hover:bg-blue-50
                          hover:text-blue-600
                        "
                      >
                        <Eye size={16}/>
                      </button>
                      {
                        isAdmin && (

                          <>
                            <button

                              onClick={() => {

                                setEditingItem(item);
                                loadMasterData();
                                setFormOpen(true);
                              }}
                              className="
                                rounded-lg
                                p-1.5
                                text-slate-500
                                transition
                                hover:bg-blue-50
                                hover:text-blue-600
                              "
                            >
                              <Pencil size={16}/>
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="
                                rounded-lg
                                p-1.5
                                text-red-500
                                transition
                                hover:bg-red-50
                                hover:text-red-700
                              "
                            >
                              <Trash2 size={16}/>
                            </button>

                          </>
                        )
                      }
                    </div>
                  </td>
                </tr>
              ))
            }

          </tbody>
        </table>
      </div>

      {
        formOpen && (
          <InventarisFormModal
            item={editingItem}
            onClose={() => setFormOpen(false)}
            onSuccess={() => {
              setFormOpen(false);
              loadData(pagination.page);
            }}

            kategoriList={kategoriList}
            ruanganList={ruanganList}
            ruanganError={ruanganError}
            loadingRooms={loadingRooms}
            onRetryRooms={loadMasterData}
          />
        )
      }

      {
        detailItem && (
          <InventarisDetailModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
          />
        )
      }

    </DashboardLayout>
  );
}