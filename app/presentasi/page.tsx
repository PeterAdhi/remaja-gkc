'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const AUTOPLAY_MS = 5000

const THEMES = {
  royal:      { name: 'Royal Velvet',        bg: 'radial-gradient(circle at 50% 0%, #2B1B63, #1B1140 55%, #140A2E)', card: 'linear-gradient(165deg, rgba(46,27,100,.65), rgba(26,15,64,.78))' },
  celestial:  { name: 'Celestial Starlight', bg: 'radial-gradient(circle at 50% 0%, #0F172A, #090D16 55%, #030712)', card: 'linear-gradient(165deg, rgba(15,23,42,.75), rgba(9,13,22,.85))' },
  earthy:     { name: 'Earthy Warmth',       bg: 'radial-gradient(circle at 50% 0%, #2D1810, #1E100A 55%, #120905)', card: 'linear-gradient(165deg, rgba(50,28,18,.7), rgba(30,16,10,.82))' },
  minimalist: { name: 'Minimalist Midnight', bg: '#09090B',                                                     card: 'linear-gradient(165deg, rgba(24,24,27,.75), rgba(9,9,11,.9))' },
} as const
type ThemeMode = keyof typeof THEMES

interface Slide { title: string; subtitle: string; content: string }

const ROSTER_FIELDS: [string, string][] = [
  ['Liturgos', 'liturgos'], ['Usher & Kolektan', 'usher_kolektan'], ['Doa Syafaat', 'doa_syafaat'],
  ['Warta', 'warta'], ['Multimedia', 'multimedia'], ['Pendamping', 'pendamping'],
]
const STARS: [number, number][] = [[12, 10], [22, 88], [80, 18], [68, 92], [90, 55], [8, 48]]

const fmtDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const isoDate = (d: Date) => d.toLocaleDateString('en-CA')

const lyricSize = (_content: string, full: boolean) => {
  return full ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'
}

async function buildSlides(): Promise<Slide[]> {
  const today = new Date()
  const sat = new Date(today)
  sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7))
  const nextSat = new Date(sat)
  nextSat.setDate(sat.getDate() + 7)

  const [{ data: tema }, { data: lagu }, { data: roster }] = await Promise.all([
    supabase.from('jadwal_tema').select('tema, pembicara').eq('tanggal_sabtu', isoDate(sat)).maybeSingle(),
    supabase.from('pemilihan_lagu').select('kategori, lagu:lagu_id (judul_lagu, lirik)').eq('tanggal_ibadah', isoDate(sat)),
    supabase.from('roster_penatalayanan').select('*').eq('tanggal_sabtu', isoDate(nextSat)).maybeSingle(),
  ])

  const judul = tema?.tema || 'Tema Belum Diatur'
  const pembicara = tema?.pembicara || '-'
  const tanggal = fmtDate(sat)

  const songs = (lagu || []).map((i: any) => {
    const s = Array.isArray(i.lagu) ? i.lagu[0] : i.lagu
    return { kategori: i.kategori?.toLowerCase(), judul: s?.judul_lagu, lirik: s?.lirik }
  })

  const plain = (title: string, subtitle = '', content = ''): Slide => ({ title, subtitle, content })
  const song = (label: string, keys: string[]): Slide => {
    const s = songs.find((x) => keys.includes(x.kategori))
    return {
      title: s?.judul || label,
      subtitle: label,
      content: s?.judul ? s.lirik || 'Lirik belum tersedia' : 'Lagu belum dipilih',
    }
  }

  const rosterText = roster
    ? ROSTER_FIELDS.map(([label, key]) => `${label}: ${roster[key] || '-'}`).join('\n')
    : 'Roster penatalayanan belum diatur untuk tanggal ini.'

  return [
    plain(judul, 'Persekutuan RGKC', `Pembicara: ${pembicara}`),
    plain('Saat Teduh'),
    song('Lagu Pembuka', ['pembuka', 'pembukaan']),
    plain('Doa Pembuka'),
    song('Lagu Pujian', ['pujian_1', 'pujian']),
    plain('Pembacaan Alkitab'),
    song('Lagu Pengantar Firman', ['pengantar_firman']),
    plain('Firman Tuhan'),
    song('Lagu Pengantar Doa Syafaat', ['pengantar_doa_syafaat']),
    plain('Doa Syafaat'),
    song('Lagu Persembahan', ['persembahan']),
    plain('Doa Persembahan'),
    song('Lagu Pujian', ['pujian_2']),
    plain('Doa Penutup & Berkat'),
    song('Lagu Doxologi', ['doksologi']),
    plain('Saat Teduh'),
    plain('Warta', 'Informasi', 'Warta Remaja GKC'),
    plain(
      'Pemberitaan Firman Tuhan',
      'Terima Kasih Pelayanannya',
      `Pemberitaan Firman Tuhan pada hari ini\n${tanggal} dilayani oleh\n${pembicara}\n\nAtas pelayanannya, kami\nmengucapkan terima kasih,\nTuhan Yesus memberkati.`
    ),
    plain('Roster Penatalayanan Sabtu Depan', fmtDate(nextSat), rosterText),
  ]
}

