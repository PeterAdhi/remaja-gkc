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

type ThemeMode = 'royal' | 'celestial' | 'earthy' | 'minimalist'

interface ThemeConfig {
  id: ThemeMode
  name: string
  bg: string
  accent: string
  cardBg: string
  cardBorder: string
}

const THEMES: ThemeConfig[] = [
  { 
    id: 'royal', 
    name: 'Royal Velvet', 
    bg: 'radial-gradient(circle at 50% 0%, #2B1B63 0%, #1B1140 55%, #140A2E 100%)', 
    accent: '#F4D35E',
    cardBg: 'linear-gradient(165deg, rgba(46,27,100,0.65), rgba(26,15,64,0.78))',
    cardBorder: 'rgba(244,211,94,0.3)'
  },
  { 
    id: 'celestial', 
    name: 'Celestial Starlight', 
    bg: 'radial-gradient(circle at 50% 0%, #0F172A 0%, #090D16 55%, #030712 100%)', 
    accent: '#F4D35E',
    cardBg: 'linear-gradient(165deg, rgba(15,23,42,0.75), rgba(9,13,22,0.85))',
    cardBorder: 'rgba(244,211,94,0.25)'
  },
  { 
    id: 'earthy', 
    name: 'Earthy Warmth', 
    bg: 'radial-gradient(circle at 50% 0%, #2D1810 0%, #1E100A 55%, #120905 100%)', 
    accent: '#F4D35E',
    cardBg: 'linear-gradient(165deg, rgba(50,28,18,0.7), rgba(30,16,10,0.82))',
    cardBorder: 'rgba(244,211,94,0.3)'
  },
  { 
    id: 'minimalist', 
    name: 'Minimalist Midnight', 
    bg: '#09090B', 
    accent: '#F4D35E',
    cardBg: 'linear-gradient(165deg, rgba(24,24,27,0.75), rgba(9,9,11,0.9))',
    cardBorder: 'rgba(244,211,94,0.25)'
  },
]

interface LyricLayout {
  columns: string[]
  sizeClass: string
}

