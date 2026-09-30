import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Camera } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

const configs = {
  unboxing: {
    title: 'Unboxing Mako',
    subtitle: 'Pendataan kondisi ruang dan checklist Mako.',
    sections: [
      {
        key: 'data',
        title: 'Riwayat Pendataan Barang',
        columns: ['tanggal', 'nama_barang', 'kondisi_umum', 'foto_url', 'catatan'],
      },
    ],
    forms: [
      {
        title: 'Catat Pemeriksaan Barang',
        path: '/operasional/unboxing',
        fields: [
          ['nama_barang', 'Barang Inventaris', 'text'],
          ['tanggal', 'Tanggal', 'date'],
          ['kondisi_umum', 'Kondisi', 'select', 'kondisiRuang'],
          ['catatan', 'Catatan Pemeriksaan', 'textarea'],
          ['foto', 'Foto', 'file'],
        ],
      },
    ],
  },
  piket: {
    title: 'Piket Harian',
    subtitle: 'Jadwal dan pelaksanaan piket Mako.',
    sections: [
      {
        key: 'jadwal',
        title: 'Jadwal Piket',
        columns: ['minggu_mulai', 'minggu_selesai', 'nama_bidang'],
      },
      {
        key: 'pelaksanaan',
        title: 'Pelaksanaan Terbaru',
        columns: ['tanggal', 'nama_bidang', 'status', 'nama_pengisi', 'catatan'],
      },
    ],
    forms: [
      {
        title: 'Buat Jadwal',
        path: '/operasional/piket/jadwal',
        fields: [
          ['bidang_id', 'Bidang', 'select', 'bidang'],
          ['minggu_mulai', 'Mulai', 'date'],
          ['minggu_selesai', 'Selesai', 'date'],
        ],
      },
      {
        title: 'Catat Pelaksanaan',
        path: '/operasional/piket/pelaksanaan',
        fields: [
          ['jadwal_id', 'Jadwal', 'select', 'jadwal'],
          ['tanggal', 'Tanggal', 'date'],
          ['status', 'Status', 'select', 'statusPiket'],
          ['nama_pengisi', 'Petugas', 'text'],
          ['catatan', 'Catatan', 'textarea'],
        ],
      },
    ],
  },
  sewa: {
    title: 'Barang Sewa',
    subtitle: 'Pantau ketersediaan dan peminjaman.',
    sections: [
      {
        key: 'barang',
        title: 'Barang Sewa',
        columns: [
          'nama_barang',
          'jumlah_total',
          'jumlah_tersedia',
          'jumlah_disewa',
          'harga_perhari',
          'status',
        ],
      },
      {
        key: 'peminjaman',
        title: 'Peminjaman',
        columns: [
          'nama_barang',
          'nama_penyewa',
          'jumlah_dipinjam',
          'tanggal_mulai',
          'tanggal_kembali_rencana',
          'status',
        ],
      },
    ],

    forms: [
      {
        title: 'Tambah Barang Sewa',
        path: '/operasional/sewa/barang',
        fields: [
          ['nama_barang', 'Nama barang', 'text'],
          ['kategori_id', 'Kategori', 'select', 'kategori'],
          ['jumlah_total', 'Jumlah', 'number'],
          ['harga_perhari', 'Harga Sewa Per Hari (Rp)', 'number'],
        ],
      },
      {
        title: 'Catat Peminjaman',
        path: '/operasional/sewa/peminjaman',
        fields: [
          ['barang_sewa_id', 'Barang', 'select', 'barang'],
          ['nama_penyewa', 'Penyewa', 'text'],
          ['kontak_penyewa', 'Kontak', 'text'],
          ['jumlah_dipinjam', 'Jumlah', 'number'],
          ['tanggal_mulai', 'Mulai', 'date'],
          ['tanggal_kembali_rencana', 'Kembali', 'date'],
          ['foto_identitas', 'Foto Identitas (KTM/KTP)', 'file'],
          ['catatan', 'Catatan', 'textarea'],
        ],
      },
    ],
  },
  pengadaan: {
    title: 'Pengadaan Inventaris',
    subtitle: 'Catat pengadaan dan asal dana sebelum barang masuk inventaris.',
    sections: [
      {
        key: 'data',
        title: 'Riwayat Pengadaan',
        columns: ['tanggal', 'nama_barang', 'jumlah', 'harga', 'sumber_dana', 'nama_ruangan'],
      },
    ],
    forms: [
      {
        title: 'Catat Pengadaan',
        path: '/operasional/pengadaan',
        fields: [
          ['nama_barang', 'Nama barang', 'text'],
          ['jumlah', 'Jumlah', 'number'],
          ['tanggal', 'Tanggal', 'date'],
          ['harga', 'Harga', 'number'],
          ['sumber_dana', 'Sumber dana', 'text'],
          ['lokasi_id', 'Ruangan', 'select', 'ruangan'],
          ['catatan', 'Catatan', 'textarea'],
        ],
      },
    ],
  },
  revitalisasi: {
    title: 'Revitalisasi Inventaris',
    subtitle: 'Laporkan kerusakan dan dokumentasikan tindak lanjut perbaikan.',
    sections: [
      {
        key: 'laporan',
        title: 'Laporan Kerusakan',
        columns: ['tanggal_lapor', 'nama_barang', 'deskripsi', 'status'],
      },
      {
        key: 'revitalisasi',
        title: 'Tindakan Revitalisasi',
        columns: ['tanggal_perbaikan', 'nama_barang', 'tindakan', 'biaya', 'status'],
      },
    ],
    forms: [
      {
        title: 'Laporkan Kerusakan',
        path: '/operasional/revitalisasi/laporan',
        fields: [
          ['inventaris_id', 'Inventaris', 'select', 'inventaris'],
          ['tanggal_lapor', 'Tanggal', 'date'],
          ['deskripsi', 'Deskripsi', 'textarea'],
        ],
      },
      {
        title: 'Tambah Tindakan',
        path: '/operasional/revitalisasi',
        fields: [
          ['inventaris_id', 'Inventaris', 'select', 'inventaris'],
          ['tanggal_perbaikan', 'Tanggal', 'date'],
          ['tindakan', 'Tindakan', 'text'],
          ['biaya', 'Biaya', 'number'],
          ['status', 'Status', 'select', 'statusRevitalisasi'],
          ['catatan', 'Catatan', 'textarea'],
        ],
      },
    ],
  },
};

