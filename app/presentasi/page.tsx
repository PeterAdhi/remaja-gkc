'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface JadwalTemaItem {
  tema: string
  pembicara: string
  tanggal_sabtu: string
}

const AUTOPLAY_MS = 5000

interface LyricLayout {
  columns: string[]
  sizeClass: string
}

function getLyricLayout(content: string): LyricLayout {
  const lines = content.split('\n')
  const nonEmptyCount = lines.filter((l) => l.trim() !== '').length

  // Ukuran font diperbesar agar lebih mudah dibaca
  const sizeClass =
    nonEmptyCount <= 8
      ? 'text-2xl md:text-3xl leading-relaxed'
      : nonEmptyCount <= 16
      ? 'text-xl md:text-2xl leading-relaxed'
      : 'text-lg md:text-xl leading-snug'

  // Selalu kembalikan 1 kolom saja
  return {
    columns: [content],
    sizeClass,
  }
}

function CornerOrnament({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`ornament-corner ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 2H24" stroke="url(#ornGold)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 2V24" stroke="url(#ornGold)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 2C16 2 22 8 22 22" stroke="url(#ornGold)" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <circle cx="2" cy="2" r="2.5" fill="#F4D35E" />
      <defs>
        <linearGradient id="ornGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FCE9B0" />
          <stop offset="1" stopColor="#B8862F" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function PresentasiPage() {
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [showHint, setShowHint] = useState(true)
  const [temaData, setTemaData] = useState<JadwalTemaItem | null>(null)
  const [songs, setSongs] = useState<any[]>([])
  const [rosterNextWeek, setRosterNextWeek] = useState<any | null>(null)
  const [nextSaturdayFormatted, setNextSaturdayFormatted] = useState<string>('')
  const [slides, setSlides] = useState<any[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminRemaja')
    if (isAdmin !== 'true') {
      alert('Akses ditolak! Anda harus login sebagai admin terlebih dahulu.')
      router.push('/')
      return
    }
    const savedSelection = localStorage.getItem('selectedSlides')
    if (!savedSelection) {
      router.push('/presentasi/pilih')
      return
    }
    fetchData(JSON.parse(savedSelection))
  }, [router])

  // Listener untuk posisi pergerakan mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  async function fetchData(selectedIndices: number[]) {
    try {
      const today = new Date()
      const day = today.getDay()
      const diff = (6 - day + 7) % 7
      const nextSaturday = new Date(today)
      nextSaturday.setDate(today.getDate() + diff)
      const dateStr = nextSaturday.toISOString().split('T')[0]

      const followingSaturday = new Date(nextSaturday)
      followingSaturday.setDate(nextSaturday.getDate() + 7)
      const nextDateStr = followingSaturday.toISOString().split('T')[0]

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      const formattedDate = nextSaturday.toLocaleDateString('id-ID', options)
      setNextSaturdayFormatted(followingSaturday.toLocaleDateString('id-ID', options))

      const { data: tema } = await supabase
        .from('jadwal_tema')
        .select('tema, pembicara, tanggal_sabtu')
        .eq('tanggal_sabtu', dateStr)
        .maybeSingle()

      const activeTema = tema?.tema || 'Tema Belum Diatur'
      const activePembicara = tema?.pembicara || '-'

      const currentTemaData = {
        tema: activeTema,
        pembicara: activePembicara,
        tanggal_sabtu: formattedDate
      }
      setTemaData(currentTemaData)

      let formattedSongs: any[] = []
      const { data: pemilihanLagu } = await supabase
        .from('pemilihan_lagu')
        .select(`
          kategori,
          lagu:lagu_id (
            judul_lagu,
            lirik
          )
        `)
        .eq('tanggal_ibadah', dateStr)

      if (pemilihanLagu && pemilihanLagu.length > 0) {
        formattedSongs = pemilihanLagu.map((item: any) => {
          const songObj = Array.isArray(item.lagu) ? item.lagu[0] : item.lagu
          return {
            kategori: item.kategori,
            judul: songObj?.judul_lagu || null,
            lirik: songObj?.lirik || null
          }
        })
      }
      setSongs(formattedSongs)

      const { data: rosterNext } = await supabase
        .from('roster_penatalayanan')
        .select('*')
        .eq('tanggal_sabtu', nextDateStr)
        .maybeSingle()

      if (rosterNext) {
        setRosterNextWeek(rosterNext)
      }

      const getSongData = (categoryKeys: string[]) => {
        for (const key of categoryKeys) {
          const found = formattedSongs.find(s => s.kategori?.toLowerCase() === key.toLowerCase())
          if (found) return found
        }
        return { judul: null, lirik: null }
      }

      const createSongSlide = (defaultTitle: string, categoryKeys: string[]) => {
        const song = getSongData(categoryKeys)
        return {
          title: song.judul || defaultTitle,
          subtitle: defaultTitle,
          content: song.judul ? (song.lirik || 'Lirik belum tersedia') : 'Lagu belum dipilih'
        }
      }

      const formatRoster = (rosterObj: any) => {
        if (!rosterObj) return 'Roster penatalayanan belum diatur untuk tanggal ini.'
        return [
          `Liturgos: ${rosterObj.liturgos || '-'}`,
          `Usher & Kolektan: ${rosterObj.usher_kolektan || '-'}`,
          `Doa Syafaat: ${rosterObj.doa_syafaat || '-'}`,
          `Warta: ${rosterObj.warta || '-'}`,
          `Multimedia: ${rosterObj.multimedia || '-'}`,
          `Pendamping: ${rosterObj.pendamping || '-'}`
        ].join('\n')
      }

      const masterSlides = [
        {
          title: activeTema,
          subtitle: 'Persekutuan RGKC',
          content: `Pembicara: ${activePembicara}`
        },
        { title: 'Saat Teduh', subtitle: '', content: '' },
        createSongSlide('Lagu Pembuka', ['pembuka', 'pembukaan']),
        { title: 'Doa Pembuka', subtitle: '', content: '' },
        createSongSlide('Lagu Pujian', ['pujian_1', 'pujian']),
        { title: 'Pembacaan Alkitab', subtitle: '', content: '' },
        createSongSlide('Lagu Pengantar Firman', ['pengantar_firman']),
        { title: 'Firman Tuhan', subtitle: '', content: '' },
        createSongSlide('Lagu Pengantar Doa Syafaat', ['pengantar_doa_syafaat']),
        { title: 'Doa Syafaat', subtitle: '', content: '' },
        createSongSlide('Lagu Persembahan', ['persembahan']),
        { title: 'Doa Persembahan', subtitle: '', content: '' },
        createSongSlide('Lagu Pujian', ['pujian_2']),
        { title: 'Doa Penutup & Berkat', subtitle: '', content: '' },
        createSongSlide('Lagu Doxologi', ['doksologi']),
        { title: 'Saat Teduh', subtitle: '', content: '' },
        { title: 'Warta', subtitle: 'Informasi', content: 'Warta Remaja GKC' },
        {
          title: 'Pemberitaan Firman Tuhan',
          subtitle: 'Terima Kasih Pelayanannya',
          content: `Pemberitaan Firman Tuhan pada hari ini\n${formattedDate} dilayani oleh\n${activePembicara}\n\nAtas pelayanannya, kami\nmengucapkan terima kasih,\nTuhan Yesus memberkati.`
        },
        {
          title: 'Roster Penatalayanan Sabtu Depan',
          subtitle: followingSaturday.toLocaleDateString('id-ID', options) || 'Sabtu Depan',
          content: formatRoster(rosterNext)
        },
      ]

      const filtered = masterSlides.filter((_, index) => selectedIndices.includes(index))
      setSlides(filtered)

    } catch (error) {
      console.error("Gagal mengambil data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        alert(`Gagal masuk mode fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4500)
    return () => clearTimeout(t)
  }, [])

  const goNext = () => {
    setDirection('next')
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  }
  const goPrev = () => {
    setDirection('prev')
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }
  const goTo = (index: number) => {
    setDirection(index > currentSlide ? 'next' : 'prev')
    setCurrentSlide(index)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (slides.length === 0) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setShowHint(false)
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setShowHint(false)
        goPrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, currentSlide])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 50) {
      setIsPlaying(false)
      setShowHint(false)
      if (diff < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && slides.length > 0) {
      interval = setInterval(() => {
        setDirection('next')
        setCurrentSlide((prev) => {
          if (prev === slides.length - 1) return 0
          return prev + 1
        })
      }, AUTOPLAY_MS)
    }
    return () => clearInterval(interval)
  }, [isPlaying, slides.length])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0824] text-amber-200 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <span className="star" style={{ top: '20%', left: '15%' }} />
          <span className="star" style={{ top: '60%', left: '30%', animationDelay: '.6s' }} />
          <span className="star" style={{ top: '35%', left: '70%', animationDelay: '1.1s' }} />
          <span className="star" style={{ top: '75%', left: '85%', animationDelay: '.3s' }} />
        </div>
        <div className="text-center space-y-4 relative">
          <div className="w-10 h-10 border-[3px] border-amber-300/30 border-t-amber-300 rounded-full animate-spin mx-auto" />
          <p className="text-[11px] tracking-[0.3em] uppercase text-amber-200/80 font-medium">Memuat presentasi&hellip;</p>
        </div>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700;800&display=swap');
          @keyframes twinkle {
            0%, 100% { opacity: .15; transform: scale(.8); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          .star {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 9999px;
            background: #F4D35E;
            box-shadow: 0 0 6px 1px #F4D35E;
            animation: twinkle 2.6s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  const slide = slides[currentSlide] || { title: '', subtitle: '', content: '' }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-[calc(100vh-70px)] flex flex-col justify-between p-6 md:p-12 text-amber-50 relative overflow-y-auto stage-bg ${
        isFullscreen ? 'cursor-none' : ''
      }`}
    >
      {/* Elemen Kustom Kursor Titik Emas (Hanya tampil saat Fullscreen) */}
      {isFullscreen && (
        <div
          className="cursor-follower is-active"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        />
      )}

      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5 z-20">
        {isPlaying && (
          <div
            key={`${currentSlide}-${isPlaying}`}
            className="h-full autoplay-bar"
            style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
          />
        )}
      </div>

      <div className="grain-overlay" />

      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7A2048]/20 rounded-full blur-3xl orb orb-a" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl orb orb-b" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-[#3B2172]/25 rounded-full blur-3xl orb orb-c" />
      </div>
      <div className="vignette pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <span className="star" style={{ top: '12%', left: '10%', animationDelay: '0s' }} />
        <span className="star" style={{ top: '22%', left: '88%', animationDelay: '.6s' }} />
        <span className="star" style={{ top: '80%', left: '18%', animationDelay: '1.1s' }} />
        <span className="star" style={{ top: '68%', left: '92%', animationDelay: '.3s' }} />
        <span className="star" style={{ top: '90%', left: '55%', animationDelay: '.9s' }} />
        <span className="star" style={{ top: '8%', left: '48%', animationDelay: '1.4s' }} />
      </div>

      {!isFullscreen && (
        <div className="max-w-5xl w-full mx-auto flex justify-between items-center relative z-10 border-b border-amber-200/15 pb-4 header-bar">
          <div className="flex items-center gap-3">
            <div className="brand-mark hidden sm:flex" aria-hidden="true">✦</div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-amber-300/70 font-semibold ui-sans">
                Mode Presentasi Admin
              </span>
              <h1 className="text-lg md:text-xl font-semibold gold-foil-text tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Remaja GKC
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/presentasi/pilih')}
              className="btn-interactive ui-sans text-[11px] font-semibold px-3.5 py-1.5 rounded-full border border-amber-200/25 bg-white/[0.04] text-amber-200/90 hover:bg-white/[0.08] hover:border-amber-200/40 transition tracking-wide"
              title="Ubah Pilihan Slide"
            >
              ⚙ Pilih Ulang
            </button>

            <button
              onClick={toggleFullscreen}
              className="btn-interactive btn-gold-outline ui-sans text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 tracking-wide"
              title="Tampilkan Fullscreen (Layar Penuh)"
            >
              {isFullscreen ? '⤫ Keluar Fullscreen' : '⛶ Fullscreen'}
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`btn-interactive ui-sans text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition flex items-center gap-1.5 tracking-wide ${
                isPlaying
                  ? 'bg-amber-400/15 text-amber-200 border-amber-300/50 playing-pulse'
                  : 'bg-white/[0.04] text-amber-100/70 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              {isPlaying ? '⏸ Jeda' : '▶ Putar'}
            </button>

            <div className="text-[11px] ui-sans font-medium bg-white/[0.04] border border-amber-200/20 px-3 py-1.5 rounded-full text-amber-200/90 hidden sm:block tabular-nums tracking-wide">
              {currentSlide + 1} <span className="text-amber-200/40">/</span> {slides.length}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto my-auto py-8 relative z-10 text-center overflow-hidden">
        <div
          key={currentSlide}
          className={`space-y-5 ${direction === 'next' ? 'slide-in-next' : 'slide-in-prev'}`}
        >
          <div className="space-y-2.5">
            {slide.subtitle && (
              <span className="text-[11px] md:text-xs text-amber-300/85 font-semibold tracking-[0.32em] block uppercase fade-item ui-sans" style={{ animationDelay: '.05s' }}>
                {slide.subtitle}
              </span>
            )}
            <h2
              className="text-3xl md:text-5xl font-semibold gold-foil-text tracking-tight leading-[1.15] fade-item px-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", animationDelay: '.12s' }}
            >
              {slide.title}
            </h2>
            <div className="flex items-center justify-center gap-3 fade-item" style={{ animationDelay: '.16s' }}>
              <span className="divider-line" />
              <span className="divider-gem" aria-hidden="true" />
              <span className="divider-line" />
            </div>
          </div>

          {slide.content && (() => {
            const lyricLayout = getLyricLayout(slide.content)
            return (
              <div
                className="relative mx-auto p-7 md:p-9 fade-item gilded-card max-w-3xl"
                style={{ animationDelay: '.22s' }}
              >
                <CornerOrnament className="corner-tl" />
                <CornerOrnament className="corner-tr" />
                <CornerOrnament className="corner-bl" />
                <CornerOrnament className="corner-br" />
                <div className="lyric-scroll max-h-[48vh] md:max-h-[54vh] overflow-y-auto pr-1">
                  {lyricLayout.columns.map((col, i) => (
                    <p
                      key={i}
                      className={`text-amber-50/95 whitespace-pre-line text-center ${lyricLayout.sizeClass}`}
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {col}
                    </p>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {!isFullscreen && (
        <div className="max-w-5xl w-full mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-4 relative z-10 border-t border-amber-200/15 pt-4 footer-bar">
          <button
            onClick={() => { goPrev(); setIsPlaying(false) }}
            disabled={currentSlide === 0}
            className={`btn-interactive ui-sans px-4 py-2 text-xs font-semibold rounded-full border transition tracking-wide ${
              currentSlide === 0
                ? 'opacity-35 cursor-not-allowed border-white/10 bg-transparent text-gray-400'
                : 'border-amber-200/30 bg-white/[0.04] text-amber-100 hover:bg-white/[0.08] hover:border-amber-200/50'
            }`}
          >
            &larr; Sebelumnya
          </button>

          <div className="flex gap-1.5 overflow-x-auto max-w-md py-1">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { goTo(index); setIsPlaying(false) }}
                className={`dot-indicator h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'bg-gradient-to-r from-[#FCE38A] to-[#D4AF37] w-6 dot-active' : 'bg-white/20 hover:bg-white/50 w-2'
                }`}
                aria-label={`Loncat ke slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => { goNext(); setIsPlaying(false) }}
            disabled={currentSlide === slides.length - 1}
            className={`btn-interactive ui-sans px-5 py-2 text-xs font-semibold rounded-full transition tracking-wide ${
              currentSlide === slides.length - 1
                ? 'opacity-35 cursor-not-allowed border border-white/10 bg-transparent text-gray-400'
                : 'text-[#241246] btn-gold-solid'
            }`}
          >
            Selanjutnya &rarr;
          </button>
        </div>
      )}

      <div className={`keyboard-hint ui-sans ${showHint ? 'keyboard-hint-show' : ''}`}>
        Gunakan ← → atau spasi untuk berpindah slide, atau geser layar
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700;800&display=swap');

        .ui-sans { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }

        .stage-bg {
          background:
            radial-gradient(120% 90% at 50% -10%, #241350 0%, transparent 55%),
            linear-gradient(180deg, #150B33 0%, #0F0824 60%, #0B061C 100%);
        }

        .vignette {
          background: radial-gradient(120% 100% at 50% 50%, transparent 45%, rgba(6,3,18,0.55) 100%);
        }

        .grain-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.05;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          z-index: 5;
        }

        .brand-mark {
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 1px solid rgba(244,211,94,0.35);
          color: #F4D35E;
          font-size: 13px;
          background: radial-gradient(circle at 30% 30%, rgba(244,211,94,0.18), transparent 70%);
        }

        .gold-foil-text {
          background: linear-gradient(180deg, #FCE9B0 0%, #F0CB6E 42%, #C89A3C 68%, #F4D35E 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 1px 12px rgba(244,211,94,0.18));
        }

        .divider-line {
          width: 34px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(244,211,94,0.55));
        }
        .divider-line:last-child {
          background: linear-gradient(90deg, rgba(244,211,94,0.55), transparent);
        }
        .divider-gem {
          width: 6px;
          height: 6px;
          background: #F4D35E;
          transform: rotate(45deg);
          box-shadow: 0 0 8px rgba(244,211,94,0.7);
          flex-shrink: 0;
        }

        .gilded-card {
          background: linear-gradient(165deg, rgba(46,27,100,0.6), rgba(26,15,64,0.72));
          border: 1px solid rgba(244,211,94,0.22);
          border-radius: 1.25rem;
          box-shadow:
            0 24px 60px -20px rgba(0,0,0,0.65),
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 0 0 1px rgba(244,211,94,0.04);
          backdrop-filter: blur(14px);
        }

        .ornament-corner {
          position: absolute;
          width: 26px;
          height: 26px;
          opacity: 0.85;
        }
        .corner-tl { top: -1px; left: -1px; }
        .corner-tr { top: -1px; right: -1px; transform: scaleX(-1); }
        .corner-bl { bottom: -1px; left: -1px; transform: scaleY(-1); }
        .corner-br { bottom: -1px; right: -1px; transform: scale(-1, -1); }

        .btn-gold-outline {
          color: #F6DE9C;
          background: linear-gradient(180deg, rgba(244,211,94,0.14), rgba(244,211,94,0.05));
          border: 1px solid rgba(244,211,94,0.4);
        }
        .btn-gold-outline:hover {
          background: linear-gradient(180deg, rgba(244,211,94,0.22), rgba(244,211,94,0.08));
          border-color: rgba(244,211,94,0.6);
        }

        .btn-gold-solid {
          background: linear-gradient(180deg, #FCE38A 0%, #F4D35E 45%, #D4A93A 100%);
          box-shadow: 0 8px 22px -6px rgba(212,169,58,0.55);
        }
        .btn-gold-solid:hover {
          filter: brightness(1.06);
        }

        @keyframes twinkle {
          0%, 100% { opacity: .15; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .star {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: #F4D35E;
          box-shadow: 0 0 6px 1px #F4D35E;
          animation: twinkle 2.6s ease-in-out infinite;
        }

        @keyframes orbFloatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes orbFloatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 25px) scale(1.1); }
        }
        @keyframes orbFloatC {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.12) rotate(8deg); }
        }
        .orb-a { animation: orbFloatA 9s ease-in-out infinite; }
        .orb-b { animation: orbFloatB 11s ease-in-out infinite; }
        .orb-c { animation: orbFloatC 14s ease-in-out infinite; }

        @keyframes barShrink {
          from { width: 0%; }
          to { width: 100%; }
        }
        .autoplay-bar {
          background: linear-gradient(90deg, #F4D35E, #FFF3C4);
          box-shadow: 0 0 8px rgba(244,211,94,.6);
          animation-name: barShrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes slideInFromRight {
          0% { opacity: 0; transform: translateX(40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          0% { opacity: 0; transform: translateX(-40px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .slide-in-next { animation: slideInFromRight .45s cubic-bezier(.2,.8,.2,1) both; }
        .slide-in-prev { animation: slideInFromLeft .45s cubic-bezier(.2,.8,.2,1) both; }

        @keyframes fadeItemIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-item {
          animation: fadeItemIn .5s ease both;
        }

        .btn-interactive {
          transition: transform .15s ease, background .15s ease, box-shadow .15s ease, border-color .15s ease;
        }
        .btn-interactive:hover {
          transform: translateY(-1px);
        }
        .btn-interactive:active {
          transform: translateY(0) scale(.96);
        }

        @keyframes playingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244,211,94,.4); }
          50% { box-shadow: 0 0 0 5px rgba(244,211,94,0); }
        }
        .playing-pulse {
          animation: playingPulse 1.6s ease-in-out infinite;
        }

        .dot-indicator {
          transition: width .3s ease, background .2s ease, transform .15s ease;
        }
        .dot-indicator:hover {
          transform: scaleY(1.3);
        }
        .dot-active {
          box-shadow: 0 0 8px rgba(244,211,94,.7);
        }

        .keyboard-hint {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translate(-50%, 12px);
          background: rgba(15,8,36,.88);
          border: 1px solid rgba(244,211,94,.28);
          color: #FCE9B0;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 8px 16px;
          border-radius: 9999px;
          opacity: 0;
          pointer-events: none;
          transition: opacity .4s ease, transform .4s ease;
          backdrop-filter: blur(6px);
          z-index: 40;
          white-space: nowrap;
        }
        .keyboard-hint-show {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        /* Styling CSS untuk Kustom Kursor Titik Emas */
        .cursor-follower {
          position: fixed;
          top: 0;
          left: 0;
          width: 12px;
          height: 12px;
          background: #F4D35E;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 15px 3px rgba(244, 211, 94, 0.6);
          opacity: 0;
          transition: opacity 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .cursor-follower.is-active {
          opacity: 1;
        }

        .lyric-scroll {
          mask-image: linear-gradient(to bottom, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
          scrollbar-width: thin;
          scrollbar-color: rgba(244,211,94,.5) transparent;
        }
        .lyric-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .lyric-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .lyric-scroll::-webkit-scrollbar-thumb {
          background: rgba(244,211,94,.45);
          border-radius: 9999px;
        }
        .lyric-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(244,211,94,.7);
        }

        @media (prefers-reduced-motion: reduce) {
          .star, .orb-a, .orb-b, .orb-c, .autoplay-bar, .slide-in-next, .slide-in-prev,
          .fade-item, .btn-interactive, .playing-pulse, .dot-indicator, .keyboard-hint {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}