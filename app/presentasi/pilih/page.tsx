'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SlideOption {
  id: number
  label: string
}

type ThemeMode = 'royal' | 'celestial' | 'earthy' | 'minimalist'

interface ThemeConfig {
  id: ThemeMode
  name: string
  bg: string
  accent: string
}

const THEMES: ThemeConfig[] = [
  { id: 'royal', name: 'Royal Velvet (Default)', bg: 'radial-gradient(circle at 50% 0%, #2B1B63 0%, #1B1140 55%, #140A2E 100%)', accent: '#F4D35E' },
  { id: 'celestial', name: 'Celestial Starlight', bg: 'radial-gradient(circle at 50% 0%, #0F172A 0%, #090D16 55%, #030712 100%)', accent: '#E2E8F0' },
  { id: 'earthy', name: 'Earthy Warmth', bg: 'radial-gradient(circle at 50% 0%, #2D1810 0%, #1E100A 55%, #120905 100%)', accent: '#D97706' },
  { id: 'minimalist', name: 'Minimalist Midnight', bg: '#09090B', accent: '#FFFFFF' },
]

const SLIDE_OPTIONS: SlideOption[] = [
  { id: 0, label: 'Tema & Pembicara' },
  { id: 1, label: 'Saat Teduh' },
  { id: 2, label: 'Lagu Pembuka' },
  { id: 3, label: 'Doa Pembuka' },
  { id: 4, label: 'Lagu Pujian 1' },
  { id: 5, label: 'Pembacaan Alkitab' },
  { id: 6, label: 'Lagu Pengantar Firman' },
  { id: 7, label: 'Firman Tuhan' },
  { id: 8, label: 'Pemutaran Video' },
  { id: 9, label: 'Lagu Pengantar Doa Syafaat' },
  { id: 10, label: 'Doa Syafaat' },
  { id: 11, label: 'Lagu Persembahan' },
  { id: 12, label: 'Doa Persembahan' },
  { id: 13, label: 'Lagu Pujian 2' },
  { id: 14, label: 'Doa Penutup & Berkat' },
  { id: 15, label: 'Lagu Doksologi' },
  { id: 16, label: 'Saat Teduh Akhir' },
  { id: 17, label: 'Warta' },
  { id: 18, label: 'Ucapan Terima Kasih' },
  { id: 19, label: 'Roster Sabtu Depan' },
]