const selectStatic = {
  kondisiRuang: ['Baik', 'Perlu Perbaikan', 'Rusak'],
  statusPiket: ['Selesai', 'Tidak Terlaksana'],
  statusRevitalisasi: ['Diajukan', 'Proses', 'Selesai', 'Dibatalkan'],
};

const label = (key) =>
  key.replaceAll('_', ' ').replace(/\b\w/g, (x) => x.toUpperCase());

const initialFormValues = {
  barang_sewa_id: '',
  jumlah_dipinjam: '1',
  tanggal_mulai: today(),
  tanggal_kembali_rencana: today(),
};

export default function OperasionalModule({ type }) {
  const config = configs[type];
  const { isAdmin, user } = useAuth();

  const [data, setData] = useState({});
  const [master, setMaster] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(null);
  const [activeTab, setActiveTab] = useState('barang');
    const [editItem, setEditItem] = useState(null); //
  const [formValues, setFormValues] = useState(initialFormValues);

  useEffect(() => {
    setOpen(null);
    setActiveTab('barang');
    setFormValues(initialFormValues);
  }, [type]);

  useEffect(() => {
    load();
  }, [type]);

  const load = async () => {
    try {
      setError('');
      const moduleRes = await api.get(`/operasional/${type}`);
      if (type === 'unboxing') {
        setData({ data: moduleRes.data });
      } else {
        setData(moduleRes.data || {});
      }

      try {
        const [kategori, ruangan, bidang, inventaris] = await Promise.all([
          api.get('/master/kategori'),
          api.get('/master/ruangan'),
          api.get('/master/bidang'),
          api.get('/inventaris', { params: { limit: 100 } }),
        ]);

        setMaster({
          kategori: kategori.data || [],
          ruangan: ruangan.data || [],
          bidang: bidang.data || [],
          inventaris: inventaris.data?.data || inventaris.data || [],
        });
      } catch (masterErr) {
        console.warn(masterErr.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Data belum dapat dimuat.');
    }
  };

  const handleApprove = async (id) => {
    try {
      setError('');
      const res = await api.put(`/operasional/peminjaman/${id}/approve`);
      setNotice(res.data.message);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui peminjaman.');
    }
  };

  const handleReturn = async (id) => {
    try {
      setError('');
      const res = await api.put(`/operasional/peminjaman/${id}/return`);
      setNotice(res.data.message);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses pengembalian.');
    }
  };

  const handleFieldChange = (e) => {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculatedTotal = useMemo(() => {
    if (type !== 'sewa' || open === null || !config.forms[open]) return 0;
    if (config.forms[open].path !== '/operasional/sewa/peminjaman') return 0;
    if (!formValues.barang_sewa_id) return 0;

    const selectedBarang = (data.barang || []).find(
      (b) => b.id.toString() === formValues.barang_sewa_id.toString()
    );
    if (!selectedBarang) return 0;

    const hargaPerHari = Number(selectedBarang.harga_perhari) || 0;
    const jumlahBarang = Number(formValues.jumlah_dipinjam) || 0;

    const tglMulai = new Date(formValues.tanggal_mulai);
    const tglKembali = new Date(formValues.tanggal_kembali_rencana);

    if (
      isNaN(tglMulai.getTime()) ||
      isNaN(tglKembali.getTime()) ||
      tglKembali < tglMulai
    ) {
      return 0;
    }

    const diffTime = tglKembali.getTime() - tglMulai.getTime();
    const jumlahHari = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return hargaPerHari * jumlahBarang * jumlahHari;
  }, [formValues, data.barang, type, open, config.forms]);
  
      const handleSubmit = async (e, path) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const formData = new FormData(e.target);

    if (path === '/operasional/sewa/peminjaman') {
      formData.set('total_harga', calculatedTotal.toString());
    }

    try {
      const res = await api.post(path, formData);
      setNotice(res.data.message);
      setOpen(null);
      setEditItem(null);
      e.target.reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());

    try {
      const res = await api.put(`/operasional/sewa/barang/${id}`, body);
      setNotice(res.data.message);
      setEditItem(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui data barang.');
    }
  };



  const options = (source) => {
    if (selectStatic[source]) {
      return selectStatic[source].map((v) => [v, v]);
    }
    if (source === 'jadwal') {
      return (data.jadwal || []).map((v) => [
        v.id,
        `${v.nama_bidang} (${v.minggu_mulai})`,
      ]);
    }
    if (source === 'barang') {
      return (data.barang || []).map((v) => [
        v.id,
        `${v.nama_barang} — tersedia ${v.jumlah_tersedia} (Rp ${v.harga_perhari}/hari)`,
      ]);
    }
    const names = {
      kategori: 'nama_kategori',
      ruangan: 'nama_ruangan',
      bidang: 'nama_bidang',
      inventaris: 'nama_barang',
    };
    return (master[source] || []).map((v) => [v.id, v[names[source]]]);
  };

  const isUserAdmin = isAdmin || user?.role === 'admin_logistik';

  return (
    <DashboardLayout title={config.title} subtitle={config.subtitle}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
          {notice}
        </div>
      )}

      {type === 'sewa' && (
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('barang');
              setOpen(null);
            }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'barang'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stok Barang Sewa
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('peminjaman');
              setOpen(null);
            }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'peminjaman'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Peminjaman
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {config.forms.map((form, index) => {
          if (type === 'sewa') {
            if (activeTab === 'barang' && form.path !== '/operasional/sewa/barang')
              return null;
            if (
              activeTab === 'peminjaman' &&
              form.path !== '/operasional/sewa/peminjaman'
            )
              return null;
          }
          return (
            <Button
              key={form.path}
              onClick={() => setOpen(open === index ? null : index)}
            >
              {open === index ? 'Tutup Formulir' : form.title}
            </Button>
          );
        })}
      </div>

      {open !== null && config.forms[open] && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            {config.forms[open].title}
          </h3>
          <form
            onSubmit={(e) => handleSubmit(e, config.forms[open].path)}
            className="space-y-4"
          >
            {config.forms[open].fields.map(([name, labelText, typeField, source]) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {labelText}
                </label>
                {typeField === 'select' ? (
                  <select
                    id={name}
                    name={name}
                    value={formValues[name] || ''}
                    onChange={handleFieldChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Pilih {labelText}</option>
                    {options(source).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                ) : typeField === 'textarea' ? (
                  <textarea
                    id={name}
                    name={name}
                    value={formValues[name] || ''}
                    onChange={handleFieldChange}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <input
                    id={name}
                    type={typeField}
                    name={name}
                    value={
                      typeField === 'file'
                        ? undefined
                        : formValues[name] !== undefined
                        ? formValues[name]
                        : typeField === 'date'
                        ? today()
                        : ''
                    }
                    onChange={typeField !== 'file' ? handleFieldChange : undefined}
                    min={typeField === 'number' ? '1' : undefined}
                    required={typeField !== 'file'}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                )}
              </div>
            ))}

            {type === 'sewa' &&
              open !== null &&
              config.forms[open].path === '/operasional/sewa/peminjaman' && (
                <div className="rounded-xl bg-teal-50 p-3 text-sm font-medium text-teal-800">
                  Estimasi Total Harga Peminjaman: Rp{' '}
                  {calculatedTotal.toLocaleString('id-ID')}
                </div>
              )}

            <Button type="submit">Simpan Data</Button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {config.sections.map((section) => {
          if (type === 'sewa' && section.key !== activeTab) return null;
          const rows = Array.isArray(data[section.key]) ? data[section.key] : [];
          return (
            <div
              key={section.key}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-base font-semibold text-gray-800">
                  {section.title}
                </h3>
              </div>

              {rows.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">Belum ada data.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        {section.columns.map((column) => (
                          <th key={column} className="px-4 py-3">
                            {label(column)}
                          </th>
                        ))}
                        {type === 'sewa' &&
                          section.key === 'peminjaman' &&
                          isUserAdmin && <th className="px-4 py-3">Aksi Admin</th>}
                      </tr>
                    </thead>
                    <tbody>
                                          {rows.map((row, index) => (
                      <tr
                        key={row.id ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        {section.columns.map((column) => (
                          <td key={column} className="px-4 py-3 text-gray-700">
                            {column === 'foto_url' && row[column] ? (
                              <a
                                href={row[column]}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-teal-600 hover:underline"
                              >
                                <Camera size={14} /> Lihat
                              </a>
                            ) : column.includes('tanggal') ||
                              column.includes('minggu') ? (
                              row[column]
                                ? new Date(row[column]).toLocaleDateString('id-ID')
                                : '-'
                            ) : (
                              row[column]?.toString() || '-'
                            )}
                          </td>
                        ))}
                        {type === 'sewa' && isUserAdmin && (
                          <td className="px-4 py-3 flex gap-2">
                            {section.key === 'barang' && (
                              <button
                                type="button"
                                onClick={() => setEditItem(row)}
                                className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                              >
                                Edit Barang
                              </button>
                            )}

                            {section.key === 'peminjaman' && (
                              <>
                                {row.status === 'Menunggu Persetujuan' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(row.id)}
                                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
                                  >
                                    Setujui
                                  </button>
                                )}
                                {(row.status === 'Dipinjam' || row.status === 'Terlambat') && (
                                  <button
                                    type="button"
                                    onClick={() => handleReturn(row.id)}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                                  >
                                    Selesai
                                  </button>
                                )}
                                {row.status === 'Selesai' && (
                                  <span className="text-xs font-medium text-gray-400">Selesai</span>
                                )}
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                )}
              </div>
          );
        })}
      </div>

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h3 className="mb-4 font-semibold text-gray-900 text-lg">Edit Inventaris Barang Sewa</h3>
            <form onSubmit={(e) => handleEditSubmit(e, editItem.id)} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Nama Barang</label>
                <input type="text" name="nama_barang" defaultValue={editItem.nama_barang} required className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Kategori</label>
                <select name="kategori_id" defaultValue={editItem.kategori_id || ''} className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm outline-none focus:border-teal-500">
                  <option value="">Pilih Kategori</option>
                  {(master.kategori || []).map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Jumlah Total Stok</label>
                <input type="number" name="jumlah_total" defaultValue={editItem.jumlah_total} min="0" required className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Harga Sewa Per Hari (Rp)</label>
                <input type="number" name="harga_perhari" defaultValue={editItem.harga_perhari} min="0" required className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Status Ketersediaan</label>
                <select name="status" defaultValue={editItem.status} required className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm outline-none focus:border-teal-500">
                  {['Ready', 'Sebagian Disewa', 'Disewa', 'Rusak', 'Maintenance', 'Hilang'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditItem(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
                <Button type="submit">Simpan Perubahan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