export default function PresentasiPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [themeId, setThemeId] = useState<ThemeMode>('royal')
  
  // PERBAIKAN DI SINI: Set isHovered ke true agar langsung muncul sejak awal
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(true)

  const theme = THEMES[themeId]
  const last = slides.length - 1

  useEffect(() => {
    if (localStorage.getItem('isAdminRemaja') !== 'true') {
      alert('Akses ditolak! Anda harus login sebagai admin terlebih dahulu.')
      return router.push('/')
    }
    const savedTheme = localStorage.getItem('selectedTheme') as ThemeMode
    if (savedTheme in THEMES) setThemeId(savedTheme)

    const selection = localStorage.getItem('selectedSlides')
    if (!selection) return router.push('/presentasi/pilih')
    const indices: number[] = JSON.parse(selection)

    buildSlides()
      .then((all) => setSlides(all.filter((_, i) => indices.includes(i))))
      .catch((e) => console.error('Gagal mengambil data:', e))
      .finally(() => setLoading(false))
  }, [router])

  const move = useCallback((delta: number) => {
    setDirection(delta > 0 ? 'next' : 'prev')
    setCurrent((p) => Math.min(Math.max(p + delta, 0), Math.max(slides.length - 1, 0)))
  }, [slides.length])

  const goTo = (i: number) => {
    setDirection(i > current ? 'next' : 'prev')
    setCurrent(i)
    setIsPlaying(false)
  }

  const manual = (delta: number) => { setIsPlaying(false); setShowHint(false); move(delta) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) manual(1)
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) manual(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  useEffect(() => {
    if (!isPlaying || !slides.length) return
    const id = setInterval(() => {
      setDirection('next')
      setCurrent((p) => (p === slides.length - 1 ? 0 : p + 1))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [isPlaying, slides.length])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    const t = setTimeout(() => setShowHint(false), 4500)
    return () => { document.removeEventListener('fullscreenchange', onChange); clearTimeout(t) }
  }, [])

  const toggleFullscreen = () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen().catch((e) => alert(`Gagal fullscreen: ${e.message}`))

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 50) manual(diff < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
    if (!isHovered) setIsHovered(true)
  }

  const Stars = () => (
    <div className="pointer-events-none absolute inset-0 opacity-70 overflow-hidden">
      {STARS.map(([top, left], i) => (
        <span key={i} className="star" style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${i * 0.4}s` }} />
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-200 relative" style={{ background: theme.bg }}>
        <Stars />
        <div className="text-center space-y-4 relative z-10">
          <div className="w-10 h-10 border-[3px] border-amber-300/30 border-t-amber-300 rounded-full animate-spin mx-auto" />
          <p className="text-[11px] tracking-[0.3em] uppercase ui-sans">Memuat presentasi…</p>
        </div>
        <Styles />
      </div>
    )
  }

  const slide = slides[current] || { title: '', subtitle: '', content: '' }
  const pill = 'ui-sans text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition tracking-wide'

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
      className={`min-h-[calc(100vh-70px)] flex flex-col justify-between p-6 md:p-12 text-amber-50 relative custom-cursor-area ${isFullscreen ? 'h-screen overflow-hidden' : 'overflow-y-auto no-scrollbar'}`}
      style={{ background: theme.bg }}
    >
      <Stars />

      {/* Custom Bintang Pengganti Kursor Mouse */}
      {isHovered && mousePos.x > 0 && (
        <div
          className="pointer-events-none fixed z-50 custom-cursor-star"
          style={{ top: mousePos.y - 12, left: mousePos.x - 12 }}
        >
          ✦
        </div>
      )}

      {/* Progress autoplay */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5 z-20">
        {isPlaying && (
          <div key={`${current}-${isPlaying}`} className="h-full autoplay-bar" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />
        )}
      </div>

      {/* Header */}
      {!isFullscreen && (
        <div className="max-w-5xl w-full mx-auto flex justify-between items-center relative z-10 border-b border-amber-200/15 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.28em] text-amber-300/70 font-semibold ui-sans">
              Mode Presentasi Admin ({theme.name})
            </span>
            <h1 className="text-xl font-semibold gold-foil-text serif">Remaja GKC</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push('/presentasi/pilih')} className={`${pill} border-amber-200/25 bg-white/5 text-amber-200/90 hover:bg-white/10`}>
              ⚙ Pilih Ulang
            </button>
            <button onClick={toggleFullscreen} className={`${pill} border-amber-300/45 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20`}>
              ⛶ Fullscreen
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${pill} ${isPlaying ? 'bg-amber-400/15 text-amber-200 border-amber-300/50' : 'bg-white/5 text-amber-100/70 border-white/10 hover:bg-white/10'}`}
            >
              {isPlaying ? '⏸ Jeda' : '▶ Putar'}
            </button>
            <div className="hidden sm:block text-[11px] ui-sans bg-white/5 border border-amber-200/20 px-3 py-1.5 rounded-full text-amber-200/90 tabular-nums">
              {current + 1} / {slides.length}
            </div>
          </div>
        </div>
      )}

      {/* Slide */}
      <div className={`w-full mx-auto my-auto relative z-10 text-center ${isFullscreen ? 'max-w-6xl flex items-center justify-center h-full' : 'max-w-4xl py-6'}`}>
        <div key={current} className={`w-full space-y-4 ${direction === 'next' ? 'slide-in-next' : 'slide-in-prev'}`}>
          <div
            className={`gilded-card mx-auto p-6 md:p-8 ${isFullscreen ? 'max-w-5xl' : 'max-w-3xl'}`}
            style={{ background: theme.card }}
          >
            <div className="pb-4 border-b border-amber-200/15 mb-5 space-y-1.5">
              {slide.subtitle && (
                <span className="block text-amber-200 font-semibold tracking-[0.32em] uppercase ui-sans" style={{ fontSize: isFullscreen ? '1rem' : '.75rem' }}>
                  {slide.subtitle}
                </span>
              )}
              <h2
                className="font-semibold gold-foil-text tracking-tight leading-[1.15] px-2 serif"
                style={{ fontSize: isFullscreen ? 'clamp(2.75rem, 5vw, 4.25rem)' : 'clamp(1.75rem, 3vw, 2.75rem)' }}
              >
                {slide.title}
              </h2>
            </div>

            {slide.content && (
              <div className="max-h-[44vh] md:max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                <p
                  className={`serif whitespace-pre-line text-center leading-relaxed text-amber-50/95 ${lyricSize(slide.content, isFullscreen)}`}
                  style={{ fontSize: isFullscreen ? 'clamp(2.75rem, 5vw, 4.25rem)' : 'clamp(1.75rem, 3vw, 2.75rem)' }}
                >
                  {slide.content}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <div className="max-w-5xl w-full mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-4 relative z-10 border-t border-amber-200/15 pt-4">
          <button
            onClick={() => manual(-1)}
            disabled={current === 0}
            className={`${pill} px-4 py-2 text-xs ${current === 0 ? 'opacity-35 cursor-not-allowed border-white/10 text-gray-400' : 'border-amber-200/30 bg-white/5 text-amber-100 hover:bg-white/10'}`}
          >
            ← Sebelumnya
          </button>

          <div className="flex gap-1.5 overflow-x-auto max-w-md py-1 px-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Loncat ke slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-gradient-to-r from-[#FCE38A] to-[#D4AF37]' : 'w-2 bg-white/20 hover:bg-white/50'}`}
              />
            ))}
          </div>

          <button
            onClick={() => manual(1)}
            disabled={current === last}
            className={`${pill} px-5 py-2 text-xs ${current === last ? 'opacity-35 cursor-not-allowed border-white/10 text-gray-400' : 'border-transparent text-[#241246] bg-gradient-to-b from-[#FFF0A8] to-[#D4A93A] hover:brightness-110'}`}
          >
            Selanjutnya →
          </button>
        </div>
      )}

      {showHint && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 ui-sans text-[11px] px-4 py-2 rounded-full bg-[#120a26]/90 border border-amber-300/35 text-amber-100 whitespace-nowrap">
          Gunakan ← → atau spasi untuk berpindah slide, atau geser layar
        </div>
      )}

      <Styles />
    </div>
  )
}