export default function PilihSlidePage() {
  const router = useRouter()
  const [selectedSlides, setSelectedSlides] = useState<number[]>([])
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('royal')
  const [saveStatus, setSaveStatus] = useState<string>('')
  
  const [videoUrlInput, setVideoUrlInput] = useState<string>('')
  const [targetSaturdayDate, setTargetSaturdayDate] = useState<string>('')

  useEffect(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = (6 - day + 7) % 7
    const nextSaturday = new Date(today)
    nextSaturday.setDate(today.getDate() + diff)
    const dateStr = nextSaturday.toISOString().split('T')[0]
    setTargetSaturdayDate(dateStr)

    fetchConfiguration(dateStr)
  }, [])

  // Fungsi untuk mengambil data konfigurasi dari database Supabase
  async function fetchConfiguration(dateStr: string) {
    try {
      const { data, error } = await supabase
        .from('pemilihan_lagu')
        .select('video_url, selected_slides, selected_theme')
        .eq('tanggal_ibadah', dateStr)
        .maybeSingle()

      if (data) {
        if (data.video_url) setVideoUrlInput(data.video_url)
        if (data.selected_slides && Array.isArray(data.selected_slides)) {
          setSelectedSlides(data.selected_slides)
        } else {
          setSelectedSlides(SLIDE_OPTIONS.map((s) => s.id))
        }
        if (data.selected_theme && THEMES.some(t => t.id === data.selected_theme)) {
          setCurrentTheme(data.selected_theme as ThemeMode)
        }
      } else {
        // Default jika baris tanggal belum ada di database
        setSelectedSlides(SLIDE_OPTIONS.map((s) => s.id))
      }
    } catch (err) {
      console.error('Gagal mengambil konfigurasi:', err)
      setSelectedSlides(SLIDE_OPTIONS.map((s) => s.id))
    }
  }

  const toggleSlide = (id: number) => {
    setSelectedSlides((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].sort((a, b) => a - b)
    )
    setSaveStatus('')
  }

  const selectAll = () => {
    setSelectedSlides(SLIDE_OPTIONS.map((s) => s.id))
    setSaveStatus('')
  }
  
  const clearAll = () => {
    setSelectedSlides([])
    setSaveStatus('')
  }

  // Menyimpan perubahan ke Database Supabase & LocalStorage secara bersamaan
  const handleSaveOnly = async () => {
    try {
      // Simpan juga ke localStorage sebagai cache instan perangkat lokal
      localStorage.setItem('selectedSlides', JSON.stringify(selectedSlides))
      localStorage.setItem('selectedTheme', currentTheme)
      localStorage.setItem('videoUrl', videoUrlInput)

      if (targetSaturdayDate) {
        // Cek apakah data untuk tanggal sabtu ini sudah ada di tabel pemilihan_lagu
        const { data: existing } = await supabase
          .from('pemilihan_lagu')
          .select('id')
          .eq('tanggal_ibadah', targetSaturdayDate)
          .maybeSingle()

        if (existing) {
          // Update data yang sudah ada
          const { error } = await supabase
            .from('pemilihan_lagu')
            .update({
              video_url: videoUrlInput,
              selected_slides: selectedSlides,
              selected_theme: currentTheme,
            })
            .eq('tanggal_ibadah', targetSaturdayDate)

          if (error) throw error
        } else {
          // Buat baris baru jika belum ada
          const { error } = await supabase
            .from('pemilihan_lagu')
            .insert({
              tanggal_ibadah: targetSaturdayDate,
              video_url: videoUrlInput,
              selected_slides: selectedSlides,
              selected_theme: currentTheme,
            })

          if (error) throw error
        }
      }

      setSaveStatus('Berhasil disimpan & disinkronkan ke semua device!')
      setTimeout(() => setSaveStatus(''), 3500)
    } catch (e: any) {
      console.error(e)
      setSaveStatus('Gagal menyimpan ke server!')
    }
  }

  const handleStart = async () => {
    if (selectedSlides.length === 0) return
    await handleSaveOnly()
    router.push('/presentasi')
  }

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0]
  const progressPct = useMemo(
    () => Math.round((selectedSlides.length / SLIDE_OPTIONS.length) * 100),
    [selectedSlides]
  )

  return (
    <div
      className="min-h-screen pb-32 transition-colors duration-500"
      style={{ background: activeThemeObj.bg }}
    >
      <main className="relative max-w-5xl mx-auto px-5 md:px-8 pt-10 md:pt-14 space-y-7">
        <div className="reveal card-glass-dark p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{ fontFamily: "'Cormorant Garamond', serif", backgroundImage: 'linear-gradient(90deg, #FCE38A, #F4D35E, #E0A93A)' }}>
                Pilih Slide &amp; Tema Liturgi
              </h1>
              <p className="text-amber-100/60 text-sm">Perubahan akan langsung tersinkron ke semua perangkat penampil.</p>
            </div>
          </div>
          <span className="badge-gold text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
            {selectedSlides.length} / {SLIDE_OPTIONS.length} Slide
          </span>
        </div>

        {/* Pilihan Tema */}
        <div className="reveal delay-1 card-glass-dark p-5 rounded-2xl space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/80">🎨 Pilih Tema Tampilan Presentasi</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setCurrentTheme(t.id); setSaveStatus('') }}
                className={`p-3 rounded-xl text-left border transition text-xs font-semibold flex flex-col gap-1 ${currentTheme === t.id ? 'bg-amber-400/20 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400/50' : 'bg-white/5 border-amber-400/15 text-amber-200/70 hover:bg-white/10'}`}
              >
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bagian Input Link Video (YouTube / Google Drive) */}
        <div className="reveal delay-1 card-glass-dark p-5 rounded-2xl space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/80">
            🎥 Link Video (YouTube / Google Drive)
          </label>
          
          <div className="relative">
            <input
              type="url"
              placeholder="Masukkan link YouTube atau Google Drive..."
              value={videoUrlInput}
              onChange={(e) => {
                setVideoUrlInput(e.target.value)
              }}
              className="w-full p-3.5 rounded-xl text-xs bg-black/40 border border-amber-400/20 text-amber-100 placeholder-amber-100/30 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <p className="text-[11px] text-amber-200/50">
            💡 Masukkan tautan YouTube atau Google Drive (Pastikan akses file Drive diset &quot;Anyone with the link can view&quot;).
          </p>

          {videoUrlInput && (
            <p className="text-[11px] text-emerald-300 truncate pt-1">
              ✔ Link Terpasang: <a href={videoUrlInput} target="_blank" rel="noreferrer" className="underline">{videoUrlInput}</a>
            </p>
          )}
        </div>

        {/* Progress bar & aksi */}
        <div className="reveal delay-1 card-glass-dark p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
            </div>
            <span className="text-xs text-amber-200/70 font-semibold w-10 text-right">{progressPct}%</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button onClick={selectAll} className="btn-ghost text-xs font-semibold px-3.5 py-2 rounded-lg">✓ Pilih Semua</button>
              <button onClick={clearAll} className="btn-ghost text-xs font-semibold px-3.5 py-2 rounded-lg">✕ Hapus Semua</button>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus && <span className="text-xs text-emerald-300 font-medium animate-pulse">{saveStatus}</span>}
              <button onClick={handleSaveOnly} className="btn-ghost text-xs font-semibold px-4 py-2 rounded-lg border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20">💾 Simpan Konfigurasi</button>
            </div>
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
                className={`slide-card relative text-left p-4 rounded-xl transition ${isSelected ? 'slide-card-selected' : ''}`}
                style={{ animationDelay: `${0.03 * idx}s` }}
              >
                <div className="flex items-start gap-3">
                  <span className={`checkbox-dot ${isSelected ? 'checkbox-dot-on' : ''}`}>
                    {isSelected && <svg viewBox="0 0 20 20" width="12" height="12" fill="none"><path d="M4 10.5L8 14.5L16 5.5" stroke="#241246" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-semibold tracking-wider uppercase text-amber-300/50 mb-0.5">Slide {slide.id + 1}</span>
                    <span className={`block text-sm font-semibold leading-snug ${isSelected ? 'text-amber-50' : 'text-amber-100/80'}`}>{slide.label}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 action-bar">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center gap-4">
          <div className="hidden sm:block text-[11px] text-amber-100/60">{selectedSlides.length === 0 ? 'Belum ada slide dipilih' : `${selectedSlides.length} slide siap ditampilkan`}</div>
          <button onClick={handleStart} disabled={selectedSlides.length === 0} className="btn-gold flex-1 sm:flex-none sm:ml-auto py-3 px-8 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed">
            Simpan &amp; Mulai Presentasi →
          </button>
        </div>
      </div>

      <style jsx global>{`
        .card-glass-dark { background: rgba(255,255,255,.04); border: 1px solid rgba(244,211,94,.18); box-shadow: 0 8px 24px rgba(0,0,0,.25); backdrop-filter: blur(6px); }
        .badge-gold { color: #241246; background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A); }
        .btn-ghost { color: #FCE9B0; background: rgba(255,255,255,.04); border: 1px solid rgba(244,211,94,.25); transition: background .18s ease; }
        .btn-ghost:hover { background: rgba(244,211,94,.1); }
        .progress-track { width: 100%; height: 6px; border-radius: 9999px; background: rgba(244,211,94,.15); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #F4D35E, #FFF3C4); }
        .slide-card { background: rgba(255,255,255,.03); border: 1px solid rgba(244,211,94,.14); }
        .slide-card-selected { background: rgba(244,211,94,.1); border-color: rgba(244,211,94,.55); }
        .checkbox-dot { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid rgba(244,211,94,.4); display: flex; align-items: center; justify-content: center; }
        .checkbox-dot-on { background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A); border-color: transparent; }
        .action-bar { background: linear-gradient(180deg, rgba(20,10,46,0) 0%, #140A2E 30%, #140A2E 100%); border-top: 1px solid rgba(244,211,94,.15); padding-top: 8px; }
      `}</style>
    </div>
  )
}