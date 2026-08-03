'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TemaPage() {
  const [isAdmin, setIsAdmin] = useState<any>(false)
  const [jadwalList, setJadwalList] = useState<any>([])
  const [tanggalSabtu, setTanggalSabtu] = useState<any>('')
  const [tema, setTema] = useState<any>('')
  const [tujuan, setTujuan] = useState<any>('')
  const [loading, setLoading] = useState<any>(false)
  const [searchTerm, setSearchTerm] = useState<any>('')

  // Cek status admin dari localStorage saat halaman dimuat
  useEffect(() => {
    const checkAdmin = () => {
      const status = localStorage.getItem('isAdminRemaja')
      setIsAdmin(status === 'true')
    }

    checkAdmin()

    // Event listener untuk mendeteksi perubahan login di tab/navigasi yang sama
    window.addEventListener('storage', checkAdmin)

    // Interval pendek untuk memastikan sinkronisasi langsung saat login dari navbar
    const interval = setInterval(checkAdmin, 500)

    fetchJadwal()

    return () => {
      window.removeEventListener('storage', checkAdmin)
      clearInterval(interval)
    }
  }, [])

  async function fetchJadwal() {
    const { data, error } = await supabase
      .from('jadwal_tema')
      .select('*')
      .order('tanggal_sabtu', { ascending: true })
    if (data) setJadwalList(data)
  }

  async function handleTambahTema(e: any) {
    e.preventDefault()
    if (!tanggalSabtu || !tema || !tujuan) {
      alert('Semua field harus diisi!')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('jadwal_tema').insert([
      { tanggal_sabtu: tanggalSabtu, tema, tujuan }
    ])

    setLoading(false)

    if (error) {
      alert('Gagal menambah jadwal: ' + error.message)
    } else {
      alert('Jadwal tema berhasil ditambahkan!')
      setTanggalSabtu('')
      setTema('')
      setTujuan('')
      fetchJadwal()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return
    const { error } = await supabase.from('jadwal_tema').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      fetchJadwal()
    }
  }

  const filteredJadwal = jadwalList.filter((item) =>
    item.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tanggal_sabtu.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="max-w-7xl mx-auto p-5 md:p-12 space-y-7">

      {/* Header */}
      <div className="reveal card-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                backgroundImage: 'linear-gradient(90deg, #6B4FBB, #B4862F)',
              }}
            >
              Jadwal & Tema Ibadah Remaja
            </h1>
            <p className="text-gray-500 text-sm">Daftar tema dan tujuan firman Tuhan untuk ibadah remaja setiap hari Sabtu.</p>
          </div>
        </div>
      </div>

      {/* Grid: Form & Daftar Jadwal */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : ''} gap-6`}>

        {/* Kotak Form Tambah Tema - HANYA MUNCUL JIKA ADMIN AKTIF */}
        {isAdmin && (
          <div className="reveal delay-1 tilt-card card-glass p-6 rounded-2xl space-y-4 md:col-span-1">
            <div className="space-y-1">
              <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Form Admin
              </span>
              <h2
                className="text-xl font-bold text-gray-800 mt-1"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                ➕ Tambah Jadwal & Tema
              </h2>
            </div>
            <form onSubmit={handleTambahTema} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Sabtu</label>
                <input
                  type="date"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={tanggalSabtu}
                  onChange={(e) => setTanggalSabtu(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tema Ibadah</label>
                <input
                  type="text"
                  placeholder="Contoh: Hidup dalam Ketaatan"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tujuan / Poin Firman</label>
                <textarea
                  rows="3"
                  placeholder="Contoh: Remaja belajar taat..."
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                {loading ? 'Menyimpan...' : 'Simpan Jadwal Tema'}
              </button>
            </form>
          </div>
        )}

        {/* Kotak Daftar Jadwal Tema */}
        <div className={`reveal delay-2 card-glass p-6 rounded-2xl space-y-4 ${isAdmin ? 'md:col-span-2' : ''}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Katalog Jadwal
              </span>
              <h2
                className="text-xl font-bold text-gray-800 mt-1"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                📅 Daftar Jadwal Tema
              </h2>
            </div>
            <span className="btn-gold text-xs font-semibold px-3 py-1.5 rounded-lg">
              {jadwalList.length} Jadwal
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/50 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari tema atau tanggal..."
              className="w-full pl-9 pr-9 p-2.5 rounded-lg text-sm input-gold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700/50 hover:text-amber-700 text-sm"
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* List Jadwal */}
          {filteredJadwal.length > 0 ? (
            <div className="rounded-lg overflow-hidden divide-y" style={{ border: '1px solid rgba(212,175,55,.25)', borderColor: 'rgba(212,175,55,.25)' }}>
              {filteredJadwal.map((item) => (
                <div
                  key={item.id}
                  className="table-row p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <span className="badge-gold text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Sabtu, {item.tanggal_sabtu}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">"{item.tema}"</h3>
                    <p className="text-xs text-gray-600"><b>Tujuan:</b> {item.tujuan}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-rose-600 border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition shrink-0"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : jadwalList.length > 0 ? (
            <p className="text-xs text-gray-500 italic py-4">Tidak ada jadwal yang cocok dengan pencarian "{searchTerm}".</p>
          ) : (
            <p className="text-xs text-gray-500 italic py-4">Belum ada jadwal tema yang diinput.</p>
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

        .table-row {
          border-top: 1px solid rgba(212,175,55,.2);
          transition: background .15s ease;
        }
        .table-row:first-child {
          border-top: none;
        }
        .table-row:hover {
          background: #FBF6EA;
        }

        .tilt-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .tilt-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(60,30,110,.2);
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
          .reveal, .tilt-card, .btn-gold, .table-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}