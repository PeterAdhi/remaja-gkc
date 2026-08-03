'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LaguPage() {
  const [laguList, setLaguList] = useState([])
  const [newLagu, setNewLagu] = useState({ judul_lagu: '', lirik: '' })
  const [loadingLagu, setLoadingLagu] = useState(false)
  const [pilihanForm, setPilihanForm] = useState({ lagu_id: '', tanggal_ibadah: '' })
  const [searchLagu, setSearchLagu] = useState('')
  const [selectedLagu, setSelectedLagu] = useState(null)

  useEffect(() => {
    fetchLagu()
  }, [])

  // Tutup pop up dengan tombol Escape
  useEffect(() => {
    function handleEsc(e: any) {
      if (e.key === 'Escape') setSelectedLagu(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const filteredLaguList = laguList.filter((l) =>
    l.judul_lagu.toLowerCase().includes(searchLagu.toLowerCase())
  )

  async function fetchLagu() {
    const { data } = await supabase.from('lagu').select('*').order('judul_lagu', { ascending: true })
    if (data) setLaguList(data)
  }

  async function handleTambahLagu(e) {
    e.preventDefault()
    setLoadingLagu(true)
    const { error } = await supabase.from('lagu').insert([newLagu])
    if (error) alert('Gagal: ' + error.message)
    else {
      alert('Lagu berhasil ditambahkan!')
      setNewLagu({ judul_lagu: '', lirik: '' })
      fetchLagu()
    }
    setLoadingLagu(false)
  }

  async function handlePilihLagu(e) {
    e.preventDefault()
    const { lagu_id, tanggal_ibadah } = pilihanForm
    const tanggalDipilih = new Date(tanggal_ibadah)
    const satuMingguLalu = new Date(tanggalDipilih)
    satuMingguLalu.setDate(tanggalDipilih.getDate() - 7)
    const formatSatuMingguLalu = satuMingguLalu.toISOString().split('T')[0]

    const { data: riwayatSatuMinggu } = await supabase
      .from('pemilihan_lagu')
      .select('*')
      .eq('lagu_id', lagu_id)
      .eq('tanggal_ibadah', formatSatuMingguLalu)

    if (riwayatSatuMinggu && riwayatSatuMinggu.length > 0) {
      alert('⚠️ PERINGATAN: Lagu ini sudah dinyanyikan minggu lalu (' + formatSatuMingguLalu + ') dan baru bisa dipilih kembali minggu depannya!')
      return
    }

    const { error } = await supabase.from('pemilihan_lagu').insert([{ lagu_id, tanggal_ibadah }])
    if (error) alert('Gagal: ' + error.message)
    else {
      alert('Berhasil menjadwalkan lagu untuk tanggal ' + tanggal_ibadah)
      setPilihanForm({ lagu_id: '', tanggal_ibadah: '' })
    }
  }

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
            <p className="text-gray-500 text-sm">Kelola daftar lagu serta jadwalkan lagu untuk ibadah Sabtu.</p>
          </div>
        </div>
      </div>

      {/* Grid Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Kotak 1: Tambah Lagu Baru */}
        <div className="reveal delay-1 tilt-card card-glass p-6 rounded-2xl space-y-4">
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
          </div>
          <form onSubmit={handleTambahLagu} className="space-y-3">
            <input
              type="text"
              placeholder="Judul Lagu"
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold"
              value={newLagu.judul_lagu}
              onChange={(e) => setNewLagu({ ...newLagu, judul_lagu: e.target.value })}
            />
            <textarea
              rows="4"
              placeholder="Lirik lagu..."
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold"
              value={newLagu.lirik}
              onChange={(e) => setNewLagu({ ...newLagu, lirik: e.target.value })}
            />
            <button
              type="submit"
              disabled={loadingLagu}
              className="w-full btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
            >
              {loadingLagu ? 'Menyimpan...' : 'Tambah Lagu'}
            </button>
          </form>
        </div>

        {/* Kotak 2: Pilih Lagu Ibadah Sabtu */}
        <div className="reveal delay-2 tilt-card text-white p-6 rounded-2xl shadow-md space-y-4"
          style={{ background: 'linear-gradient(135deg, #2B1B63, #4A2E8C 60%, #5C3A9E)' }}
        >
          <div className="space-y-1">
            <span className="badge-gold text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Jadwal Ibadah
            </span>
            <h2 className="text-xl font-bold mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              📅 Pilih Lagu Ibadah Sabtu
            </h2>
            <p className="text-xs text-indigo-100/80">
              Lagu yang sudah dinyanyikan minggu lalu tidak dapat dipilih kembali di minggu yang sama.
            </p>
          </div>
          <form onSubmit={handlePilihLagu} className="space-y-3">
            <select
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold-dark"
              value={pilihanForm.lagu_id}
              onChange={(e) => setPilihanForm({ ...pilihanForm, lagu_id: e.target.value })}
            >
              <option value="">-- Pilih Lagu --</option>
              {laguList.map((l) => (
                <option key={l.id} value={l.id}>{l.judul_lagu}</option>
              ))}
            </select>
            <input
              type="date"
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold-dark"
              value={pilihanForm.tanggal_ibadah}
              onChange={(e) => setPilihanForm({ ...pilihanForm, tanggal_ibadah: e.target.value })}
            />
            <button
              type="submit"
              className="w-full btn-gold py-2.5 rounded-lg text-sm font-bold"
            >
              Jadwalkan Lagu
            </button>
          </form>
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
            onChange={(e) => setSearchLagu(e.target.value)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {filteredLaguList.map((l) => (
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
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
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

        .input-gold-dark {
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(244,211,94,.3);
          color: #fff;
          backdrop-filter: blur(6px);
        }
        .input-gold-dark option {
          color: #241246;
        }
        .input-gold-dark:focus {
          outline: none;
          border-color: #F4D35E;
          box-shadow: 0 0 0 3px rgba(244,211,94,.25);
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
          .reveal, .tilt-card, .petugas-box, .btn-gold, .modal-pop {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}