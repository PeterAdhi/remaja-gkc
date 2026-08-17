'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TemaPage() {
  const [isAdmin, setIsAdmin] = useState<any>(false)
  const [jadwalList, setJadwalList] = useState<any>([])
  const [tanggalSabtu, setTanggalSabtu] = useState<any>('')
  const [tema, setTema] = useState<any>('')
  const [pembicara, setPembicara] = useState<any>('')
  const [loading, setLoading] = useState<any>(false)
  const [searchTerm, setSearchTerm] = useState<any>('')
  
  // State tambahan untuk mode edit
  const [editId, setEditId] = useState<any>(null)

  // Cek status admin dari localStorage saat halaman dimuat
  useEffect(() => {
    const checkAdmin = () => {
      const status = localStorage.getItem('isAdminRemaja')
      setIsAdmin(status === 'true')
    }

    checkAdmin()

    window.addEventListener('storage', checkAdmin)
    const interval = setInterval(checkAdmin, 500)

    bersihkanTemaBulanLalu().finally(() => {
      fetchJadwal()
    })

    return () => {
      window.removeEventListener('storage', checkAdmin)
      clearInterval(interval)
    }
  }, [])

  function getAwalBulanIni(): string {
    const now = new Date()
    const awal = new Date(now.getFullYear(), now.getMonth(), 1)
    return awal.toISOString().split('T')[0]
  }

  async function bersihkanTemaBulanLalu(paksa: boolean = false) {
    const bulanIni = new Date().toISOString().slice(0, 7)

    try {
      if (!paksa) {
        const bulanTerakhirDibersihkan = localStorage.getItem('temaCleanupBulan')
        if (bulanTerakhirDibersihkan === bulanIni) {
          return
        }
      }

      const awalBulanIni = getAwalBulanIni()
      const { error } = await supabase
        .from('jadwal_tema')
        .delete()
        .lt('tanggal_sabtu', awalBulanIni)

      if (error) {
        console.error('Gagal membersihkan jadwal tema bulan lalu:', error.message)
      } else {
        localStorage.setItem('temaCleanupBulan', bulanIni)
      }
    } catch (err: unknown) {
      console.error('Terjadi kesalahan saat membersihkan jadwal tema bulan lalu:', err)
    }
  }

  async function handleBersihkanManual() {
    if (!confirm('Hapus semua jadwal tema dari bulan-bulan sebelumnya sekarang juga?')) return
    await bersihkanTemaBulanLalu(true)
    alert('Jadwal tema bulan-bulan sebelumnya berhasil dihapus.')
    fetchJadwal()
  }

  async function fetchJadwal() {
    const { data, error } = await supabase
      .from('jadwal_tema')
      .select('*')
      .order('tanggal_sabtu', { ascending: true })
    if (data) setJadwalList(data)
  }

  // Fungsi Simpan (Bisa untuk Tambah Baru atau Update Edit)
  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!tanggalSabtu || !tema || !pembicara) {
      alert('Semua field (Tanggal, Tema, dan Pelayan Firman) harus diisi!')
      return
    }

    setLoading(true)

    if (editId) {
      // Proses Update / Edit Data
      const { error } = await supabase
        .from('jadwal_tema')
        .update({ tanggal_sabtu: tanggalSabtu, tema, pembicara })
        .eq('id', editId)

      setLoading(false)

      if (error) {
        alert('Gagal mengupdate jadwal: ' + error.message)
      } else {
        alert('Jadwal tema berhasil diperbarui!')
        batalEdit()
        fetchJadwal()
      }
    } else {
      // Proses Tambah Baru
      const { error } = await supabase.from('jadwal_tema').insert([
        { tanggal_sabtu: tanggalSabtu, tema, pembicara }
      ])

      setLoading(false)

      if (error) {
        alert('Gagal menambah jadwal: ' + error.message)
      } else {
        alert('Jadwal tema berhasil ditambahkan!')
        setTanggalSabtu('')
        setTema('')
        setPembicara('')
        fetchJadwal()
      }
    }
  }

  // Fungsi untuk mengisi form saat tombol edit diklik
  function handleEditClick(item: any) {
    setEditId(item.id)
    setTanggalSabtu(item.tanggal_sabtu)
    setTema(item.tema)
    setPembicara(item.pembicara || '')
    // Gulir otomatis ke form di atas agar mudah dilihat (khusus tampilan mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Membatalkan mode edit dan mereset form
  function batalEdit() {
    setEditId(null)
    setTanggalSabtu('')
    setTema('')
    setPembicara('')
  }

  async function handleDelete(id: any) {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return
    const { error } = await supabase.from('jadwal_tema').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      // Jika yang sedang dihapus kebetulan sedang dalam mode edit, reset formnya
      if (editId === id) batalEdit()
      fetchJadwal()
    }
  }

  const filteredJadwal = jadwalList.filter((item: any) =>
    item.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tanggal_sabtu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.pembicara && item.pembicara.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
            <p className="text-gray-500 text-sm">Daftar tema firman Tuhan dan pembicara untuk ibadah remaja setiap hari Sabtu.</p>
            <p className="text-[11px] text-amber-700/70 italic mt-0.5">🗑️ Jadwal tema bulan-bulan sebelumnya otomatis dihapus setiap awal bulan.</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={handleBersihkanManual}
            className="text-xs font-semibold text-rose-600 border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:border-rose-400 transition shrink-0 whitespace-nowrap"
          >
            🗑️ Bersihkan Tema Bulan Lalu
          </button>
        )}
      </div>

      {/* Grid: Form & Daftar Jadwal */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : ''} gap-6`}>

        {/* Kotak Form Tambah / Edit Tema - HANYA MUNCUL JIKA ADMIN AKTIF */}
        {isAdmin && (
          <div className="reveal delay-1 tilt-card card-glass p-6 rounded-2xl space-y-4 md:col-span-1">
            <div className="space-y-1 flex justify-between items-start">
              <div>
                <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  {editId ? 'Mode Edit' : 'Form Admin'}
                </span>
                <h2
                  className="text-xl font-bold text-gray-800 mt-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {editId ? '✏️ Edit Jadwal & Tema' : '➕ Tambah Jadwal & Tema'}
                </h2>
              </div>
              {editId && (
                <button
                  type="button"
                  onClick={batalEdit}
                  className="text-xs text-gray-500 hover:text-gray-700 underline mt-1"
                >
                  Batal
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Pelayan Firman</label>
                <input
                  type="text"
                  placeholder="Contoh: Pnt. Surya"
                  className="w-full p-2.5 rounded-lg text-sm input-gold"
                  value={pembicara}
                  onChange={(e) => setPembicara(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                {editId && (
                  <button
                    type="button"
                    onClick={batalEdit}
                    className="w-1/3 bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${editId ? 'w-2/3' : 'w-full'} btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60`}
                >
                  {loading ? 'Menyimpan...' : editId ? 'Perbarui Jadwal' : 'Simpan Jadwal Tema'}
                </button>
              </div>
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
                📅 Daftar Jadwal Tema & Pelayan Firman
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
              placeholder="Cari tema, pembicara, atau tanggal..."
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
            <div className="space-y-4">
              {filteredJadwal.map((item: any, idx: number) => (
                <div 
                  key={item.id} 
                  className={`jadwal-card reveal ${editId === item.id ? 'ring-2 ring-amber-500 shadow-md' : ''}`} 
                  style={{ animationDelay: `${0.03 * idx}s` }}
                >
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-xs text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-xs text-rose-600 border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:border-rose-400 transition"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="jadwal-title">
                      "{item.tema}"
                    </h3>

                    {/* Menampilkan Nama Pembicara */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                      <span className="text-amber-700">Pelayan Firman:</span>
                      <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200/60">
                        {item.pembicara || 'Belum ditentukan'}
                      </span>
                    </div>
                  </div>
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
        .jadwal-title {
          margin-top: 10px;
          font-size: 1.15rem;
          font-weight: 700;
          color: #241246;
          font-family: 'Cormorant Garamond', serif;
          line-height: 1.35;
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
          .reveal, .tilt-card, .btn-gold, .jadwal-card {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}