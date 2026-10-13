import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Camera, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/exportToExcel';
import QRCode from 'qrcode';

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
        columns: ['nama_bidang', 'jadwal_periode', 'minggu_mulai', 'minggu_selesai', 'periode_valid'],
      },
      {
        key: 'pelaksanaan',
        title: 'Pelaksanaan Terbaru',
        columns: ['created_at', 'nama_bidang', 'nama_pengisi', 'status', 'status_verifikasi', 'foto_url', 'catatan'],
      },
    ],
    forms: [
      {
        title: 'Tambah Jadwal Piket',
        path: '/operasional/piket/jadwal',
        fields: [
          ['bidang_id', 'Bidang', 'select', 'bidang'],
          ['minggu_mulai', 'Tanggal mulai piket', 'date'],
          ['minggu_selesai', 'Tanggal akhir piket', 'date'],
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
  minggu_mulai: today(),
  minggu_selesai: today(),
};

export default function OperasionalModule({ type }) {
  const config = configs[type];
  const { isAdmin, user } = useAuth();

  const [data, setData] = useState({});
  const [master, setMaster] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);
  const [activeTab, setActiveTab] = useState('barang');
    const [editItem, setEditItem] = useState(null); //
  const [formValues, setFormValues] = useState(initialFormValues);
  const [piketQr, setPiketQr] = useState('');

  useEffect(() => {
    setOpen(null);
    setActiveTab('barang');
    setFormValues(initialFormValues);
  }, [type]);

  useEffect(() => {
    load();
  }, [type]);

  useEffect(() => {
    if (type !== 'piket' || !isAdmin) return;
    QRCode.toDataURL(`${window.location.origin}/form-piket`, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: { dark: '#064e3b', light: '#ffffff' },
    }).then(setPiketQr).catch((err) => {
      console.error('[OperasionalModule] Gagal membuat QR piket:', err);
      setError('QR piket tidak dapat dibuat.');
    });
  }, [type, isAdmin]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const load = async () => {
    try {
      setError('');
      const moduleRes = await api.get(`/operasional/${type}`);
      if (Array.isArray(moduleRes.data)) {
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
      await load();
      setNotice(res.data.message || 'Peminjaman berhasil disetujui.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui peminjaman.');
    }
  };

  const handleReturn = async (id) => {
    try {
      setError('');
      const res = await api.put(`/operasional/peminjaman/${id}/return`);
      await load();
      setNotice(res.data.message || 'Pengembalian berhasil diproses.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses pengembalian.');
    }
  };

  const handleVerifyPiket = async (id) => {
    try {
      setError('');
      const res = await api.put(`/operasional/piket/pelaksanaan/${id}/verifikasi`);
      await load();
      setNotice(res.data.message || 'Laporan piket berhasil diverifikasi.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memverifikasi laporan piket.');
    }
  };

  const handleFieldChange = (e) => {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setNotice('');
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

        const formElement = e.currentTarget;
        const formData = new FormData(formElement);
        const formConfig = config.forms.find((form) => form.path === path);
        const hasFile = formConfig?.fields.some(
          ([, , fieldType]) => fieldType === 'file'
        );
        let payload = hasFile
          ? formData
          : Object.fromEntries(formData.entries());

        if (path === '/operasional/sewa/peminjaman') {
          if (payload instanceof FormData) {
            payload.set('total_harga', calculatedTotal.toString());
          } else {
            payload.total_harga = calculatedTotal.toString();
          }
        }

        setSaving(true);
        try {
          const res = await api.post(path, payload);
          formElement.reset();
          setFormValues(initialFormValues);
          setOpen(null);
          setEditItem(null);
          await load();
          setNotice(res.data?.message || 'Data berhasil disimpan.');
        } catch (err) {
          setError(err.response?.data?.message || 'Gagal menyimpan data.');
        } finally {
          setSaving(false);
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
      setEditItem(null);
      await load();
      setNotice(res.data.message || 'Data barang berhasil diperbarui.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui data barang.');
    }
  };



  const options = (source) => {
    if (selectStatic[source]) {
      return selectStatic[source].map((v) => (
        Array.isArray(v) ? v : [v, v]
      ));
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
  const handleExport = (section, rows) => {
    const formattedRows = rows.map((row, index) => ({
      No: index + 1,
      ...Object.fromEntries(
        section.columns.map((column) => [label(column), row[column] ?? '—'])
      ),
    }));
    const reportName = type === 'piket' ? 'Piket_Mako' : 'Unboxing_Mako';
    exportToExcel(formattedRows, `Laporan_${reportName}_${section.key}`);
  };

  const handleViewPiketPhoto = async (url) => {
    const photoWindow = window.open('', '_blank');
    if (!photoWindow) {
      setError('Izinkan pop-up browser untuk membuka foto.');
      return;
    }
    photoWindow.document.write('Memuat foto piket...');
    try {
      const { data } = await api.get(url, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(data);
      photoWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (err) {
      photoWindow.close();
      setError(err.response?.data?.message || 'Foto piket tidak dapat dibuka.');
    }
  };

  const printPiketQr = () => {
    if (!piketQr) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Izinkan pop-up browser untuk mencetak QR.');
      return;
    }
    printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>QR Dokumentasi Piket</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:32px;color:#064e3b}img{width:280px;height:280px}.url{font-size:12px;overflow-wrap:anywhere}</style></head><body><h1>Dokumentasi Piket HW UNIMUS</h1><p>Pindai QR untuk mengisi laporan piket</p><img src="${piketQr}" alt="QR Form Piket"><p class="url">${window.location.origin}/form-piket</p><script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <DashboardLayout title={config.title} subtitle={config.subtitle}>
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" aria-live="polite" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {type === 'piket' && isAdmin && (
        <section className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-semibold text-emerald-950">QR Form Piket</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-600">Cetak QR ini dan pasang di sekretariat. QR membuka formulir publik tanpa membagikan akses admin.</p>
            <button type="button" onClick={printPiketQr} disabled={!piketQr} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400">Cetak QR</button>
          </div>
          {piketQr && <img src={piketQr} alt="QR Form Piket" className="h-36 w-36 border border-slate-200 p-1" />}
        </section>
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
          if (
            type === 'piket' &&
              ['/operasional/piket/pelaksanaan', '/operasional/piket/jadwal'].includes(form.path) &&
            !isUserAdmin
          ) return null;
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
                    accept={typeField === 'file' ? 'image/jpeg,image/png,.jpg,.jpeg,.png' : undefined}
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
                    min={typeField === 'number'
                      ? '1'
                      : typeField === 'date' && name === 'minggu_selesai'
                      ? formValues.minggu_mulai || today()
                      : undefined}
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

            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {config.sections.map((section) => {
          if (type === 'sewa' && section.key !== activeTab) return null;
          const rows = Array.isArray(data[section.key]) ? data[section.key] : [];
          const renderRow = (row, index) => (
            <tr
              key={row.id ?? index}
              className="border-t border-emerald-50 odd:bg-white even:bg-emerald-50/50 hover:bg-amber-50"
            >
              {section.columns.map((column) => (
                <td key={column} className="px-4 py-3 text-gray-700">
                  {column === 'foto_url' && row[column] ? (
                    type === 'piket' ? (
                      <button
                        type="button"
                        onClick={() => handleViewPiketPhoto(row[column])}
                        className="inline-flex items-center gap-1 text-teal-600 hover:underline"
                      >
                        <Camera size={14} /> Lihat
                      </button>
                    ) : (
                      <a
                        href={row[column]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-teal-600 hover:underline"
                      >
                        <Camera size={14} /> Lihat
                      </a>
                    )
                  ) : column === 'created_at' && row[column] ? (
                    (() => {
                      const [date, time] = String(row[column]).split(' ');
                      const [year, month, day] = date.split('-').map(Number);
                      return `${new Date(year, month - 1, day).toLocaleDateString('id-ID')} ${time?.slice(0, 5) || ''}`;
                    })()
                  ) : column === 'jadwal_periode' ? (
                    row[column] || '-'
                  ) : column === 'periode_valid' ? (
                    Number(row[column])
                      ? <span className="font-semibold text-emerald-700">Valid</span>
                      : <span className="font-semibold text-amber-700">Periksa periode</span>
                  ) : column === 'status_verifikasi' ? (
                    Number(row[column])
                      ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Terverifikasi</span>
                      : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Menunggu verifikasi</span>
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
                <td className="flex gap-2 px-4 py-3">
                  {section.key === 'barang' && (
                    <button
                      type="button"
                      onClick={() => setEditItem(row)}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-600"
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
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                        >
                          Setujui
                        </button>
                      )}
                      {(row.status === 'Dipinjam' || row.status === 'Terlambat') && (
                        <button
                          type="button"
                          onClick={() => handleReturn(row.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
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
              {type === 'piket' && section.key === 'pelaksanaan' && isUserAdmin && (
                <td className="px-4 py-3">
                  {!Number(row.status_verifikasi) && (
                    <button
                      type="button"
                      onClick={() => handleVerifyPiket(row.id)}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                    >
                      Verifikasi
                    </button>
                  )}
                </td>
              )}
            </tr>
          );
          const piketGroups = type === 'piket' && section.key === 'pelaksanaan'
            ? Array.from(rows.reduce((groups, row) => {
                const groupName = row.nama_bidang || 'Bidang belum diketahui';
                if (!groups.has(groupName)) groups.set(groupName, []);
                groups.get(groupName).push(row);
                return groups;
              }, new Map()).entries())
            : [];
          return (
            <div
              key={section.key}
              className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-[0_10px_30px_rgba(21,78,66,0.07)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-5 py-3">
                <div>
                  <h3 className="text-base font-semibold text-emerald-950">
                    {section.title}
                  </h3>
                  {type === 'piket' && section.key === 'jadwal' && (
                    <p className="mt-1 text-xs text-slate-600">
                      Jadwal yang bentrok ditandai “Periksa periode” dan tidak ditampilkan pada form QR.
                    </p>
                  )}
                  {type === 'piket' && section.key === 'pelaksanaan' && (
                    <p className="mt-1 text-xs text-slate-600">
                      Laporan dari QR perlu diperiksa dan diverifikasi admin sebelum dianggap sah.
                    </p>
                  )}
                </div>
                {(type === 'piket' || type === 'unboxing') && (
                  <button
                    type="button"
                    onClick={() => handleExport(section, rows)}
                    disabled={rows.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FileSpreadsheet size={16} />
                    Ekspor Excel
                  </button>
                )}
              </div>

              {rows.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">Belum ada data.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-emerald-800 text-left text-xs uppercase text-emerald-50">
                      <tr>
                        {section.columns.map((column) => (
                          <th key={column} className="px-4 py-3">
                            {label(column)}
                          </th>
                        ))}
                        {type === 'sewa' &&
                          section.key === 'peminjaman' &&
                          isUserAdmin && <th className="px-4 py-3">Aksi Admin</th>}
                        {type === 'piket' &&
                          section.key === 'pelaksanaan' &&
                          isUserAdmin && <th className="px-4 py-3">Aksi Admin</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {piketGroups.length > 0
                        ? piketGroups.map(([groupName, groupRows]) => (
                            <React.Fragment key={groupName}>
                              <tr className="bg-emerald-50">
                                <td
                                  colSpan={section.columns.length + (isUserAdmin ? 1 : 0)}
                                  className="px-4 py-3 font-semibold text-emerald-900"
                                >
                                  Saya piket dari {groupName}
                                </td>
                              </tr>
                              {groupRows.map(renderRow)}
                            </React.Fragment>
                          ))
                        : rows.map(renderRow)}
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