function getLyricLayout(content: string, isFullscreen: boolean): LyricLayout {
  const lines = content.split('\n')
  const nonEmptyCount = lines.filter((l) => l.trim() !== '').length

  const sizeClass = isFullscreen
    ? nonEmptyCount <= 8
      ? 'text-4xl md:text-6xl leading-relaxed'
      : nonEmptyCount <= 16
      ? 'text-3xl md:text-5xl leading-relaxed'
      : 'text-2xl md:text-4xl leading-snug'
    : nonEmptyCount <= 8
    ? 'text-2xl md:text-3xl leading-relaxed'
    : nonEmptyCount <= 16
    ? 'text-xl md:text-2xl leading-relaxed'
    : 'text-lg md:text-xl leading-snug'

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
      <path d="M2 2H24" stroke="url(#ornGold)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 2V24" stroke="url(#ornGold)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 2C16 2 22 8 22 22" stroke="url(#ornGold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <circle cx="2" cy="2" r="3" fill="#F4D35E" />
      <defs>
        <linearGradient id="ornGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFECA1" />
          <stop offset="1" stopColor="#C89A3C" />
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
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('royal')
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

    const savedTheme = localStorage.getItem('selectedTheme') as ThemeMode
    if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
      setCurrentTheme(savedTheme)
    }

    const savedSelection = localStorage.getItem('selectedSlides')
    if (!savedSelection) {
      router.push('/presentasi/pilih')
      return
    }
    fetchData(JSON.parse(savedSelection))
  }, [router])

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

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0]

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center text-amber-200 relative overflow-hidden transition-colors duration-500"
        style={{ background: activeThemeObj.bg }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <span className="star" style={{ top: '20%', left: '15%' }} />
          <span className="star" style={{ top: '60%', left: '30%', animationDelay: '.6s' }} />
          <span className="star" style={{ top: '35%', left: '70%', animationDelay: '1.1s' }} />
          <span className="star" style={{ top: '75%', left: '85%', animationDelay: '.3s' }} />
        </div>
        <div className="text-center space-y-4 relative z-10">
          <div className="w-10 h-10 border-[3px] border-amber-300/30 border-t-amber-300 rounded-full animate-spin mx-auto" />
          <p className="text-[11px] tracking-[0.3em] uppercase text-amber-200/80 font-medium ui-sans">Memuat presentasi&hellip;</p>
        </div>
      </div>
    )
  }

  const slide = slides[currentSlide] || { title: '', subtitle: '', content: '' }
  const lyricLayoutForSlide = slide.content ? getLyricLayout(slide.content, isFullscreen) : null

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-[calc(100vh-70px)] flex flex-col justify-between p-6 md:p-12 text-amber-50 relative overflow-y-auto transition-colors duration-500 ${
        isFullscreen ? 'cursor-none' : ''
      }`}
      style={{ background: activeThemeObj.bg }}
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 pointer-events-none bg-amber-400 animate-pulse" style={{ animationDuration: '6s' }} />

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

      <div className="pointer-events-none absolute inset-0 opacity-70 overflow-hidden">
        <span className="star" style={{ top: '12%', left: '10%', animationDelay: '0s' }} />
        <span className="star" style={{ top: '22%', left: '88%', animationDelay: '.6s' }} />
        <span className="star" style={{ top: '80%', left: '18%', animationDelay: '1.1s' }} />
        <span className="star" style={{ top: '68%', left: '92%', animationDelay: '.3s' }} />
        <span className="star" style={{ top: '90%', left: '55%', animationDelay: '.9s' }} />
        <span className="star" style={{ top: '8%', left: '48%', animationDelay: '1.4s' }} />
        <span className="star" style={{ top: '45%', left: '5%', animationDelay: '2s' }} />
        <span className="star" style={{ top: '35%', left: '95%', animationDelay: '1.8s' }} />
      </div>

      {!isFullscreen && (
        <div className="max-w-5xl w-full mx-auto flex justify-between items-center relative z-10 border-b border-amber-200/15 pb-4 header-bar">
          <div className="flex items-center gap-3">
            <div className="brand-mark hidden sm:flex animate-spin-slow" aria-hidden="true">✦</div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-amber-300/70 font-semibold ui-sans">
                Mode Presentasi Admin ({activeThemeObj.name})
              </span>
              <h1 className="text-lg md:text-xl font-semibold gold-foil-text tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Remaja GKC
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/presentasi/pilih')}
              className="btn-interactive ui-sans text-[11px] font-semibold px-3.5 py-1.5 rounded-full border border-amber-200/25 bg-white/[0.04] text-amber-200/90 hover:bg-white/[0.08] hover:border-amber-200/40 transition tracking-wide shadow-sm"
              title="Ubah Pilihan Slide & Tema"
            >
              ⚙ Pilih Ulang
            </button>

            <button
              onClick={toggleFullscreen}
              className="btn-interactive btn-gold-outline ui-sans text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 tracking-wide shadow-sm"
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

            <div className="text-[11px] ui-sans font-medium bg-white/[0.04] border border-amber-200/20 px-3 py-1.5 rounded-full text-amber-200/90 hidden sm:block tabular-nums tracking-wide shadow-sm">
              {currentSlide + 1} <span className="text-amber-200/40">/</span> {slides.length}
            </div>
          </div>
        </div>
      )}

      <div
        className={`w-full mx-auto my-auto py-8 relative z-10 text-center overflow-hidden transition-[max-width] duration-300 ${
          isFullscreen ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        <div
          key={currentSlide}
          className={`space-y-5 ${direction === 'next' ? 'slide-in-next' : 'slide-in-prev'}`}
        >
          <div className="space-y-2.5">
            {slide.subtitle && (
              <span
                className={`text-amber-200 font-semibold tracking-[0.32em] block uppercase fade-item ui-sans drop-shadow`}
                style={{ animationDelay: '.05s', fontSize: isFullscreen ? '1rem' : '0.75rem' }}
              >
                {slide.subtitle}
              </span>
            )}
            <h2
              className={`font-semibold gold-foil-text tracking-tight leading-[1.15] fade-item px-2`}
              style={{ 
                fontFamily: "'Cormorant Garamond', serif", 
                animationDelay: '.12s',
                fontSize: isFullscreen ? 'clamp(2.75rem, 5.5vw, 5rem)' : 'clamp(1.85rem, 3.5vw, 3rem)'
              }}
            >
              {slide.title}
            </h2>
            <div className="flex items-center justify-center gap-3 fade-item" style={{ animationDelay: '.16s' }}>
              <span className="divider-line" />
              <span className="divider-gem animate-pulse" aria-hidden="true" />
              <span className="divider-line" />
            </div>
          </div>

          {slide.content && lyricLayoutForSlide && (
            <div
              className={`relative mx-auto p-7 md:p-10 fade-item gilded-card transition-all duration-300 hover:scale-[1.005] ${
                isFullscreen ? 'max-w-5xl' : 'max-w-3xl'
              }`}
              style={{ 
                animationDelay: '.22s',
                background: activeThemeObj.cardBg,
                borderColor: activeThemeObj.cardBorder
              }}
            >
              <CornerOrnament className="corner-tl" />
              <CornerOrnament className="corner-tr" />
              <CornerOrnament className="corner-bl" />
              <CornerOrnament className="corner-br" />
              <div className="lyric-scroll max-h-[48vh] md:max-h-[54vh] overflow-y-auto pr-1">
                {lyricLayoutForSlide.columns.map((col, i) => (
                  <p
                    key={i}
                    className={`text-amber-50/95 whitespace-pre-line text-center drop-shadow-sm ${lyricLayoutForSlide.sizeClass}`}
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {col}
                  </p>
                ))}
              </div>
            </div>
          )}
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
                : 'border-amber-200/30 bg-white/[0.04] text-amber-100 hover:bg-white/[0.08] hover:border-amber-200/50 shadow-sm'
            }`}
          >
            &larr; Sebelumnya
          </button>

          <div className="flex gap-1.5 overflow-x-auto max-w-md py-1 px-2">
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
            className={`btn-interactive ui-sans px-5 py-2 text-xs font-semibold rounded-full transition tracking-wide shadow-md ${
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700;800&display=swap');

        .ui-sans { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }

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
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 1px solid rgba(244,211,94,0.4);
          color: #F4D35E;
          font-size: 13px;
          background: radial-gradient(circle at 30% 30%, rgba(244,211,94,0.22), transparent 70%);
          box-shadow: 0 0 10px rgba(244,211,94,0.2);
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 12s linear infinite;
        }

        .gold-foil-text {
          background: linear-gradient(180deg, #FFECA1 0%, #F3D273 40%, #D49E36 75%, #A87023 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
        }

        .divider-line {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(244,211,94,0.65));
        }
        .divider-line:last-child {
          background: linear-gradient(90deg, rgba(244,211,94,0.65), transparent);
        }
        .divider-gem {
          width: 6px;
          height: 6px;
          background: #F4D35E;
          transform: rotate(45deg);
          box-shadow: 0 0 10px rgba(244,211,94,0.9);
          flex-shrink: 0;
        }

        .gilded-card {
          border-radius: 1.5rem;
          border-style: solid;
          border-width: 1px;
          box-shadow:
            0 30px 70px -20px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 25px rgba(244,211,94,0.06);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .ornament-corner {
          position: absolute;
          width: 28px;
          height: 28px;
          opacity: 0.9;
          pointer-events: none;
        }
        .corner-tl { top: -1px; left: -1px; }
        .corner-tr { top: -1px; right: -1px; transform: scaleX(-1); }
        .corner-bl { bottom: -1px; left: -1px; transform: scaleY(-1); }
        .corner-br { bottom: -1px; right: -1px; transform: scale(-1, -1); }

        .btn-gold-outline {
          color: #F6DE9C;
          background: linear-gradient(180deg, rgba(244,211,94,0.16), rgba(244,211,94,0.05));
          border: 1px solid rgba(244,211,94,0.45);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .btn-gold-outline:hover {
          background: linear-gradient(180deg, rgba(244,211,94,0.25), rgba(244,211,94,0.1));
          border-color: rgba(244,211,94,0.7);
        }

        .btn-gold-solid {
          background: linear-gradient(180deg, #FFF0A8 0%, #FCE38A 30%, #F4D35E 60%, #D4A93A 100%);
          box-shadow: 0 8px 25px -6px rgba(212,169,58,0.65);
        }
        .btn-gold-solid:hover {
          filter: brightness(1.08);
          box-shadow: 0 10px 30px -5px rgba(244,211,94,0.75);
        }

        @keyframes twinkle {
          0%, 100% { opacity: .15; transform: scale(.7); }
          50% { opacity: 1; transform: scale(1.4); filter: drop-shadow(0 0 8px #F4D35E); }
        }
        .star {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: #F4D35E;
          box-shadow: 0 0 8px 2px #F4D35E;
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes barShrink {
          from { width: 0%; }
          to { width: 100%; }
        }
        .autoplay-bar {
          background: linear-gradient(90deg, #F4D35E, #FFF6D6);
          box-shadow: 0 0 12px rgba(244,211,94,0.8);
          animation-name: barShrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes slideInFromRight {
          0% { opacity: 0; transform: translateY(15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInFromLeft {
          0% { opacity: 0; transform: translateY(-15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .slide-in-next { animation: slideInFromRight .45s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .slide-in-prev { animation: slideInFromLeft .45s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes fadeItemIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-item {
          animation: fadeItemIn .5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .btn-interactive {
          transition: transform .2s cubic-bezier(0.16, 1, 0.3, 1), background .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .btn-interactive:hover {
          transform: translateY(-2px);
        }
        .btn-interactive:active {
          transform: translateY(0) scale(.96);
        }

        @keyframes playingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244,211,94,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(244,211,94,0); }
        }
        .playing-pulse {
          animation: playingPulse 1.6s ease-in-out infinite;
        }

        .dot-indicator {
          transition: width .3s ease, background .2s ease, transform .15s ease;
        }
        .dot-indicator:hover {
          transform: scaleY(1.4);
        }
        .dot-active {
          box-shadow: 0 0 10px rgba(244,211,94,0.8);
        }

        .keyboard-hint {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translate(-50%, 12px);
          background: rgba(18, 10, 38, 0.92);
          border: 1px solid rgba(244,211,94,0.35);
          color: #FCE9B0;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.03em;
          padding: 8px 18px;
          border-radius: 9999px;
          opacity: 0;
          pointer-events: none;
          transition: opacity .4s ease, transform .4s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 40;
          white-space: nowrap;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }
        .keyboard-hint-show {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        .cursor-follower {
          position: fixed;
          top: 0;
          left: 0;
          width: 14px;
          height: 14px;
          background: #F4D35E;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 20px 4px rgba(244, 211, 94, 0.7);
          opacity: 0;
          transition: opacity 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .cursor-follower.is-active {
          opacity: 0.9;
        }

        .lyric-scroll {
          mask-image: linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
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
          background: rgba(244,211,94,.5);
          border-radius: 9999px;
        }
        .lyric-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(244,211,94,.75);
        }

        @media (prefers-reduced-motion: reduce) {
          .star, .animate-spin-slow, .autoplay-bar, .slide-in-next, .slide-in-prev,
          .fade-item, .btn-interactive, .playing-pulse, .dot-indicator, .keyboard-hint {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}