import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ArrowUpRight,
  CalendarClock,
  PackagePlus,
  History,
} from 'lucide-react';

import DashboardLayout from '../components/Layout/DashboardLayout';
import StatCard from '../components/UI/StatCard';
import api from '../api/axios';

const aktivitasLabel = {
  Ditambahkan: 'menambahkan',
  Diperbarui: 'memperbarui',
  Diperbaiki: 'memperbaiki',
  Disewa: 'menyewakan',
  Dikembalikan: 'mengembalikan',
  'Kondisi Berubah': 'mengubah kondisi',
  'Dipindah Lokasi': 'memindahkan lokasi',
  Dihapus: 'menghapus',
};

function formatWaktu(iso) {
  const d = new Date(iso);

  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard() {
  const [ringkasan, setRingkasan] = useState(null);
  const [aktivitas, setAktivitas] = useState([]);
  const [piket, setPiket] = useState({
    jadwal: [],
    pelaksanaan: [],
  });

  const [pengadaan, setPengadaan] = useState([]);
  const [revitalisasi, setRevitalisasi] = useState({
    laporan: [],
    revitalisasi: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hariIni = new Date().toISOString().slice(0, 10);

  const jadwalMingguIni = piket.jadwal.find(
    (jadwal) =>
      jadwal.minggu_mulai <= hariIni &&
      jadwal.minggu_selesai >= hariIni
  );

  const pengadaanTerbaru = pengadaan[0];

  const laporanTerbuka = revitalisasi.laporan.filter(
    (laporan) => laporan.status !== 'Selesai'
  ).length;

  const revitalisasiTerbaru =
    revitalisasi.revitalisasi[0];


  useEffect(() => {
    async function load() {
      try {
        const [
          r1,
          r2,
          r3,
          r4,
          r5,
        ] = await Promise.all([
          api.get('/inventaris/ringkasan'),
          api.get('/inventaris/aktivitas-terbaru?limit=8'),
          api.get('/operasional/piket'),
          api.get('/operasional/pengadaan'),
          api.get('/operasional/revitalisasi'),
        ]);

        setRingkasan(r1.data);
        setAktivitas(r2.data);
        setPiket(r3.data);
        setPengadaan(r4.data);
        setRevitalisasi(r5.data);

      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Data dashboard belum dapat dimuat. Coba muat ulang halaman.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);


  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Ringkasan kondisi logistik Mako HW UNIMUS saat ini"
    >

      {/* STATISTIC CARD */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-5
      ">

        <StatCard
          label="Total Inventaris"
          value={
            loading
              ? '—'
              : ringkasan?.total_inventaris ?? 0
          }
          icon={Boxes}
          accent="brand"
        />


        <StatCard
          label="Barang Ready (Baik)"
          value={
            loading
              ? '—'
              : ringkasan?.ready ?? 0
          }
          icon={CheckCircle2}
          accent="baik"
        />


        <StatCard
          label="Rusak / Hilang"
          value={
            loading
              ? '—'
              : ringkasan?.rusak_hilang ?? 0
          }
          icon={AlertTriangle}
          accent="rusak"
        />


        <StatCard
          label="Maintenance"
          value={
            loading
              ? '—'
              : ringkasan?.maintenance ?? 0
          }
          icon={Wrench}
          accent="maintenance"
        />

      </div>



      {error && (
        <div
          role="alert"
          className="
            mt-4
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            shadow-sm
          "
        >
          {error}
        </div>
      )}



      <div className="
        grid
        grid-cols-1
        lg:grid-cols-3
        gap-5
        mt-6
      ">



        {/* AKTIVITAS */}
        <div
          className="
            lg:col-span-2
            bg-white
            rounded-xl
            border
            border-slate-200
            shadow-sm
            overflow-hidden
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              px-5
              py-4
              border-b
              border-slate-100
            "
          >

            <h2
              className="
                text-sm
                font-bold
                text-slate-900
                flex
                items-center
                gap-2
              "
            >

              <History
                size={16}
                className="text-blue-600"
              />

              Aktivitas Logistik Terbaru

            </h2>


            <Link
              to="/inventaris"
              className="
                text-xs
                font-semibold
                text-blue-600
                hover:text-blue-700
                flex
                items-center
                gap-1
              "
            >

              Lihat inventaris

              <ArrowUpRight size={13}/>

            </Link>

          </div>



          <div className="divide-y divide-slate-100">


            {loading && (
              <p className="
                px-5
                py-6
                text-sm
                text-slate-400
              ">
                Memuat aktivitas…
              </p>
            )}



            {!loading && aktivitas.length === 0 && (
              <p className="
                px-5
                py-6
                text-sm
                text-slate-400
              ">
                Belum ada aktivitas tercatat.
              </p>
            )}



            {aktivitas.map((a) => (

              <div
                key={a.id}
                className="
                  px-5
                  py-3.5
                  flex
                  items-start
                  justify-between
                  gap-4
                  hover:bg-blue-50
                  transition
                "
              >

                <p
                  className="
                    text-sm
                    text-slate-700
                  "
                >

                  <span className="font-semibold">
                    {a.nama_pengubah || 'Sistem'}
                  </span>

                  {' '}

                  {aktivitasLabel[a.tipe_perubahan] ||
                    'mengubah'}

                  {' '}

                  <span className="font-semibold">
                    {a.nama_barang}
                  </span>

                </p>



                <span
                  className="
                    text-xs
                    text-slate-400
                    shrink-0
                  "
                >
                  {formatWaktu(a.created_at)}
                </span>


              </div>

            ))}

          </div>

        </div>





        {/* RIGHT PANEL */}
        <div className="space-y-5">


          <div
            className="
              bg-white
              rounded-xl
              border
              border-slate-200
              shadow-sm
              p-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-2
              "
            >

              <h2
                className="
                  text-sm
                  font-bold
                  text-slate-900
                  flex
                  items-center
                  gap-2
                "
              >

                <CalendarClock
                  size={16}
                  className="text-orange-500"
                />

                Jadwal Piket Minggu Ini

              </h2>


              <Link
                to="/piket"
                className="
                  text-xs
                  font-semibold
                  text-blue-600
                "
              >
                Kelola
              </Link>

            </div>


            {
              loading ?

              (
                <p className="text-sm text-slate-400">
                  Memuat jadwal…
                </p>
              )

              :

              jadwalMingguIni ?

              (
                <div className="text-sm">

                  <p className="font-semibold text-slate-800">
                    {jadwalMingguIni.nama_bidang}
                  </p>


                  <p className="mt-1 text-slate-500">
                    {jadwalMingguIni.minggu_mulai}
                    {' s.d '}
                    {jadwalMingguIni.minggu_selesai}
                  </p>


                  <p className="
                    mt-2
                    text-xs
                    text-slate-400
                  ">
                    {
                      piket.pelaksanaan.filter(
                        (item) =>
                          item.jadwal_id === jadwalMingguIni.id &&
                          item.status === 'Selesai'
                      ).length
                    }

                    pelaksanaan selesai tercatat

                  </p>


                </div>
              )

              :

              (
                <p className="text-sm text-slate-400">
                  Belum ada jadwal untuk minggu ini.
                </p>
              )

            }


          </div>





          <div
            className="
              bg-white
              rounded-xl
              border
              border-slate-200
              shadow-sm
              p-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-2
              "
            >

              <h2
                className="
                  text-sm
                  font-bold
                  text-slate-900
                  flex
                  items-center
                  gap-2
                "
              >

                <PackagePlus
                  size={16}
                  className="text-emerald-600"
                />

                Pengadaan / Revitalisasi Terbaru

              </h2>


              <Link
                to="/pengadaan"
                className="
                  text-xs
                  font-semibold
                  text-blue-600
                "
              >
                Kelola
              </Link>


            </div>




            {
              loading ?

              (
                <p className="text-sm text-slate-400">
                  Memuat data…
                </p>
              )

              :

              (
                <div className="
                  space-y-3
                  text-sm
                ">


                  <div>

                    <p className="
                      text-xs
                      text-slate-400
                    ">
                      Pengadaan terbaru
                    </p>


                    <p className="
                      font-semibold
                      text-slate-800
                    ">

                      {
                        pengadaanTerbaru
                        ?
                        `${pengadaanTerbaru.nama_barang} (${pengadaanTerbaru.jumlah})`
                        :
                        'Belum ada pengadaan.'
                      }

                    </p>


                  </div>



                  <div
                    className="
                      border-t
                      border-slate-100
                      pt-2
                    "
                  >

                    <p className="
                      text-xs
                      text-slate-400
                    ">
                      Revitalisasi
                    </p>


                    <p className="
                      font-semibold
                      text-slate-800
                    ">

                      {
                        revitalisasiTerbaru
                        ?
                        revitalisasiTerbaru.tindakan
                        :
                        'Belum ada tindakan revitalisasi.'
                      }

                    </p>


                    <p className="
                      mt-1
                      text-xs
                      font-medium
                      text-orange-600
                    ">

                      {laporanTerbuka}
                      {' '}
                      laporan kerusakan masih terbuka

                    </p>


                  </div>


                </div>

              )

            }


          </div>


        </div>


      </div>


    </DashboardLayout>
  );
}