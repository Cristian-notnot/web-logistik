import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Building2,
  Compass,
  Loader2,
  Menu,
  PackageCheck,
  Radio,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [homepageData, setHomepageData] = useState(null);

  const fallbackSlides = [
    {
      image: 'DIKLAT ANGGOTA.jpg',
      label: 'Kafilah Jenderal Soedirman',
      title: 'Membangun kader yang tangguh dan berkemajuan',
      description:
        'HW UNIMUS menjadi ruang pengembangan kepanduan, kepemimpinan, pengabdian, serta keterampilan mahasiswa dalam lingkungan yang aktif, disiplin, dan terarah.'
    },
    {
      image: 'pelantikan hw unimus.jpg',
      label: 'Hizbul Wathan UNIMUS',
      title: 'Bertumbuh bersama dalam proses kaderisasi',
      description:
        'Kaderisasi menjadi bagian penting dalam membentuk anggota yang berkarakter, bertanggung jawab, mampu bekerja sama, dan memiliki semangat berkemajuan.'
    },
    {
      image: 'BPH 2025-2026.jpeg',
      label: 'Pandu Berkemajuan',
      title: 'Bergerak, belajar, dan memberi manfaat',
      description:
        'Kegiatan HW UNIMUS menghubungkan nilai kepanduan, pendidikan, keislaman, kemanusiaan, dan kepedulian terhadap lingkungan.'
    }
  ];

  const heroSlides = homepageData?.slides?.length ? homepageData.slides : fallbackSlides;

  const fallbackBidang = [
    {
      number: '01',
      title: 'Bidang Organisasi',
      image: 'pelantikan hw unimus.jpg',
      description:
        'Mengelola tata organisasi, koordinasi pengurus, administrasi, dan keberlangsungan program kerja.'
    },
    {
      number: '02',
      title: 'Bidang Kominfo',
      image: 'DIKLAT ANGGOTA.jpg',
      description:
        'Mengelola informasi, publikasi, dokumentasi, media, dan komunikasi HW UNIMUS.'
    },
    {
      number: '03',
      title: 'Bidang AIK',
      image: 'BPH 2025-2026.jpeg',
      description:
        'Menguatkan nilai Al-Islam dan Kemuhammadiyahan dalam kegiatan serta kehidupan kader.'
    },
    {
      number: '04',
      title: 'Bidang Kepanduan',
      image: 'DIKLAT ANGGOTA.jpg',
      description:
        'Mengembangkan keterampilan kepanduan, kemampuan lapangan, kedisiplinan, dan kerja sama.'
    },
    {
      number: '05',
      title: 'Bidang Logistik',
      image: 'pelantikan hw unimus.jpg',
      description:
        'Mengelola inventaris, sarana, pengadaan, ruang, serta kebutuhan operasional organisasi.'
    },
    {
      number: '06',
      title: 'Bidang Pengkaderan',
      image: 'BPH 2025-2026.jpeg',
      description:
        'Mengelola penerimaan, pembinaan, pendidikan, dan pengembangan anggota HW UNIMUS.'
    }
  ];

  const bidang = homepageData?.bidang?.length ? homepageData.bidang : fallbackBidang;
  const fallbackBkm = [
    {
      nama: 'BKM Kesenian',
      image_url: 'DIKLAT ANGGOTA.jpg',
      deskripsi: 'Ruang pengembangan minat, bakat, kreativitas, dan kegiatan kesenian anggota HW UNIMUS.'
    },
    {
      nama: 'BKM Kewirausahaan',
      image_url: 'BPH 2025-2026.jpeg',
      deskripsi: 'Mengembangkan kemampuan kewirausahaan dan kemandirian anggota melalui kegiatan produktif.'
    }
  ];
  const bkm = homepageData?.bkm?.length ? homepageData.bkm : fallbackBkm;
  const fallbackKegiatan = [
    { image_url: 'DIKLAT ANGGOTA.jpg', title: 'Belajar melalui pengalaman dan kegiatan lapangan' },
    { image_url: 'pelantikan hw unimus.jpg', title: 'Kegiatan HW UNIMUS' },
    { image_url: 'BPH 2025-2026.jpeg', title: 'Aktivitas anggota HW UNIMUS' }
  ];
  const kegiatan = homepageData?.kegiatan?.length ? homepageData.kegiatan.slice(0, 3) : fallbackKegiatan;
  const about = homepageData?.about || {
    label: 'Tentang HW UNIMUS',
    title: 'Tempat tumbuh bagi kader yang aktif dan berkarakter',
    paragraf_pertama: 'Hizbul Wathan Universitas Muhammadiyah Semarang merupakan organisasi kepanduan Muhammadiyah yang dikenal sebagai Kafilah Jenderal Soedirman. HW UNIMUS menjadi ruang pembinaan karakter, kedisiplinan, kepemimpinan, kemandirian, keterampilan, dan pengabdian mahasiswa.',
    paragraf_kedua: 'Setiap bidang memiliki fungsi yang berbeda, tetapi bergerak dalam satu arah untuk mendukung proses kaderisasi dan keberlangsungan kegiatan organisasi.'
  };

  useEffect(() => {
    let cancelled = false;
    api.get('/public/homepage')
      .then(({ data }) => {
        if (!cancelled) {
          setHomepageData(data);
          setActiveSlide(0);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) =>
        prev === heroSlides.length - 1 ? 0 : prev + 1
      );
    }, 7000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  async function handleSubmit(e) {
    e.preventDefault();

    const ok = await login(username, password);

    if (ok) {
      navigate('/dashboard');
    }
  }

  function scrollToSection(id) {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    setMobileMenu(false);
  }

  function nextSlide() {
    setActiveSlide((prev) =>
      prev === heroSlides.length - 1 ? 0 : prev + 1
    );
  }

  function prevSlide() {
    setActiveSlide((prev) =>
      prev === 0 ? heroSlides.length - 1 : prev - 1
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-5 sm:px-7 lg:px-10">
          <button
            type="button"
            onClick={() => scrollToSection('beranda')}
            className="flex items-center gap-3"
          >
            <img
              src="/logo-hw-unimus.png"
              alt="Logo HW UNIMUS"
              className="h-10 w-10 object-contain"
            />

            <div className="text-left leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                HW UNIMUS
              </p>

              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                Kafilah Jenderal Soedirman
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            <button
              type="button"
              onClick={() => scrollToSection('beranda')}
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Beranda
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('tentang')}
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Tentang
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('bidang')}
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Bidang
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('kegiatan')}
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Kegiatan
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('logistik')}
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Logistik
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('kontak')}
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Kontak
            </button>

            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="rounded-full bg-[#08785d] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#06644e]"
            >
              Masuk Sistem
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 lg:hidden"
          >
            {mobileMenu ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t border-slate-200 bg-white px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => scrollToSection('beranda')}
                className="text-left text-sm font-medium"
              >
                Beranda
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('tentang')}
                className="text-left text-sm font-medium"
              >
                Tentang
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('bidang')}
                className="text-left text-sm font-medium"
              >
                Bidang
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('kegiatan')}
                className="text-left text-sm font-medium"
              >
                Kegiatan
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('logistik')}
                className="text-left text-sm font-medium"
              >
                Logistik
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('kontak')}
                className="text-left text-sm font-medium"
              >
                Kontak
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogin(true);
                  setMobileMenu(false);
                }}
                className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
              >
                Masuk Sistem
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section
          id="beranda"
          className="relative overflow-hidden bg-[#020609]"
        >
          <div className="relative min-h-[720px] lg:min-h-[calc(100vh-72px)]">
            {heroSlides.map((slide, index) => (
              <img
                key={slide.id || slide.image_url || slide.image || index}
                src={slide.image_url || slide.image || fallbackSlides[index % fallbackSlides.length].image}
                alt={slide.title}
                style={{ objectPosition: slide.image_position === 'top' ? 'top' : slide.image_position === 'bottom' ? 'bottom' : 'center' }}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
  activeSlide === index ? 'opacity-100' : 'opacity-0'
}`}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
<div className="relative z-10 flex min-h-[620px] items-center lg:min-h-[calc(100vh-72px)]">
              <div className="w-full px-7 sm:px-10 lg:px-[7vw] xl:px-[6.5vw]">
                <div className="max-w-[690px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#78e1bd] sm:text-xs">
                    {heroSlides[activeSlide].label}
                  </p>

                  <h1 className="mt-5 text-[42px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[55px] lg:text-[64px]">
                    {heroSlides[activeSlide].title}
                  </h1>

                  <p className="mt-6 max-w-[620px] text-[16px] font-medium leading-8 text-white/90 drop-shadow-md">
                    {heroSlides[activeSlide].description}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection('tentang')}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-semibold text-slate-900 transition hover:bg-emerald-50"
                    >
                      Tentang HW UNIMUS
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLogin(true)}
                      className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-[13px] font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                    >
                      Masuk Sistem
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-7 left-0 right-0 z-20">
              <div className="flex w-full items-center justify-between px-7 sm:px-10 lg:px-[7vw] xl:px-[6.5vw]">
                <div className="flex items-center gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.image}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={`h-[3px] transition-all duration-300 ${
                        activeSlide === index
                          ? 'w-10 bg-white'
                          : 'w-5 bg-white/35'
                      }`}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-white/15"
                    aria-label="Slide sebelumnya"
                  >
                    <ArrowLeft size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-white/15"
                    aria-label="Slide berikutnya"
                  >
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
  id="tentang"
  className="bg-[#0d594b] py-12 sm:py-14 lg:py-16"
><div className="mx-auto grid max-w-[1280px] gap-8 px-6 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10">
          
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-200">
                {about.label}
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-[1.13] tracking-[-0.025em] text-white sm:text-4xl lg:text-[40px]">
                {about.title}
              </h2>
            </div>

            <div>
              <p className="max-w-xl text-[14px] leading-7 text-emerald-50/75">
                {about.paragraf_pertama}
              </p>

              <p className="mt-4 max-w-xl text-[14px] leading-7 text-emerald-100/60">
                {about.paragraf_kedua}
              </p>
            </div>
          </div>
        </section>

        <section
          id="bidang"
          className="bg-[#f4f6f3] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Struktur Bidang
                </p>

                <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-slate-900 sm:text-4xl lg:text-[46px]">
                  Bidang yang menjalankan roda organisasi
                </h2>
              </div>

              <p className="max-w-xl text-[15px] leading-8 text-slate-600 lg:justify-self-end">
                Enam bidang menjalankan fungsi organisasi, komunikasi,
                pembinaan nilai, kepanduan, logistik, dan pengkaderan.
                Masing-masing bidang bekerja sesuai perannya dan tetap
                terhubung dalam satu struktur HW UNIMUS.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {bidang.map((item, index) => (
                <article
                  key={item.id || item.number || item.nama}
                  className="group relative min-h-[360px] overflow-hidden rounded-[22px] bg-slate-900"
                >
                  <img
                    src={item.image_url || item.image || fallbackBidang[index % fallbackBidang.length].image}
                    alt={item.nama || item.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-[0.2em] text-emerald-300">
                        {String(item.urutan ?? index + 1).padStart(2, '0')}
                      </span>

                      <span className="h-px w-10 bg-white/35" />
                    </div>

                    <h3 className="text-xl font-semibold text-white">
                      {item.nama || item.title}
                    </h3>

                    <p className="mt-3 text-[13px] leading-6 text-white/65">
                      {item.deskripsi || item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-20">
              <div className="mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Bina Karya Mandiri
                </p>

                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-slate-900">
                  Ruang pengembangan minat dan kemandirian
                </h3>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {bkm.map((item, index) => (
                  <article key={item.id || item.nama} className="group relative min-h-[430px] overflow-hidden rounded-[24px] bg-slate-900">
                    <img
                      src={item.image_url || item.image || fallbackBkm[index % fallbackBkm.length].image_url}
                      alt={item.nama || item.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                        Bina Karya Mandiri
                      </p>

                      <h3 className="mt-3 text-2xl font-semibold text-white">
                        {item.nama || item.title}
                      </h3>

                      <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
                        {item.deskripsi || item.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="kegiatan"
          className="bg-white py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-10">
            <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Aktivitas HW UNIMUS
                </p>

                <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.025em] text-slate-900 sm:text-4xl lg:text-[46px]">
                  Pengalaman yang dibangun melalui kegiatan nyata
                </h2>
              </div>

              <p className="max-w-md text-[14px] leading-7 text-slate-600 lg:justify-self-end">
                Pendidikan, latihan, kepanduan, kegiatan sosial, dan
                pengembangan anggota menjadi bagian dari perjalanan kader
                HW UNIMUS.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              {kegiatan[0] && (
                <div className="group relative min-h-[500px] overflow-hidden rounded-[24px] bg-slate-100">
                  <img
                    src={kegiatan[0].image_url || kegiatan[0].image || fallbackKegiatan[0].image_url}
                    alt={kegiatan[0].title || 'Kegiatan HW UNIMUS'}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-emerald-200">Kegiatan</p>
                    <p className="mt-2 max-w-xl text-2xl font-semibold leading-8 text-white">
                      {kegiatan[0].caption || kegiatan[0].title}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid gap-5">
                {kegiatan.slice(1, 3).map((item, index) => (
                  <div key={item.id || item.title} className="relative min-h-[238px] overflow-hidden rounded-[24px] bg-slate-100">
                    <img
                      src={item.image_url || item.image || fallbackKegiatan[(index + 1) % fallbackKegiatan.length].image_url}
                      alt={item.title || 'Kegiatan HW UNIMUS'}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="logistik"
          className="bg-[#0d594b] py-20 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1280px] gap-12 px-6 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-200">
                Bidang Logistik
              </p>

              <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-white sm:text-4xl lg:text-[46px]">
                Pengelolaan operasional yang lebih tertata
              </h2>

              <p className="mt-6 max-w-lg text-[15px] leading-8 text-emerald-50/70">
                Sistem Informasi Logistik membantu pengurus dalam mencatat,
                memantau, dan mengelola kebutuhan operasional organisasi
                secara terstruktur.
              </p>

              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-semibold text-[#0d594b] transition hover:bg-emerald-50"
              >
                Akses Sistem
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <LogisticCard
                icon={<Boxes size={22} />}
                title="Inventaris"
                description="Pencatatan barang, jumlah, kondisi, lokasi, dan riwayat aset."
              />

              <LogisticCard
                icon={<PackageCheck size={22} />}
                title="Pendataan"
                description="Pendataan barang masuk dan pembaruan informasi inventaris."
              />

              <LogisticCard
                icon={<Building2 size={22} />}
                title="Ruang dan Mako"
                description="Pengelolaan ruang dan kebutuhan kegiatan operasional."
              />

              <LogisticCard
                icon={<ShieldCheck size={22} />}
                title="Pengadaan"
                description="Pencatatan kebutuhan barang, harga, sumber dana, dan pengadaan."
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-10">
            <div className="grid gap-8 border-y border-slate-200 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Sistem Informasi HW UNIMUS
                </p>

                <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.025em] text-slate-900">
                  Akses pengelolaan operasional dalam satu sistem
                </h2>

                <p className="mt-4 max-w-2xl text-[14px] leading-7 text-slate-600">
                  Sistem ditujukan untuk pengurus yang memiliki akun dan
                  kewenangan sesuai tugasnya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="inline-flex h-fit items-center justify-center gap-2 rounded-full bg-[#08785d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#06644e]"
              >
                Masuk Sistem
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="kontak"
        className="bg-[#082f29] text-white"
      >
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-14 sm:px-8 md:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo-hw-unimus.png"
                alt="Logo HW UNIMUS"
                className="h-11 w-11 object-contain"
              />

              <div>
                <p className="font-semibold">
                  HW UNIMUS
                </p>

                <p className="mt-1 text-sm text-emerald-100/55">
                  Kafilah Jenderal Soedirman
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-sm text-sm leading-7 text-emerald-100/55">
              Hizbul Wathan Universitas Muhammadiyah Semarang.
              Pandu Berkemajuan.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Navigasi
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm text-emerald-100/55">
              <button
                type="button"
                onClick={() => scrollToSection('tentang')}
                className="w-fit transition hover:text-white"
              >
                Tentang HW
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('bidang')}
                className="w-fit transition hover:text-white"
              >
                Bidang
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('kegiatan')}
                className="w-fit transition hover:text-white"
              >
                Kegiatan
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('logistik')}
                className="w-fit transition hover:text-white"
              >
                Logistik
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Akses Internal
            </p>

            <p className="mt-5 text-sm leading-7 text-emerald-100/55">
              Gunakan akun yang diberikan administrator untuk mengakses
              sistem informasi.
            </p>

            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-white"
            >
              Masuk Sistem
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-6 py-5 text-xs text-emerald-100/35 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <span>HW UNIMUS · Kafilah Jenderal Soedirman</span>
            <span>Sistem Informasi HW UNIMUS</span>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowLogin(false);
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-[24px] bg-white p-7 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Radio size={19} />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  Sistem Informasi
                </p>

                <p className="text-xs text-slate-500">
                  HW UNIMUS
                </p>
              </div>
            </div>

            <h2 className="mt-7 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              Masuk ke sistem
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Gunakan akun yang telah diberikan oleh administrator.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Username
                </label>

                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 transition focus:border-emerald-600 focus:bg-white focus:outline-none"
                  placeholder="Username"
                  autoFocus
                  required
                />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 transition focus:border-emerald-600 focus:bg-white focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#08785d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#06644e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LogisticCard({
  icon,
  title,
  description
}) {
  return (
    <div className="border-t border-white/20 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-emerald-200">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-7 text-emerald-50/60">
        {description}
      </p>
    </div>
  );
}