function Styles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

      .serif { font-family: 'Cormorant Garamond', serif; }
      .ui-sans { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }

      .custom-cursor-area, .custom-cursor-area * {
        cursor: none !important;
      }

      .custom-cursor-star {
        color: #F4D35E;
        font-size: 24px;
        text-shadow: 0 0 10px #F4D35E, 0 0 20px #FFECA1, 0 0 30px #D4AF37;
        animation: cursorTwinkle 1.5s ease-in-out infinite alternate;
        user-select: none;
      }

      @keyframes cursorTwinkle {
        0% { transform: scale(0.9) rotate(0deg); opacity: 0.8; }
        100% { transform: scale(1.15) rotate(15deg); opacity: 1; }
      }

      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      .gold-foil-text {
        background: linear-gradient(180deg, #FFECA1, #F3D273 40%, #D49E36 75%, #A87023);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,.6));
      }

      .gilded-card {
        border: 1px solid rgba(244,211,94,.3);
        border-radius: 1.5rem;
        backdrop-filter: blur(16px);
        box-shadow: 0 30px 70px -20px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08);
      }

      .star {
        position: absolute; width: 3px; height: 3px; border-radius: 9999px;
        background: #F4D35E; box-shadow: 0 0 8px 2px #F4D35E;
        animation: twinkle 3s ease-in-out infinite;
      }
      @keyframes twinkle {
        0%, 100% { opacity: .15; transform: scale(.7); }
        50% { opacity: 1; transform: scale(1.4); }
      }

      .autoplay-bar {
        background: linear-gradient(90deg, #F4D35E, #FFF6D6);
        animation: barGrow linear forwards;
      }
      @keyframes barGrow { from { width: 0 } to { width: 100% } }

      .slide-in-next { animation: slideIn .45s cubic-bezier(.16,1,.3,1) both; --y: 15px; }
      .slide-in-prev { animation: slideIn .45s cubic-bezier(.16,1,.3,1) both; --y: -15px; }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(var(--y)) scale(.98); }
        to   { opacity: 1; transform: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .star, .custom-cursor-star, .autoplay-bar, .slide-in-next, .slide-in-prev { animation: none !important; }
      }
    `}</style>
  )
}