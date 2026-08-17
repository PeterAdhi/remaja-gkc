'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface SlideOption {
  id: number
  label: string
}

const SLIDE_OPTIONS: SlideOption[] = [
  { id: 0, label: 'Tema & Pembicara' },
  { id: 1, label: 'Saat Teduh' },
  { id: 2, label: 'Lagu Pembuka' },
  { id: 3, label: 'Doa Pembuka' },
  { id: 4, label: 'Lagu Pujian 1' },
  { id: 5, label: 'Pembacaan Alkitab' },
  { id: 6, label: 'Lagu Pengantar Firman' },
  { id: 7, label: 'Firman Tuhan' },
  { id: 8, label: 'Lagu Pengantar Doa Syafaat' },
  { id: 9, label: 'Doa Syafaat' },
  { id: 10, label: 'Lagu Persembahan' },
  { id: 11, label: 'Doa Persembahan' },
  { id: 12, label: 'Lagu Pujian 2' },
  { id: 13, label: 'Doa Penutup & Berkat' },
  { id: 14, label: 'Lagu Doksologi' },
  { id: 15, label: 'Saat Teduh Akhir' },
  { id: 16, label: 'Warta' },
  { id: 17, label: 'Ucapan Terima Kasih' },
  { id: 18, label: 'Roster Sabtu Depan' },
]

