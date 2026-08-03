'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [remajaList, setRemajaList] = useState([])
  const [jadwalTemaList, setJadwalTemaList] = useState([])
  const [nextRoster, setNextRoster] = useState(null)
  const [loadingRoster, setLoadingRoster] = useState(true)

  // State untuk Countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isIbadahTime, setIsIbadahTime] = useState(false)

  useEffect(() => {
    fetchRemaja()
    fetchJadwalTema()
    fetchNextRoster()
  }, [])

  // Logika Hitung Mundur Real-Time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const day = now.getDay() // 0 = Minggu, ..., 6 = Sabtu
      const hour = now.getHours()
      const minute = now.getMinutes()

      let targetSaturday = new Date(now)
      const distanceToSaturday = (6 - day + 7) % 7

      targetSaturday.setDate(now.getDate() + distanceToSaturday)
      targetSaturday.setHours(15, 30, 0, 0)

      // Cek apakah hari ini Sabtu DAN waktunya di antara 15.30 s.d 23.59
      if (day === 6 && (hour > 15 || (hour === 15 && minute >= 30)) && (hour < 24)) {
        setIsIbadahTime(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      } else {
        setIsIbadahTime(false)

        if (day === 6 && (hour > 15 || (hour === 15 && minute >= 30))) {
          targetSaturday.setDate(targetSaturday.getDate() + 7)
        }

        const difference = targetSaturday.getTime() - now.getTime()

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24))
          const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
          const minutes = Math.floor((difference / 1000 / 60) % 60)
          const seconds = Math.floor((difference / 1000) % 60)

          setTimeLeft({ days, hours, minutes, seconds })
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  async function fetchRemaja() {
    const { data } = await supabase.from('remaja').select('*')
    if (data) setRemajaList(data)
  }

  async function fetchJadwalTema() {
    const { data } = await supabase.from('jadwal_tema').select('*').order('tanggal_sabtu', { ascending: true })
    if (data) setJadwalTemaList(data)
  }

  async function fetchNextRoster() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('roster_penatalayanan')
        .select('*')
        .gte('tanggal_sabtu', today)
        .order('tanggal_sabtu', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Gagal memuat jadwal roster:', error.message)
      } else if (data && data.length > 0) {
        setNextRoster(data[0])
      }
    } catch (err) {
      console.error('Terjadi kesalahan:', err)
    } finally {
      setLoadingRoster(false)
    }
  }

  // Logika Tanggal Sabtu Terdekat untuk Tema
  const today = new Date()
  const dayOfWeek = today.getDay()
  const distanceToSaturday = (6 - dayOfWeek + 7) % 7
  const targetSaturday = new Date(today)
  targetSaturday.setDate(today.getDate() + distanceToSaturday)
  const formatTargetSabtu = targetSaturday.toISOString().split('T')[0]
  const temaSabtuIni = jadwalTemaList.find((item) => item.tanggal_sabtu === formatTargetSabtu)

  // Notifikasi Ulang Tahun Bulan Ini
  const currentMonthIndex = new Date().getMonth() + 1
  const namaBulanList = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const namaBulanAktif = namaBulanList[currentMonthIndex]

  const ulgTahunBulanIni = remajaList.filter((item) => {
    if (!item.tanggal_lahir) return false
    const parts = item.tanggal_lahir.split('-')
    if (parts.length === 3) {
      return parseInt(parts[1], 10) === currentMonthIndex
    }
    return false
  })

  return (
    <main className="max-w-7xl mx-auto p-5 md:p-12 space-y-7">

      {/* Header Dashboard */}
      <div className="reveal card-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✝️</span>
          <div>
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                backgroundImage: 'linear-gradient(90deg, #6B4FBB, #B4862F)',
              }}
            >
              Portal Remaja GKC
            </h1>
            <p className="text-gray-500 text-sm">Selamat datang di pusat informasi dan pelayanan remaja.</p>
          </div>
        </div>
      </div>

      {/* COUNTDOWN IBADAH REMAJA */}
      <div className="reveal delay-1 relative overflow-hidden text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6"
        style={{
          background: 'linear-gradient(120deg, #1B1140 0%, #2B1B63 45%, #3A2472 100%)',
          border: '1px solid rgba(244,211,94,.25)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <span className="star" style={{ top: '18%', left: '10%' }} />
          <span className="star" style={{ top: '65%', left: '28%', animationDelay: '.5s' }} />
          <span className="star" style={{ top: '30%', left: '85%', animationDelay: '1s' }} />
        </div>
        <div className="shimmer-line-abs" />

        <div className="space-y-1 text-center md:text-left relative">
          <span className="badge-gold text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Hitung Mundur Ibadah
          </span>
          <h2 className="text-xl font-bold mt-2">⏳ Menuju Ibadah Remaja Sabtu Pukul 15.30</h2>
          <p className="text-xs text-amber-100/60">Persiapkan hati dan diri kita untuk melayani serta memuji Tuhan bersama.</p>
        </div>

        <div className="relative">
          {isIbadahTime ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-6 py-4 rounded-xl text-center backdrop-blur-md">
              <p className="font-bold text-sm">🎉 Ibadah Remaja Sedang / Telah Berlangsung!</p>
              <p className="text-xs text-emerald-100/80 mt-1">Hitung mundur akan aktif kembali hari Sabtu pukul 23.59.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="digit-box px-3 py-2 rounded-lg">
                <span className="text-xl font-extrabold digit-num">{timeLeft.days}</span>
                <span className="block text-[10px] text-amber-100/60 uppercase tracking-wider">Hari</span>
              </div>
              <div className="digit-box px-3 py-2 rounded-lg">
                <span className="text-xl font-extrabold digit-num">{timeLeft.hours}</span>
                <span className="block text-[10px] text-amber-100/60 uppercase tracking-wider">Jam</span>
              </div>
              <div className="digit-box px-3 py-2 rounded-lg">
                <span className="text-xl font-extrabold digit-num">{timeLeft.minutes}</span>
                <span className="block text-[10px] text-amber-100/60 uppercase tracking-wider">Menit</span>
              </div>
              <div className="digit-box px-3 py-2 rounded-lg">
                <span className="text-xl font-extrabold digit-num">{timeLeft.seconds}</span>
                <span className="block text-[10px] text-amber-100/60 uppercase tracking-wider">Detik</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KOTAK PETUGAS PELAYANAN / ROSTER TERDEKAT */}
      <div className="reveal delay-2 card-glass p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Jadwal Petugas</span>
            <h2
              className="text-xl font-bold text-gray-800 mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              👥 Petugas Pelayan Ibadah Terdekat
            </h2>
          </div>
          {!loadingRoster && nextRoster && (
            <span className="btn-gold text-xs font-semibold px-3 py-1.5 rounded-lg">
              Sabtu, {nextRoster.tanggal_sabtu}
            </span>
          )}
        </div>

        {loadingRoster ? (
          <p className="text-xs text-gray-500 italic py-4">Memuat data petugas...</p>
        ) : nextRoster ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            <div className="petugas-box p-3 rounded-lg text-xs">
              <span className="text-amber-700/60 block mb-1">📜 Liturgos</span>
              <span className="font-semibold text-gray-800">{nextRoster.liturgos || '-'}</span>
            </div>
            <div className="petugas-box p-3 rounded-lg text-xs">
              <span className="text-amber-700/60 block mb-1">👥 Usher & Kolektan</span>
              <span className="font-semibold text-gray-800">{nextRoster.usher_kolektan || '-'}</span>
            </div>
            <div className="petugas-box p-3 rounded-lg text-xs">
              <span className="text-amber-700/60 block mb-1">🙏 Doa Syafaat</span>
              <span className="font-semibold text-gray-800">{nextRoster.doa_syafaat || '-'}</span>
            </div>
            <div className="petugas-box p-3 rounded-lg text-xs">
              <span className="text-amber-700/60 block mb-1">📢 Warta</span>
              <span className="font-semibold text-gray-800">{nextRoster.warta || '-'}</span>
            </div>
            <div className="petugas-box p-3 rounded-lg text-xs">
              <span className="text-amber-700/60 block mb-1">💻 Multimedia</span>
              <span className="font-semibold text-gray-800">{nextRoster.multimedia || '-'}</span>
            </div>
            <div className="petugas-box p-3 rounded-lg text-xs">
              <span className="text-amber-700/60 block mb-1">🤝 Pendamping</span>
              <span className="font-semibold text-gray-800">{nextRoster.pendamping || '-'}</span>
            </div>
            <div className="petugas-box p-3 rounded-lg text-xs sm:col-span-2">
              <span className="text-amber-700/60 block mb-1">🎸 Tim Musik</span>
              <span className="font-semibold text-gray-800">{nextRoster.tim_musik || '-'}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic py-4">Belum ada roster pelayanan terdekat yang diatur oleh Admin.</p>
        )}

        <div className="pt-2 flex justify-end">
          <a
            href="/roster"
            className="text-xs font-semibold link-gold transition"
          >
            Lihat Semua Jadwal Roster &rarr;
          </a>
        </div>
      </div>

      {/* Grid: Wajib Pendataan & Tema Sabtu Terdekat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Kotak 1: Wajib Pendataan Remaja */}
        <div className="reveal delay-3 tilt-card text-white p-6 rounded-2xl shadow-md flex flex-col justify-between space-y-4"
          style={{ background: 'linear-gradient(135deg, #2B1B63, #4A2E8C 60%, #5C3A9E)' }}
        >
          <div className="space-y-2">
            <span className="badge-gold text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Informasi Penting</span>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>📝 Wajib Melakukan Pendataan Remaja</h2>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Setiap rekan-rekan remaja diwajibkan untuk mengisi dan memperbarui data diri (Nama, Alamat, Asal Sekolah, dan Tanggal Lahir) melalui menu Pendataan Remaja agar tercatat dalam sistem gereja.
            </p>
          </div>
          <a
            href="/remaja"
            className="btn-gold inline-block text-xs font-bold py-2.5 px-4 rounded-lg text-center"
          >
            Buka Form Pendataan Remaja &rarr;
          </a>
        </div>

        {/* Kotak 2: Tema Sabtu yang Akan Datang (Otomatis) */}
        <div className="reveal delay-4 tilt-card text-white p-6 rounded-2xl shadow-md flex flex-col justify-between space-y-4"
          style={{ background: 'linear-gradient(135deg, #3A2472, #6B3FA0 60%, #8347B0)' }}
        >
          <div className="space-y-2">
            <span className="badge-gold text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Tema Ibadah Mendatang</span>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>📅 Sabtu, {formatTargetSabtu}</h2>
            {temaSabtuIni ? (
              <div className="space-y-1 mt-2">
                <p className="text-sm font-semibold text-amber-200">Tema: "{temaSabtuIni.tema}"</p>
                <p className="text-xs text-purple-100"><b>Tujuan:</b> {temaSabtuIni.tujuan}</p>
              </div>
            ) : (
              <p className="text-xs text-purple-200 italic mt-2">
                Tema untuk Sabtu ini belum diinput oleh Admin melalui menu Jadwal Tema.
              </p>
            )}
          </div>
          <a
            href="/tema"
            className="btn-gold inline-block text-xs font-bold py-2.5 px-4 rounded-lg text-center"
          >
            Lihat Semua Jadwal Tema &rarr;
          </a>
        </div>

      </div>

      {/* NOTIFIKASI ULANG TAHUN REMAJA BULAN INI */}
      <div className="reveal delay-5 relative overflow-hidden text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4"
        style={{ background: 'linear-gradient(120deg, #B4862F, #D4AF37 45%, #E0A93A)' }}
      >
        <div className="pointer-events-none absolute inset-0">
          <span className="confetti" style={{ left: '8%', animationDelay: '0s' }}>🎈</span>
          <span className="confetti" style={{ left: '38%', animationDelay: '.8s' }}>✨</span>
          <span className="confetti" style={{ left: '70%', animationDelay: '1.4s' }}>🎈</span>
          <span className="confetti" style={{ left: '90%', animationDelay: '.4s' }}>✨</span>
        </div>
        <div className="space-y-1 relative">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px' }}>
            🎂 Selamat Ulang Tahun untuk Remaja Bulan {namaBulanAktif}!
          </h2>
          <p className="text-xs text-amber-50/90">Mari dukung dan doakan rekan-rekan remaja yang berulang tahun pada bulan ini.</p>
        </div>
        <div className="bg-white/15 backdrop-blur-md p-3 rounded-lg border border-white/25 w-full md:w-auto min-w-[280px] relative">
          {ulgTahunBulanIni.length > 0 ? (
            <ul className="space-y-1 text-xs">
              {ulgTahunBulanIni.map((m) => (
                <li key={m.id} className="flex justify-between gap-4 font-medium">
                  <span>🎉 {m.nama_lengkap}</span>
                  <span className="text-amber-50/80">{m.tanggal_lahir}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-50/90 italic text-center">Belum ada data remaja yang berulang tahun bulan ini.</p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .card-glass {
          background: rgba(255,255,255,.85);
          border: 1px solid rgba(212,175,55,.25);
          box-shadow: 0 8px 24px rgba(90,60,150,.08);
        }

        .badge-gold {
          color: #241246;
          background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A);
        }
        .badge-soft {
          color: #6B4FBB;
          background: #F1EBFB;
        }

        .btn-gold {
          color: #241246;
          background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A);
          box-shadow: 0 2px 10px rgba(233,180,76,.4);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .btn-gold:hover {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 6px 16px rgba(233,180,76,.5);
        }

        .link-gold {
          color: #B4862F;
        }
        .link-gold:hover {
          color: #8A6420;
        }

        .digit-box {
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(244,211,94,.25);
          transition: transform .15s ease;
        }
        .digit-box:hover { transform: translateY(-2px); }
        .digit-num {
          color: #F4D35E;
          display: inline-block;
          animation: digitPop .5s ease;
        }
        @keyframes digitPop {
          0% { transform: translateY(-4px); opacity: .4; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .petugas-box {
          background: #FBF6EA;
          border: 1px solid rgba(212,175,55,.25);
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .petugas-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(180,134,47,.15);
        }

        .tilt-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .tilt-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(60,30,110,.25);
        }

        .star {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: #F4D35E;
          box-shadow: 0 0 6px 1px #F4D35E;
          animation: twinkleDash 2.6s ease-in-out infinite;
        }
        @keyframes twinkleDash {
          0%, 100% { opacity: .15; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        .shimmer-line-abs {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #F4D35E, #FFF3C4, #F4D35E, transparent);
          background-size: 200% 100%;
          animation: shimmerDash 3.5s linear infinite;
        }
        @keyframes shimmerDash {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .confetti {
          position: absolute;
          top: -10%;
          font-size: 16px;
          opacity: .85;
          animation: confettiFall 4.5s linear infinite;
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: .9; }
          100% { transform: translateY(140px) rotate(200deg); opacity: 0; }
        }

        .reveal {
          animation: fadeUpDash .5s ease both;
        }
        .delay-1 { animation-delay: .05s; }
        .delay-2 { animation-delay: .1s; }
        .delay-3 { animation-delay: .15s; }
        .delay-4 { animation-delay: .18s; }
        .delay-5 { animation-delay: .22s; }
        @keyframes fadeUpDash {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .star, .shimmer-line-abs, .confetti, .digit-num, .reveal, .tilt-card, .digit-box, .petugas-box, .btn-gold {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}