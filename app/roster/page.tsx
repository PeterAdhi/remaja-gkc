'use client'
import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'

export default function RosterPage() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [rosterList, setRosterList] = useState<any[]>([])
  const [tanggalSabtu, setTanggalSabtu] = useState<string>('')

  const [liturgos, setLiturgos] = useState<string>('')
  const [usherKolektan, setUsherKolektan] = useState<string>('')
  const [doaSyafaat, setDoaSyafaat] = useState<string>('')
  const [warta, setWarta] = useState<string>('')
  const [multimedia, setMultimedia] = useState<string>('')
  const [pendamping, setPendamping] = useState<string>('')
  const [timMusik, setTimMusik] = useState<string>('')
  const [timPiket, setTimPiket] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    const checkAdmin = () => {
      try {
        const status = localStorage.getItem('isAdminRemaja')
        setIsAdmin(status === 'true')
      } catch (err: unknown) {
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
    } catch (err: unknown) {
      console.error('Terjadi kesalahan saat mengambil data:', err)
    }
  }

  async function handleTambahRoster(e: FormEvent<HTMLFormElement>) {
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
          tim_musik: timMusik,
          tim_piket: timPiket
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
        setTimPiket('')
        fetchRoster()
      }
    } catch (err: any) {
      alert('Terjadi kesalahan sistem: ' + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string | number) {
    if (!confirm('Yakin ingin menghapus roster ini?')) return

    try {
      const { error } = await supabase.from('roster_penatalayanan').delete().eq('id', id)
      if (error) {
        alert('Gagal menghapus: ' + error.message)
      } else {
        fetchRoster()
      }
    } catch (err: any) {
      alert('Terjadi kesalahan sistem: ' + (err?.message || err))
    }
  }

  const filteredRoster = rosterList.filter((item: any) => {
    const q = searchTerm.toLowerCase()
    return (
      item.tanggal_sabtu?.toLowerCase().includes(q) ||
      item.liturgos?.toLowerCase().includes(q) ||
      item.usher_kolektan?.toLowerCase().includes(q) ||
      item.doa_syafaat?.toLowerCase().includes(q) ||
      item.warta?.toLowerCase().includes(q) ||
      item.multimedia?.toLowerCase().includes(q) ||
      item.pendamping?.toLowerCase().includes(q) ||
      item.tim_musik?.toLowerCase().includes(q) ||
      item.tim_piket?.toLowerCase().includes(q)
    )
  })

  // Helper format tanggal biar lebih enak dibaca (sama seperti halaman Tema)
  function formatTanggal(tgl: string) {
    try {
      const d = new Date(tgl)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return tgl
    }
  }

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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTanggalSabtu(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Liturgos</label>
                <input
                  type="text"
                  placeholder="Nama Liturgos"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={liturgos}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLiturgos(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Usher & Kolektan</label>
                <input
                  type="text"
                  placeholder="Nama Usher & Kolektan"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={usherKolektan}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUsherKolektan(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Doa Syafaat</label>
                <input
                  type="text"
                  placeholder="Nama Petugas Doa Syafaat"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={doaSyafaat}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDoaSyafaat(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Warta</label>
                <input
                  type="text"
                  placeholder="Nama Petugas Warta"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={warta}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setWarta(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Multimedia</label>
                <input
                  type="text"
                  placeholder="Nama Petugas Multimedia"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={multimedia}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMultimedia(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pendamping</label>
                <input
                  type="text"
                  placeholder="Nama Pendamping"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={pendamping}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPendamping(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tim Musik</label>
                <input
                  type="text"
                  placeholder="Nama Anggota Tim Musik"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={timMusik}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTimMusik(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tim Piket</label>
                <input
                  type="text"
                  placeholder="Nama Anggota Tim Piket"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={timPiket}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTimPiket(e.target.value)}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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

        {/* List Roster - desain kartu seperti halaman Tema */}
        {filteredRoster.length > 0 ? (
          <div className="space-y-4">
            {filteredRoster.map((item: any, idx: number) => (
              <div key={item.id} className="jadwal-card reveal" style={{ animationDelay: `${0.03 * idx}s` }}>
                <div className="jadwal-card-accent" />
                <div className="jadwal-card-body">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="jadwal-icon">📅</span>
                      <span className="badge-gold text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                        Sabtu, {formatTanggal(item.tanggal_sabtu)}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-rose-600 border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:border-rose-400 transition shrink-0"
                      >
                        🗑️ Hapus
                      </button>
                    )}
                  </div>

                  <div className="jadwal-divider" />

                  <div className="petugas-grid">
                    <div className="petugas-item">
                      <span className="petugas-icon">📜</span>
                      <div>
                        <span className="petugas-label">Liturgos</span>
                        <p className="petugas-value">{item.liturgos || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">👥</span>
                      <div>
                        <span className="petugas-label">Usher & Kolektan</span>
                        <p className="petugas-value">{item.usher_kolektan || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">🙏</span>
                      <div>
                        <span className="petugas-label">Doa Syafaat</span>
                        <p className="petugas-value">{item.doa_syafaat || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">📢</span>
                      <div>
                        <span className="petugas-label">Warta</span>
                        <p className="petugas-value">{item.warta || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">💻</span>
                      <div>
                        <span className="petugas-label">Multimedia</span>
                        <p className="petugas-value">{item.multimedia || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">🤝</span>
                      <div>
                        <span className="petugas-label">Pendamping</span>
                        <p className="petugas-value">{item.pendamping || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">🎸</span>
                      <div>
                        <span className="petugas-label">Tim Musik</span>
                        <p className="petugas-value">{item.tim_musik || '-'}</p>
                      </div>
                    </div>
                    <div className="petugas-item">
                      <span className="petugas-icon">🧹</span>
                      <div>
                        <span className="petugas-label">Tim Piket</span>
                        <p className="petugas-value">{item.tim_piket || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
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

        /* ===== Kartu Roster (sama seperti kartu Tema) ===== */
        .jadwal-card {
          position: relative;
          display: flex;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(180deg, #FFFDF8, #FFFFFF);
          border: 1px solid rgba(212,175,55,.28);
          box-shadow: 0 4px 14px rgba(90,60,150,.06);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .jadwal-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 28px rgba(90,60,150,.14);
          border-color: rgba(212,175,55,.55);
        }
        .jadwal-card-accent {
          width: 6px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #6B4FBB, #B4862F);
        }
        .jadwal-card-body {
          flex: 1;
          padding: 18px 20px;
        }
        .jadwal-icon {
          font-size: .9rem;
          opacity: .8;
        }
        .jadwal-divider {
          margin: 12px 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(212,175,55,.35), rgba(212,175,55,0));
        }

        /* Grid petugas roster */
        .petugas-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 10px 20px;
        }
        @media (min-width: 640px) {
          .petugas-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          .petugas-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .petugas-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: #FBF6EA;
          border: 1px solid rgba(212,175,55,.18);
        }
        .petugas-icon {
          font-size: .95rem;
          margin-top: 1px;
          opacity: .85;
        }
        .petugas-label {
          display: block;
          font-weight: 700;
          color: #6B4FBB;
          text-transform: uppercase;
          font-size: .64rem;
          letter-spacing: .04em;
        }
        .petugas-value {
          font-size: .82rem;
          color: #241246;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1px;
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
          .reveal, .tilt-card, .jadwal-card {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}