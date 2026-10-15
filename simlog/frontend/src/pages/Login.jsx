import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Facebook,
  Instagram,
  Loader2,
  Mail,
  Menu,
  Radio,
  Youtube,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { fallbackBidangImages, fallbackBkmImages, fallbackUnitImage } from '../constants/homepageImages';

const imageSrc = (value) => {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return value.startsWith('/') ? value : `/${value}`;
};

const imageStyle = (image) => {
  const defaultY = image?.image_position === 'top' ? 0 : image?.image_position === 'bottom' ? 100 : 50;
  const imageY = image?.image_y === undefined || image?.image_y === null
    ? defaultY
    : Number(image.image_y) === 50 && image.image_position === 'top'
      ? 0
      : Number(image.image_y) === 50 && image.image_position === 'bottom'
        ? 100
        : image.image_y;
  return {
    objectPosition: `${image?.image_x ?? 50}% ${imageY}%`,
    transform: `scale(${image?.image_zoom ?? 1})`,
    transformOrigin: 'center',
  };
};

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [homepageData, setHomepageData] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const newsTrackRef = useRef(null);
  const newsDragRef = useRef(null);

  function scrollNews(direction) {
    newsTrackRef.current?.scrollBy({
      left: direction * newsTrackRef.current.clientWidth * 0.82,
      behavior: 'smooth',
    });
  }

  function startNewsDrag(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    newsDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
  }

  function moveNewsDrag(event) {
    const drag = newsDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 5) drag.moved = true;
    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
  }

  function endNewsDrag(event) {
    const drag = newsDragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function preventNewsClickAfterDrag(event) {
    if (!newsDragRef.current?.moved) return;
    event.preventDefault();
    event.stopPropagation();
    newsDragRef.current = null;
  }

  const fallbackSlides = [
    {
      image: 'DIKLAT ANGGOTA.jpg',
      label: 'Kafilah Jenderal Soedirman',
      title: 'Membangun kader yang tangguh dan berkemajuan',
      description:
        'HW UNIMUS menjadi ruang pengembangan kepanduan, kepemimpinan, pengabdian, serta keterampilan mahasiswa dalam lingkungan yang aktif, disiplin, dan terarah.'
    },
    {
      image: fallbackBidangImages[0],
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
      image: fallbackBidangImages[1],
      description:
        'Mengelola informasi, publikasi, dokumentasi, media, dan komunikasi HW UNIMUS.'
    },
    {
      number: '03',
      title: 'Bidang AIK',
      image: fallbackBidangImages[2],
      description:
        'Menguatkan nilai Al-Islam dan Kemuhammadiyahan dalam kegiatan serta kehidupan kader.'
    },
    {
      number: '04',
      title: 'Bidang Kepanduan',
      image: fallbackBidangImages[3],
      description:
        'Mengembangkan keterampilan kepanduan, kemampuan lapangan, kedisiplinan, dan kerja sama.'
    },
    {
      number: '05',
      title: 'Bidang Logistik',
      image: fallbackBidangImages[4],
      description:
        'Mengelola inventaris, sarana, pengadaan, ruang, serta kebutuhan operasional organisasi.'
    },
    {
      number: '06',
      title: 'Bidang Pengkaderan',
      image: fallbackBidangImages[5],
      description:
        'Mengelola penerimaan, pembinaan, pendidikan, dan pengembangan anggota HW UNIMUS.'
    }
  ];

  const bidang = homepageData?.bidang?.length ? homepageData.bidang : fallbackBidang;
  const fallbackBkm = [
    {
      nama: 'BKM Kesenian',
      image_url: fallbackBkmImages[0],
      deskripsi: 'Ruang pengembangan minat, bakat, kreativitas, dan kegiatan kesenian anggota HW UNIMUS.'
    },
    {
      nama: 'BKM Kewirausahaan',
      image_url: fallbackBkmImages[1],
      deskripsi: 'Mengembangkan kemampuan kewirausahaan dan kemandirian anggota melalui kegiatan produktif.'
    }
  ];
  const bkm = homepageData?.bkm?.length ? homepageData.bkm : fallbackBkm;
  const fallbackBph = [
    { jabatan: 'ketua_kafilah', nama: '', image_url: 'BPH 2025-2026.jpeg' },
    { jabatan: 'sekretaris_kafilah', nama: '', image_url: 'BPH 2025-2026.jpeg' },
    { jabatan: 'bendahara_kafilah', nama: '', image_url: 'BPH 2025-2026.jpeg' },
  ];
  const bph = homepageData?.bph?.length ? homepageData.bph : fallbackBph;
  const bphTitles = {
    ketua_kafilah: 'Ketua Kafilah',
    sekretaris_kafilah: 'Sekretaris Kafilah',
    bendahara_kafilah: 'Bendahara Kafilah',
  };
  const unitCards = [...bidang, ...bkm]
    .sort((first, second) => Number(first.urutan || 0) - Number(second.urutan || 0));
  const fallbackKegiatan = [
    { image_url: 'DIKLAT ANGGOTA.jpg', title: 'Belajar melalui pengalaman dan kegiatan lapangan' },
    { image_url: 'pelantikan hw unimus.jpg', title: 'Kegiatan HW UNIMUS' },
    { image_url: 'BPH 2025-2026.jpeg', title: 'Aktivitas anggota HW UNIMUS' }
  ];
  const kegiatan = homepageData?.kegiatan?.length ? homepageData.kegiatan.slice(0, 3) : fallbackKegiatan;
  const berita = homepageData?.berita || [];
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

          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenu}
            aria-controls="homepage-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
          >
            {mobileMenu ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {mobileMenu && (
          <div id="homepage-navigation" className="absolute right-5 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:right-7 lg:right-10">
            <div className="flex flex-col divide-y divide-slate-100">
              <button
                type="button"
                onClick={() => scrollToSection('beranda')}
                className="py-3 text-left text-sm font-medium transition hover:text-emerald-800"
              >
                Beranda
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('tentang')}
                className="py-3 text-left text-sm font-medium transition hover:text-emerald-800"
              >
                Tentang
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('bidang')}
                className="py-3 text-left text-sm font-medium transition hover:text-emerald-800"
              >
                Bidang
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('kegiatan')}
                className="py-3 text-left text-sm font-medium transition hover:text-emerald-800"
              >
                Kegiatan
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('berita')}
                className="py-3 text-left text-sm font-medium transition hover:text-emerald-800"
              >
                Berita
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('kontak')}
                className="py-3 text-left text-sm font-medium transition hover:text-emerald-800"
              >
                Kontak
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/materi');
                  setMobileMenu(false);
                }}
                className="py-3 text-left text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              >
                Materi
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogin(true);
                  setMobileMenu(false);
                }}
                className="mt-3 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
                src={imageSrc(slide.image_url || slide.image || fallbackSlides[index % fallbackSlides.length].image)}
                alt={slide.title}
                style={imageStyle(slide)}
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

        <section id="berita" className="bg-[#f4f6f3] py-16 lg:py-20">
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-10">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Informasi Terbaru
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-slate-900 sm:text-4xl">
                  Berita HW UNIMUS
                </h2>
              </div>
              {berita.length > 1 && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => scrollNews(-1)}
                    aria-label="Berita sebelumnya"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollNews(1)}
                    aria-label="Berita berikutnya"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
            {berita.length ? (
              <div
                ref={newsTrackRef}
                onPointerDown={startNewsDrag}
                onPointerMove={moveNewsDrag}
                onPointerUp={endNewsDrag}
                onPointerCancel={endNewsDrag}
                onClickCapture={preventNewsClickAfterDrag}
                className="flex snap-x snap-mandatory cursor-grab select-none gap-6 overflow-x-auto scroll-smooth pb-4 active:cursor-grabbing"
                aria-label="Geser untuk melihat berita lainnya"
              >
                {berita.map((item) => (
                  <article
                    key={item.id}
                    className="grid min-h-[340px] w-[88%] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:w-[78%] lg:min-h-[390px] lg:w-[82%] lg:grid-cols-[0.9fr_1.1fr]"
                  >
                    <div className="relative min-h-56 overflow-hidden bg-slate-100 lg:min-h-full">
                      {item.image_url && (
                        <img
                          src={imageSrc(item.image_url)}
                          alt={item.title}
                          style={imageStyle(item)}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-start p-6 sm:p-8 lg:justify-center lg:p-10">
                      <span className="inline-flex rounded bg-emerald-700 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-white">
                        {item.kategori || 'PRESS RELEASE'}
                      </span>
                      <h3 className="mt-4 text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : ''}
                      </p>
                      <p className="mt-4 line-clamp-4 text-base leading-7 text-slate-600">
                        {item.ringkasan || item.isi || item.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedNews(item)}
                        className="mt-5 text-sm font-semibold text-emerald-800 hover:text-emerald-600"
                      >
                        Baca Berita
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada berita yang dipublikasikan.</p>
            )}
          </div>
        </section>

        <section
          id="bidang"
          className="bg-[#f4f6f3] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-10">
            <div className="mb-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Badan Pengurus Harian
                </p>

                <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-slate-900 sm:text-4xl lg:text-[46px]">
                  BPH (Badan Pengurus Harian)
                </h2>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {bph.map((item) => (
                  <article
                    key={item.id || item.jabatan}
                    className="group relative min-h-[380px] overflow-hidden rounded-[22px] bg-slate-900"
                  >
                    <img
                      src={imageSrc(item.image_url || 'BPH 2025-2026.jpeg')}
                      alt={item.nama || bphTitles[item.jabatan] || 'Pengurus BPH'}
                      style={imageStyle(item)}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="text-xl font-semibold text-white">
                        {item.nama || bphTitles[item.jabatan]}
                      </h3>
                      {item.nama && (
                        <p className="mt-2 text-sm font-medium text-emerald-200">
                          {bphTitles[item.jabatan]}
                        </p>
                      )}
                      {item.deskripsi && (
                        <p className="mt-3 text-[13px] leading-6 text-white/65">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                Struktur Organisasi
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-slate-900 sm:text-4xl lg:text-[46px]">
                Bidang dan Bina Karya Mandiri
              </h2>
              <p className="mt-5 max-w-3xl text-[15px] leading-8 text-slate-600">
                Bidang dan Bina Karya Mandiri (BKM) bergerak bersama dalam satu struktur untuk mendukung program dan kegiatan HW UNIMUS.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {unitCards.map((item) => (
                <article
                  key={item.id || item.nama}
                  className="group relative min-h-[360px] overflow-hidden rounded-[22px] bg-slate-900"
                >
                  <img
                    src={imageSrc(item.image_url || item.image || fallbackUnitImage(item.nama || item.title, item.jenis || 'bidang'))}
                    alt={item.nama || item.title}
                    style={imageStyle(item)}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
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
                    src={imageSrc(kegiatan[0].image_url || kegiatan[0].image || fallbackKegiatan[0].image_url)}
                    alt={kegiatan[0].title || 'Kegiatan HW UNIMUS'}
                    style={imageStyle(kegiatan[0])}
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
                      src={imageSrc(item.image_url || item.image || fallbackKegiatan[(index + 1) % fallbackKegiatan.length].image_url)}
                      alt={item.title || 'Kegiatan HW UNIMUS'}
                      style={imageStyle(item)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="news-title">
          <article className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white">
            <button
              type="button"
              onClick={() => setSelectedNews(null)}
              aria-label="Tutup berita"
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow"
            >
              <X size={18} />
            </button>
            {selectedNews.image_url && (
              <img src={imageSrc(selectedNews.image_url)} alt={selectedNews.title} style={imageStyle(selectedNews)} className="max-h-[360px] w-full object-cover" />
            )}
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{selectedNews.kategori || 'PRESS RELEASE'}</p>
              <h2 id="news-title" className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{selectedNews.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedNews.created_at && new Date(selectedNews.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {selectedNews.ringkasan && <p className="mt-5 font-medium leading-7 text-slate-700">{selectedNews.ringkasan}</p>}
              <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">{selectedNews.isi || selectedNews.ringkasan}</p>
            </div>
          </article>
        </div>
      )}

      <footer
        id="kontak"
        className="bg-[#082f29] text-white"
      >
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.7fr_0.8fr] lg:gap-12 lg:px-10">
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
              Official Account Kepanduan Hizbul Wathan Kafilah Jenderal
              Soedirman Universitas Muhammadiyah Semarang. Pandu Berkemajuan.
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
                onClick={() => scrollToSection('berita')}
                className="w-fit transition hover:text-white"
              >
                Berita
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
          <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-7 sm:px-8 lg:px-10">
            <p className="text-sm font-semibold">Ikuti Media Sosial</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="https://www.instagram.com/hw_unimus/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram HW UNIMUS"
                title="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center text-[#E4405F] transition hover:scale-110 hover:brightness-125"
              >
                <Instagram size={21} />
              </a>
              <a
                href="https://www.tiktok.com/@hw_unimus"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok HW UNIMUS"
                title="TikTok"
                className="inline-flex h-8 w-8 items-center justify-center text-[#25F4EE] drop-shadow-[1px_1px_0_#FE2C55] transition hover:scale-110 hover:brightness-125"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-[21px] w-[21px]"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.44v13.67a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .6.05.87.14V9.38a6.4 6.4 0 0 0-.87-.06A6.35 6.35 0 0 0 3.13 15.67 6.35 6.35 0 0 0 9.48 22a6.35 6.35 0 0 0 6.35-6.33V8.7a8.2 8.2 0 0 0 4.8 1.55V6.83a4.83 4.83 0 0 1-1.04-.14Z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/results?search_query=Hizbul+Wathan+Unimus"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube Hizbul Wathan Unimus"
                title="YouTube"
                className="inline-flex h-8 w-8 items-center justify-center text-[#FF0000] transition hover:scale-110 hover:brightness-125"
              >
                <Youtube size={22} />
              </a>
              <a
                href="https://www.facebook.com/search/pages/?q=Hizbul%20Wathan%20Unimus"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Hizbul Wathan Unimus"
                title="Facebook"
                className="inline-flex h-8 w-8 items-center justify-center text-[#1877F2] transition hover:scale-110 hover:brightness-125"
              >
                <Facebook size={21} />
              </a>
              <a
                href="mailto:ukmhizbulwathan@unimus.ac.id"
                className="inline-flex items-center gap-2.5 text-sm text-emerald-100/65 transition hover:text-white"
              >
                <Mail size={17} className="text-emerald-300" />
                ukmhizbulwathan@unimus.ac.id
              </a>
            </div>
            <p className="text-xs text-emerald-100/40">Official account · @hw_unimus</p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-6 py-5 text-xs text-emerald-100/35 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <span>HW UNIMUS · Kafilah Jenderal Soedirman</span>
            <span>© {new Date().getFullYear()} Rakanda Charly Agusta Cristiano</span>
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