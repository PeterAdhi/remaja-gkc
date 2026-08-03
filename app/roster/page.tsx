'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function RosterPage() {
  const [isAdmin, setIsAdmin] = useState<any>(false)
  const [rosterList, setRosterList] = useState<any>([])
  const [tanggalSabtu, setTanggalSabtu] = useState<any>('')

  const [liturgos, setLiturgos] = useState<any>('')
  const [usherKolektan, setUsherKolektan] = useState<any>('')
  const [doaSyafaat, setDoaSyafaat] = useState<any>('')
  const [warta, setWarta] = useState<any>('')
  const [multimedia, setMultimedia] = useState<any>('')
  const [pendamping, setPendamping] = useState<any>('')
  const [timMusik, setTimMusik] = useState<any>('')
  const [loading, setLoading] = useState<any>(false)
  const [searchTerm, setSearchTerm] = useState<any>('')

  useEffect(() => {
    const checkAdmin = () => {
      try {
        const status = localStorage.getItem('isAdminRemaja')
        setIsAdmin(status === 'true')
      } catch (err) {
        console.error('Gagal membaca localStorage:', err)
      }
    }

    checkAdmin()
    window.addEventListener('storage', checkAdmin)
    const interval = setInterval(checkAdmin, 500)

    fetchRoster()

    return () => {
      window.removeEventListener('storage', checkAdmin)
      clearInterval(interval)
    }
  }, [])

  async function fetchRoster() {
    try {
      const { data, error } = await supabase
        .from('roster_penatalayanan')
        .select('*')
        .order('tanggal_sabtu', { ascending: true })

      if (error) {
        console.error('Error fetching roster:', error.message)
      } else if (data) {
        setRosterList(data)
      }
    } catch (err) {
      console.error('Terjadi kesalahan saat mengambil data:', err)
    }
  }

  async function handleTambahRoster(e) {
    e.preventDefault()
    if (!tanggalSabtu) {
      alert('Tanggal Sabtu harus diisi!')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('roster_penatalayanan').insert([
        {
          tanggal_sabtu: tanggalSabtu,
          liturgos: liturgos,
          usher_kolektan: usherKolektan,
          doa_syafaat: doaSyafaat,
          warta: warta,
          multimedia: multimedia,
          pendamping: pendamping,
          tim_musik: timMusik
        }
      ])

      if (error) {
        alert('Gagal menambah roster: ' + error.message)
      } else {
        alert('Roster pelayanan berhasil ditambahkan!')
        setTanggalSabtu('')
        setLiturgos('')
        setUsherKolektan('')
        setDoaSyafaat('')
        setWarta('')
        setMultimedia('')
        setPendamping('')
        setTimMusik('')
        fetchRoster()
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus roster ini?')) return

    try {
      const { error } = await supabase.from('roster_penatalayanan').delete().eq('id', id)
      if (error) {
        alert('Gagal menghapus: ' + error.message)
      } else {
        fetchRoster()
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem: ' + err.message)
    }
  }

  const filteredRoster = rosterList.filter((item) => {
    const q = searchTerm.toLowerCase()
    return (
      item.tanggal_sabtu?.toLowerCase().includes(q) ||
      item.liturgos?.toLowerCase().includes(q) ||
      item.usher_kolektan?.toLowerCase().includes(q) ||
      item.doa_syafaat?.toLowerCase().includes(q) ||
      item.warta?.toLowerCase().includes(q) ||
      item.multimedia?.toLowerCase().includes(q) ||
      item.pendamping?.toLowerCase().includes(q) ||
      item.tim_musik?.toLowerCase().includes(q)
    )
  })

  return (
    <main className="max-w-7xl mx-auto p-5 md:p-12 space-y-7">

      {/* Header */}
      <div className="reveal card-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗓️</span>
          <div>
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                backgroundImage: 'linear-gradient(90deg, #6B4FBB, #B4862F)',
              }}
            >
              Roster Pelayanan Ibadah Remaja
            </h1>
            <p className="text-gray-500 text-sm">Jadwal petugas pelayan ibadah remaja setiap hari Sabtu.</p>
          </div>
        </div>
      </div>

      {/* FORM TAMBAH ROSTER - HANYA MUNCUL JIKA ADMIN AKTIF */}
      {isAdmin && (
        <div className="reveal delay-1 tilt-card card-glass p-6 rounded-2xl space-y-4">
          <div className="space-y-1">
            <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Form Admin
            </span>
            <h2
              className="text-xl font-bold text-gray-800 mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              ➕ Tambah Roster Pelayanan Baru
            </h2>
          </div>
          <form onSubmit={handleTambahRoster} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Liturgos</label>
                <input
                  type="text"
                  placeholder="Nama Liturgos"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={liturgos}
                  onChange={(e) => setLiturgos(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Usher & Kolektan</label>
                <input
                  type="text"
                  placeholder="Nama Usher & Kolektan"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={usherKolektan}
                  onChange={(e) => setUsherKolektan(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Doa Syafaat</label>
                <input
                  type="text"
                  placeholder="Nama Petugas Doa Syafaat"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={doaSyafaat}
                  onChange={(e) => setDoaSyafaat(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Warta</label>
                <input
                  type="text"
                  placeholder="Nama Petugas Warta"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={warta}
                  onChange={(e) => setWarta(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Multimedia</label>
                <input
                  type="text"
                  placeholder="Nama Petugas Multimedia"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={multimedia}
                  onChange={(e) => setMultimedia(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pendamping</label>
                <input
                  type="text"
                  placeholder="Nama Pendamping"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={pendamping}
                  onChange={(e) => setPendamping(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tim Musik</label>
                <input
                  type="text"
                  placeholder="Nama Anggota Tim Musik"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={timMusik}
                  onChange={(e) => setTimMusik(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-gold text-sm font-bold px-6 py-2.5 rounded-lg disabled:opacity-60"
              >
                {loading ? 'Menyimpan...' : 'Simpan Roster Pelayanan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DAFTAR ROSTER */}
      <div className="reveal delay-2 card-glass p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Katalog Roster
            </span>
            <h2
              className="text-xl font-bold text-gray-800 mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              📋 Daftar Roster Pelayanan
            </h2>
          </div>
          <span className="btn-gold text-xs font-semibold px-3 py-1.5 rounded-lg">
            {rosterList.length} Roster
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/50 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Cari tanggal atau nama petugas..."
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

        {/* List Roster */}
        {filteredRoster.length > 0 ? (
          <div className="rounded-lg overflow-hidden divide-y" style={{ border: '1px solid rgba(212,175,55,.25)' }}>
            {filteredRoster.map((item) => (
              <div
                key={item.id}
                className="table-row p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1 w-full">
                  <span className="badge-gold text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Sabtu, {item.tanggal_sabtu}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-700 mt-2">
                    <p>📜 <b>Liturgos:</b> {item.liturgos || '-'}</p>
                    <p>👥 <b>Usher & Kolektan:</b> {item.usher_kolektan || '-'}</p>
                    <p>🙏 <b>Doa Syafaat:</b> {item.doa_syafaat || '-'}</p>
                    <p>📢 <b>Warta:</b> {item.warta || '-'}</p>
                    <p>💻 <b>Multimedia:</b> {item.multimedia || '-'}</p>
                    <p>🤝 <b>Pendamping:</b> {item.pendamping || '-'}</p>
                    <p>🎸 <b>Tim Musik:</b> {item.tim_musik || '-'}</p>
                  </div>
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
        ) : rosterList.length > 0 ? (
          <p className="text-xs text-gray-500 italic py-4">Tidak ada roster yang cocok dengan pencarian "{searchTerm}".</p>
        ) : (
          <p className="text-xs text-gray-500 italic py-4">Belum ada roster pelayanan yang diinput.</p>
        )}
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