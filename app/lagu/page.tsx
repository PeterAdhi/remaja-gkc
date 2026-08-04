'use client'
import { useState, useEffect, FormEvent, ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { supabase } from '@/lib/supabase'

interface Lagu {
  id: string | number
  judul_lagu: string
  lirik: string
}

interface NewLaguState {
  judul_lagu: string
  lirik: string
}

interface SlotDef {
  key: string
  label: string
  icon: string
}

// Urutan slot lagu ibadah. Ada 2 slot "Lagu Pujian" sesuai susunan liturgi.
const SLOTS: SlotDef[] = [
  { key: 'pembuka', label: 'Lagu Pembuka', icon: '🎼' },
  { key: 'pujian_1', label: 'Lagu Pujian', icon: '🎶' },
  { key: 'pengantar_firman', label: 'Lagu Pengantar Firman', icon: '📖' },
  { key: 'pengantar_doa_syafaat', label: 'Lagu Pengantar Doa Syafaat', icon: '🙏' },
  { key: 'persembahan', label: 'Lagu Persembahan', icon: '💝' },
  { key: 'pujian_2', label: 'Lagu Pujian', icon: '🎶' },
  { key: 'doksologi', label: 'Doxologi', icon: '✨' },
]

// Format tanggal Indonesia lengkap, contoh: "Sabtu, 8 Agustus 2026"
function formatTanggalLengkap(tgl?: string): string {
  if (!tgl) return '-'
  try {
    const d = new Date(tgl)
    if (isNaN(d.getTime())) return tgl
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return tgl
  }
}

// Hitung tanggal Sabtu yang akan datang (kalau hari ini Sabtu, pakai hari ini; reset otomatis setelah lewat tengah malam Sabtu)
function getTargetSaturday(): string {
  const today = new Date()
  const day = today.getDay()
  const distance = (6 - day + 7) % 7
  const target = new Date(today)
  target.setDate(today.getDate() + distance)
  return target.toISOString().split('T')[0]
}

function getPrevSaturday(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

export default function LaguPage() {
  const [laguList, setLaguList] = useState<Lagu[]>([])
  const [newLagu, setNewLagu] = useState<NewLaguState>({ judul_lagu: '', lirik: '' })
  const [loadingLagu, setLoadingLagu] = useState<boolean>(false)
  const [searchLagu, setSearchLagu] = useState<string>('')
  const [selectedLagu, setSelectedLagu] = useState<Lagu | null>(null)

  // ==== State untuk pagination daftar lagu tersimpan ====
  const [currentPage, setCurrentPage] = useState<number>(1)
  const ITEMS_PER_PAGE = 9

  // ==== State untuk form pilihan lagu mingguan ====
  const [targetSaturday, setTargetSaturday] = useState<string>(getTargetSaturday())
  const [pilihanMinggu, setPilihanMinggu] = useState<Record<string, string>>({})
  const [laguMingguLaluSet, setLaguMingguLaluSet] = useState<Set<string>>(new Set())
  const [loadingPilihan, setLoadingPilihan] = useState<boolean>(true)
  const [savingPilihan, setSavingPilihan] = useState<boolean>(false)

  // ==== State untuk pencarian judul lagu per slot (combobox) ====
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [openSlot, setOpenSlot] = useState<string | null>(null)

  useEffect(() => {
    fetchLagu()
    fetchPilihanMingguan()

    // Cek berkala kalau tanggal sasaran (Sabtu) berubah, misalnya lewat tengah malam
    const interval = setInterval(() => {
      const currentTarget = getTargetSaturday()
      setTargetSaturday((prev) => (prev !== currentTarget ? currentTarget : prev))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Kalau targetSaturday berubah (minggu baru), muat ulang pilihan
  useEffect(() => {
    fetchPilihanMingguan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSaturday])

  // Tutup pop up dengan tombol Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent | any) {
      if (e.key === 'Escape') {
        setSelectedLagu(null)
        setOpenSlot(null)
      }
    }
    window.addEventListener('keydown', handleEsc as EventListener)
    return () => window.removeEventListener('keydown', handleEsc as EventListener)
  }, [])

  // Reset ke halaman 1 setiap kali kata kunci pencarian berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchLagu])

  const filteredLaguList = laguList.filter((l: Lagu) =>
    l.judul_lagu.toLowerCase().includes(searchLagu.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filteredLaguList.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedLaguList = filteredLaguList.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  )

  async function fetchLagu() {
    try {
      const { data, error } = await supabase.from('lagu').select('*').order('judul_lagu', { ascending: true })
      if (error) {
        console.error('Error fetching lagu:', error.message)
      } else if (data) {
        setLaguList(data)
      }
    } catch (err: unknown) {
      console.error('Terjadi kesalahan saat mengambil data lagu:', err)
    }
  }

  // Tangani paste di kolom lirik: ambil teks polos apa adanya (termasuk baris kosong & spasi asli),
  // sisipkan tepat di posisi kursor, tanpa dirapikan/diformat ulang oleh browser.
  function handlePasteLirik(e: ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text/plain')
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = newLagu.lirik.substring(0, start)
    const after = newLagu.lirik.substring(end)
    const updated = before + pastedText + after

    setNewLagu((prev) => ({ ...prev, lirik: updated }))

    // Kembalikan posisi kursor setelah teks yang baru saja ditempel
    requestAnimationFrame(() => {
      const newCursorPos = start + pastedText.length
      textarea.selectionStart = newCursorPos
      textarea.selectionEnd = newCursorPos
    })
  }

  async function handleTambahLagu(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingLagu(true)
    try {
      const { error } = await supabase.from('lagu').insert([newLagu])
      if (error) {
        alert('Gagal: ' + error.message)
      } else {
        alert('Lagu berhasil ditambahkan!')
        setNewLagu({ judul_lagu: '', lirik: '' })
        fetchLagu()
      }
    } catch (err: any) {
      alert('Terjadi kesalahan sistem: ' + (err?.message || err))
    } finally {
      setLoadingLagu(false)
    }
  }

  // Muat pilihan lagu minggu ini (targetSaturday) dan lagu yang dipakai Sabtu lalu (untuk validasi)
  async function fetchPilihanMingguan() {
    setLoadingPilihan(true)
    const target = getTargetSaturday()
    const prev = getPrevSaturday(target)

    try {
      const { data: dataMingguIni, error: errIni } = await supabase
        .from('pemilihan_lagu')
        .select('kategori, lagu_id')
        .eq('tanggal_ibadah', target)

      if (errIni) {
        console.error('Gagal memuat pilihan minggu ini:', errIni.message)
      } else if (dataMingguIni) {
        const mapMingguIni: Record<string, string> = {}
        dataMingguIni.forEach((row: any) => {
          if (row.kategori && row.lagu_id) {
            mapMingguIni[row.kategori] = String(row.lagu_id)
          }
        })
        setPilihanMinggu(mapMingguIni)
      }

      const { data: dataMingguLalu, error: errLalu } = await supabase
        .from('pemilihan_lagu')
        .select('lagu_id')
        .eq('tanggal_ibadah', prev)

      if (errLalu) {
        console.error('Gagal memuat pilihan minggu lalu:', errLalu.message)
      } else if (dataMingguLalu) {
        const setLalu = new Set<string>(
          dataMingguLalu.filter((row: any) => row.lagu_id).map((row: any) => String(row.lagu_id))
        )
        setLaguMingguLaluSet(setLalu)
      }
    } catch (err) {
      console.error('Terjadi kesalahan saat memuat pilihan lagu mingguan:', err)
    } finally {
      setLoadingPilihan(false)
    }
  }

  function handlePilihSlot(slotKey: string, laguId: string) {
    if (laguId && laguMingguLaluSet.has(laguId)) {
      const judul = laguList.find((l: Lagu) => String(l.id) === laguId)?.judul_lagu || 'Lagu ini'
      alert(
        `⚠️ "${judul}" sudah dinyanyikan pada ibadah Sabtu lalu (${formatTanggalLengkap(getPrevSaturday(targetSaturday))}).\n\nLagu ini baru bisa dipilih kembali untuk Sabtu depannya. Silakan pilih lagu lain untuk slot ini.`
      )
      return
    }
    setPilihanMinggu((prev) => ({ ...prev, [slotKey]: laguId }))
    setSearchQueries((prev) => ({ ...prev, [slotKey]: '' }))
    setOpenSlot(null)
  }

  function handleClearSlot(slotKey: string) {
    setPilihanMinggu((prev) => ({ ...prev, [slotKey]: '' }))
    setSearchQueries((prev) => ({ ...prev, [slotKey]: '' }))
  }

  async function handleSimpanPilihan() {
    setSavingPilihan(true)
    try {
      const rows = SLOTS.map((slot) => ({
        tanggal_ibadah: targetSaturday,
        kategori: slot.key,
        lagu_id: pilihanMinggu[slot.key] ? pilihanMinggu[slot.key] : null,
      }))

      const { error } = await supabase
        .from('pemilihan_lagu')
        .upsert(rows, { onConflict: 'tanggal_ibadah,kategori' })

      if (error) {
        alert('Gagal menyimpan pilihan lagu: ' + error.message)
      } else {
        alert('Pilihan lagu untuk ibadah Sabtu berhasil disimpan!')
        fetchPilihanMingguan()
      }
    } catch (err: any) {
      alert('Terjadi kesalahan sistem: ' + (err?.message || err))
    } finally {
      setSavingPilihan(false)
    }
  }

  const jumlahTerisi = SLOTS.filter((s) => !!pilihanMinggu[s.key]).length

  return (
    <main className="max-w-7xl mx-auto p-5 md:p-12 space-y-7">

      {/* Header */}
      <div className="reveal card-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎵</span>
          <div>
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                backgroundImage: 'linear-gradient(90deg, #6B4FBB, #B4862F)',
              }}
            >
              Manajemen Lagu & Katalog Ibadah
            </h1>
            <p className="text-gray-500 text-sm">Kelola daftar lagu serta susun urutan lagu untuk ibadah Sabtu.</p>
          </div>
        </div>
      </div>

      {/* Kotak: Tambah Lagu Baru */}
      <div className="reveal delay-1 tambah-lagu-card rounded-2xl">
        <div className="tambah-lagu-accent" />
        <span className="tambah-lagu-watermark">🎵</span>
        <div className="tambah-lagu-body p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Katalog Lagu
              </span>
              <h2
                className="text-xl font-bold text-gray-800 mt-1"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                ➕ Tambah Lagu Baru
              </h2>
              <p className="text-xs text-gray-500">Simpan judul beserta lirik lengkap untuk ditambahkan ke katalog lagu ibadah.</p>
            </div>
            <span className="badge-gold text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
              {laguList.length} Lagu Tersimpan
            </span>
          </div>

          <form onSubmit={handleTambahLagu} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                <span className="text-amber-600">🎼</span> Judul Lagu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/40 text-sm">🎵</span>
                <input
                  type="text"
                  placeholder="Contoh: Ku Ingin Menyembah-Mu"
                  required
                  className="w-full pl-9 pr-3 p-2.5 rounded-lg text-sm input-gold"
                  value={newLagu.judul_lagu}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLagu({ ...newLagu, judul_lagu: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <span className="text-amber-600">📜</span> Lirik Lagu
                </label>
                <span className="text-[10px] text-gray-400">{newLagu.lirik.length} karakter</span>
              </div>
              <textarea
                rows={6}
                placeholder={'Tuliskan lirik lengkap di sini...\n\nBait 1:\n...\n\nReff:\n...'}
                required
                className="w-full p-3 rounded-lg text-sm input-gold lirik-textarea"
                value={newLagu.lirik}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewLagu({ ...newLagu, lirik: e.target.value })}
                onPaste={handlePasteLirik}
              />
              <p className="text-[10px] text-gray-400 mt-1">Tips: pisahkan bait dan reff dengan baris kosong agar lebih mudah dibaca di halaman lirik.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                disabled={loadingLagu}
                className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                {loadingLagu ? 'Menyimpan...' : '💾 Tambah Lagu ke Katalog'}
              </button>
              {(newLagu.judul_lagu || newLagu.lirik) && (
                <button
                  type="button"
                  onClick={() => setNewLagu({ judul_lagu: '', lirik: '' })}
                  className="text-xs font-semibold text-rose-600 border border-rose-300 px-4 py-2.5 rounded-lg hover:bg-rose-50 hover:border-rose-400 transition"
                >
                  Bersihkan Form
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Kotak: Form Pilih Lagu Ibadah Mingguan */}
      <div className="reveal delay-2 tilt-card text-white p-6 rounded-2xl shadow-md space-y-5"
        style={{ background: 'linear-gradient(135deg, #2B1B63, #4A2E8C 60%, #5C3A9E)' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <span className="badge-gold text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Susunan Lagu Ibadah
            </span>
            <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              🎼 Lagu untuk Ibadah {formatTanggalLengkap(targetSaturday)}
            </h2>
            <p className="text-xs text-indigo-100/80">
              Ketik judul lagu untuk mencari dan memilih. Lagu yang sudah dinyanyikan Sabtu lalu tidak dapat dipilih
              lagi minggu ini. Form ini otomatis kosong lagi untuk Sabtu berikutnya setelah ibadah selesai.
            </p>
          </div>
          <span className="btn-gold text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
            {jumlahTerisi}/{SLOTS.length} Dipilih
          </span>
        </div>

        {loadingPilihan ? (
          <p className="text-xs text-indigo-100/70 italic py-2">Memuat pilihan lagu...</p>
        ) : laguList.length === 0 ? (
          <p className="text-xs text-indigo-100/80 italic py-2">
            Belum ada lagu di katalog. Tambahkan lagu terlebih dahulu di kotak "Tambah Lagu Baru" di atas.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {SLOTS.map((slot, idx) => {
              const uniqueKey = `${slot.key}-${idx}`
              const laguId = pilihanMinggu[slot.key] || ''
              const laguTerpilih = laguId ? laguList.find((l: Lagu) => String(l.id) === laguId) : null
              const query = searchQueries[slot.key] || ''
              const isOpen = openSlot === slot.key
              const suggestions = laguList
                .filter((l: Lagu) => l.judul_lagu.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8)

              return (
                <div key={uniqueKey} className="slot-box p-3 rounded-lg relative">
                  <label className="text-xs font-semibold text-amber-100 flex items-center gap-1.5 mb-1.5">
                    <span>{slot.icon}</span> {slot.label}
                  </label>

                  {laguTerpilih ? (
                    <div className="selected-chip flex items-center justify-between gap-2 p-2.5 rounded-lg">
                      <span className="text-sm font-semibold truncate">🎵 {laguTerpilih.judul_lagu}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedLagu(laguTerpilih)}
                          className="text-[10px] font-semibold text-amber-200 hover:text-amber-100 underline"
                        >
                          Lirik
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearSlot(slot.key)}
                          aria-label="Ganti pilihan lagu"
                          className="text-xs text-white/70 hover:text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari judul lagu..."
                        className="w-full p-2.5 rounded-lg text-sm input-gold-dark"
                        value={query}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setSearchQueries((prev) => ({ ...prev, [slot.key]: e.target.value }))
                          setOpenSlot(slot.key)
                        }}
                        onFocus={() => setOpenSlot(slot.key)}
                        onBlur={() => setTimeout(() => setOpenSlot((prev) => (prev === slot.key ? null : prev)), 150)}
                      />
                      {isOpen && (
                        <div className="suggestion-list absolute z-20 left-0 right-0 mt-1 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                          {suggestions.length > 0 ? (
                            suggestions.map((l: Lagu) => (
                              <button
                                key={l.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handlePilihSlot(slot.key, String(l.id))
                                }}
                                className="suggestion-item w-full text-left px-3 py-2 text-sm"
                              >
                                🎵 {l.judul_lagu}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-white/60 italic">Lagu tidak ditemukan</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSimpanPilihan}
            disabled={savingPilihan || loadingPilihan || laguList.length === 0}
            className="btn-gold text-sm font-bold px-6 py-2.5 rounded-lg disabled:opacity-60"
          >
            {savingPilihan ? 'Menyimpan...' : '💾 Simpan Susunan Lagu'}
          </button>
        </div>
      </div>

      {/* Daftar Lagu Tersimpan */}
      <div className="reveal delay-3 card-glass p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Katalog Tersimpan
            </span>
            <h2
              className="text-xl font-bold text-gray-800 mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              🎶 Daftar Lagu
            </h2>
          </div>
          <span className="btn-gold text-xs font-semibold px-3 py-1.5 rounded-lg">
            {laguList.length} Lagu
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/50 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Cari judul lagu..."
            className="w-full pl-9 pr-9 p-2.5 rounded-lg text-sm input-gold"
            value={searchLagu}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchLagu(e.target.value)}
          />
          {searchLagu && (
            <button
              onClick={() => setSearchLagu('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700/50 hover:text-amber-700 text-sm"
              aria-label="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>

        {filteredLaguList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {paginatedLaguList.map((l: Lagu) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLagu(l)}
                  className="petugas-box p-3 rounded-lg text-xs text-left cursor-pointer"
                >
                  <span className="font-semibold text-gray-800 block mb-1">🎵 {l.judul_lagu}</span>
                  <span className="text-amber-700/60 line-clamp-3">{l.lirik}</span>
                  <span className="block mt-2 text-[10px] font-semibold link-gold">Lihat Lirik &rarr;</span>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 gap-3 flex-wrap">
                <span className="text-[11px] text-gray-500">
                  Halaman {safePage} dari {totalPages} &middot; {filteredLaguList.length} lagu
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="pagination-btn text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    &larr; Sebelumnya
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-num text-xs font-semibold w-7 h-7 rounded-lg ${
                          page === safePage ? 'pagination-num-active' : ''
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="pagination-btn text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Berikutnya &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        ) : laguList.length > 0 ? (
          <p className="text-xs text-gray-500 italic py-4">Tidak ada lagu yang cocok dengan pencarian "{searchLagu}".</p>
        ) : (
          <p className="text-xs text-gray-500 italic py-4">Belum ada lagu yang ditambahkan.</p>
        )}
      </div>

      {/* MODAL POP UP LIRIK LAGU */}
      {selectedLagu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(27,17,64,.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedLagu(null)}
        >
          <div
            className="modal-pop card-glass rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Lirik Lagu
                </span>
                <h3
                  className="text-xl font-bold text-gray-800 mt-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  🎵 {selectedLagu.judul_lagu}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLagu(null)}
                className="btn-gold text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedLagu.lirik}
            </p>
          </div>
        </div>
      )}

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
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 16px rgba(233,180,76,.5);
        }

        .input-gold {
          background: #FBF6EA;
          border: 1px solid rgba(212,175,55,.3);
          color: #3A2472;
        }
        .input-gold:focus {
          outline: none;
          border-color: #B4862F;
          box-shadow: 0 0 0 3px rgba(212,175,55,.2);
        }

        /* ===== Kartu Tambah Lagu Baru ===== */
        .tambah-lagu-card {
          position: relative;
          display: flex;
          overflow: hidden;
          background: linear-gradient(180deg, #FFFDF8, #FFFFFF);
          border: 1px solid rgba(212,175,55,.28);
          box-shadow: 0 8px 24px rgba(90,60,150,.08);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .tambah-lagu-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 32px rgba(60,30,110,.14);
        }
        .tambah-lagu-accent {
          width: 6px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #6B4FBB, #B4862F);
        }
        .tambah-lagu-body {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .tambah-lagu-watermark {
          position: absolute;
          right: 10px;
          bottom: -18px;
          font-size: 7rem;
          opacity: .05;
          pointer-events: none;
          transform: rotate(-12deg);
        }
        .lirik-textarea {
          font-family: 'Courier New', monospace;
          line-height: 1.6;
          resize: vertical;
        }

        .input-gold-dark {
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(244,211,94,.3);
          color: #fff;
          backdrop-filter: blur(6px);
        }
        .input-gold-dark::placeholder {
          color: rgba(255,255,255,.55);
        }
        .input-gold-dark:focus {
          outline: none;
          border-color: #F4D35E;
          box-shadow: 0 0 0 3px rgba(244,211,94,.25);
        }

        .slot-box {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(244,211,94,.2);
          transition: border-color .2s ease, background .2s ease;
        }
        .slot-box:hover {
          border-color: rgba(244,211,94,.4);
          background: rgba(255,255,255,.09);
        }

        .selected-chip {
          background: rgba(244,211,94,.14);
          border: 1px solid rgba(244,211,94,.35);
        }

        .suggestion-list {
          background: #2B1B63;
          border: 1px solid rgba(244,211,94,.35);
          box-shadow: 0 10px 24px rgba(0,0,0,.35);
        }
        .suggestion-item {
          color: #fff;
          transition: background .15s ease;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .suggestion-item:last-child {
          border-bottom: none;
        }
        .suggestion-item:hover {
          background: rgba(244,211,94,.18);
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
          box-shadow: 0 16px 32px rgba(60,30,110,.2);
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .link-gold {
          color: #B4862F;
        }

        .pagination-btn {
          color: #6B4FBB;
          background: #F1EBFB;
          border: 1px solid rgba(107,79,187,.15);
          transition: transform .15s ease, background .15s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #E6DBFA;
          transform: translateY(-1px);
        }

        .pagination-num {
          color: #6B4FBB;
          background: #F1EBFB;
          border: 1px solid rgba(107,79,187,.15);
          transition: transform .15s ease, background .15s ease;
        }
        .pagination-num:hover {
          background: #E6DBFA;
        }
        .pagination-num-active {
          color: #241246;
          background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A);
          border-color: transparent;
        }

        .modal-pop {
          animation: modalPopIn .22s ease both;
        }
        @keyframes modalPopIn {
          0% { opacity: 0; transform: translateY(10px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .reveal {
          animation: fadeUpDash .5s ease both;
        }
        .delay-1 { animation-delay: .05s; }
        .delay-2 { animation-delay: .1s; }
        .delay-3 { animation-delay: .15s; }
        @keyframes fadeUpDash {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .tilt-card, .petugas-box, .btn-gold, .modal-pop, .slot-box {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}