export default function PilihSlidePage() {
  const router = useRouter()
  const [selectedSlides, setSelectedSlides] = useState<number[]>([])

  const toggleSlide = (id: number) => {
    setSelectedSlides((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].sort((a, b) => a - b)
    )
  }

  const selectAll = () => setSelectedSlides(SLIDE_OPTIONS.map((s) => s.id))
  const clearAll = () => setSelectedSlides([])

  const handleStart = () => {
    if (selectedSlides.length === 0) return
    localStorage.setItem('selectedSlides', JSON.stringify(selectedSlides))
    router.push('/presentasi')
  }

  const allSelected = selectedSlides.length === SLIDE_OPTIONS.length
  const progressPct = useMemo(
    () => Math.round((selectedSlides.length / SLIDE_OPTIONS.length) * 100),
    [selectedSlides]
  )

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        background: 'radial-gradient(circle at 50% 0%, #2B1B63 0%, #1B1140 55%, #140A2E 100%)',
      }}
    >
      {/* Bintang latar */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <span className="star" style={{ top: '10%', left: '8%', animationDelay: '0s' }} />
        <span className="star" style={{ top: '25%', left: '85%', animationDelay: '.5s' }} />
        <span className="star" style={{ top: '55%', left: '18%', animationDelay: '1s' }} />
        <span className="star" style={{ top: '70%', left: '92%', animationDelay: '.3s' }} />
        <span className="star" style={{ top: '85%', left: '40%', animationDelay: '1.4s' }} />
        <span className="star" style={{ top: '15%', left: '55%', animationDelay: '.8s' }} />
      </div>

      <main className="relative max-w-5xl mx-auto px-5 md:px-8 pt-10 md:pt-14 space-y-7">

        {/* Header */}
        <div className="reveal card-glass-dark p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  backgroundImage: 'linear-gradient(90deg, #FCE38A, #F4D35E, #E0A93A)',
                }}
              >
                Pilih Slide Liturgi
              </h1>
              <p className="text-amber-100/60 text-sm">
                Tentukan slide mana saja yang akan tampil saat ibadah berlangsung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="badge-gold text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                {selectedSlides.length} / {SLIDE_OPTIONS.length} Slide
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar & aksi cepat */}
        <div className="reveal delay-1 card-glass-dark p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <span className="text-xs text-amber-200/70 font-semibold w-10 text-right">{progressPct}%</span>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll} className="btn-ghost text-xs font-semibold px-3.5 py-2 rounded-lg">
              ✓ Pilih Semua
            </button>
            <button onClick={clearAll} className="btn-ghost text-xs font-semibold px-3.5 py-2 rounded-lg">
              ✕ Hapus Semua
            </button>
          </div>
        </div>

        {/* Grid Slide */}
        <div className="reveal delay-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {SLIDE_OPTIONS.map((slide, idx) => {
            const isSelected = selectedSlides.includes(slide.id)
            return (
              <button
                key={slide.id}
                onClick={() => toggleSlide(slide.id)}
                className={`slide-card relative text-left p-4 rounded-xl transition ${
                  isSelected ? 'slide-card-selected' : ''
                }`}
                style={{ animationDelay: `${0.03 * idx}s` }}
              >
                <div className="flex items-start gap-3">
                  <span className={`checkbox-dot ${isSelected ? 'checkbox-dot-on' : ''}`}>
                    {isSelected && (
                      <svg viewBox="0 0 20 20" width="12" height="12" fill="none">
                        <path d="M4 10.5L8 14.5L16 5.5" stroke="#241246" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-semibold tracking-wider uppercase text-amber-300/50 mb-0.5">
                      Slide {slide.id + 1}
                    </span>
                    <span className={`block text-sm font-semibold leading-snug ${isSelected ? 'text-amber-50' : 'text-amber-100/80'}`}>
                      {slide.label}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {/* Bottom action bar — sticky */}
      <div className="fixed bottom-0 left-0 right-0 z-30 action-bar">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center gap-4">
          <div className="hidden sm:block text-xs text-amber-100/60">
            {selectedSlides.length === 0
              ? 'Belum ada slide dipilih'
              : `${selectedSlides.length} slide siap ditampilkan${allSelected ? ' (semua slide)' : ''}`}
          </div>
          <button
            onClick={handleStart}
            disabled={selectedSlides.length === 0}
            className="btn-gold flex-1 sm:flex-none sm:ml-auto py-3 px-8 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan &amp; Mulai Presentasi →
          </button>
        </div>
      </div>

      <style jsx global>{`
        .card-glass-dark {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(244,211,94,.18);
          box-shadow: 0 8px 24px rgba(0,0,0,.25);
          backdrop-filter: blur(6px);
        }

        .badge-gold {
          color: #241246;
          background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A);
        }

        .btn-ghost {
          color: #FCE9B0;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(244,211,94,.25);
          transition: background .18s ease, transform .18s ease;
        }
        .btn-ghost:hover {
          background: rgba(244,211,94,.1);
          transform: translateY(-1px);
        }

        .progress-track {
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          background: rgba(244,211,94,.15);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #F4D35E, #FFF3C4);
          box-shadow: 0 0 8px rgba(244,211,94,.5);
          transition: width .3s ease;
        }

        .slide-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(244,211,94,.14);
        }
        .slide-card:hover {
          background: rgba(255,255,255,.06);
          border-color: rgba(244,211,94,.3);
          transform: translateY(-2px);
        }
        .slide-card-selected {
          background: rgba(244,211,94,.1);
          border-color: rgba(244,211,94,.55);
          box-shadow: 0 0 0 1px rgba(244,211,94,.2), 0 8px 20px rgba(244,211,94,.08);
        }

        .checkbox-dot {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1.5px solid rgba(244,211,94,.4);
          background: rgba(255,255,255,.03);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          transition: transform .15s ease, background .15s ease, border-color .15s ease;
        }
        .checkbox-dot-on {
          background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A);
          border-color: transparent;
          transform: scale(1.05);
        }

        .action-bar {
          background: linear-gradient(180deg, rgba(20,10,46,0) 0%, #140A2E 30%, #140A2E 100%);
          border-top: 1px solid rgba(244,211,94,.15);
          padding-top: 8px;
        }

        .reveal {
          animation: fadeUpDash .5s ease both;
        }
        .delay-1 { animation-delay: .05s; }
        .delay-2 { animation-delay: .1s; }
        @keyframes fadeUpDash {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .slide-card, .progress-fill, .checkbox-dot, .star {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}