import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import Modal from '../../components/UI/Modal';
import KondisiBadge from '../../components/UI/KondisiBadge';
import api from '../../api/axios';

function formatWaktu(iso) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InventarisDetailModal({ item, onClose }) {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventaris/${item.id}/riwayat`)
      .then((res) => setRiwayat(res.data))
      .finally(() => setLoading(false));
  }, [item.id]);

  return (
    <Modal title={item.nama_barang} onClose={onClose} width="max-w-2xl">
      <div className="flex gap-5 mb-6">
        {item.foto_url ? (
          <img src={item.foto_url} alt={item.nama_barang} className="h-28 w-28 rounded-xl object-cover border border-slate-200" />
        ) : (
          <div className="h-28 w-28 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Tanpa foto</div>
        )}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
          <div><dt className="text-slate-400">Kategori</dt><dd className="font-medium text-slate-800">{item.nama_kategori || '—'}</dd></div>
          <div><dt className="text-slate-400">Kondisi</dt><dd><KondisiBadge kondisi={item.kondisi} /></dd></div>
          <div><dt className="text-slate-400">Jumlah</dt><dd className="font-medium text-slate-800">{item.jumlah}</dd></div>
          <div><dt className="text-slate-400">Ruangan</dt><dd className="font-medium text-slate-800">{item.nama_ruangan || '—'}</dd></div>
          <div><dt className="text-slate-400">Lokasi Detail</dt><dd className="font-medium text-slate-800">{item.lokasi_detail || '—'}</dd></div>
          <div><dt className="text-slate-400">Tgl. Pendataan</dt><dd className="font-medium text-slate-800">{item.tanggal_pendataan}</dd></div>
        </dl>
      </div>

      {item.catatan && (
        <div className="mb-6 px-3.5 py-2.5 rounded-lg bg-slate-50 text-sm text-slate-600">{item.catatan}</div>
      )}

      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
        <Clock size={15} className="text-brand" /> Riwayat Perubahan
      </h3>

      {loading && <p className="text-sm text-slate-400">Memuat riwayat…</p>}
      {!loading && riwayat.length === 0 && <p className="text-sm text-slate-400">Belum ada riwayat.</p>}

      <ol className="relative border-l border-slate-200 ml-1.5 space-y-4">
        {riwayat.map((r) => (
          <li key={r.id} className="ml-4">
            <div className="absolute w-2 h-2 rounded-full bg-brand -translate-x-[4.5px] mt-1.5 border border-white" />
            <p className="text-xs text-slate-400">{formatWaktu(r.created_at)} &middot; {r.nama_pengubah || 'Sistem'}</p>
            <p className="text-sm font-medium text-slate-800">{r.tipe_perubahan}</p>
            {r.keterangan && <p className="text-sm text-slate-500">{r.keterangan}</p>}
          </li>
        ))}
      </ol>
    </Modal>
  );
}
