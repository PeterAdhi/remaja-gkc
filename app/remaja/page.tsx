'use client'
import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'

interface Remaja {
  id: string | number
  nama_lengkap: string
  alamat: string
  asal_sekolah: string
  tanggal_lahir: string
}

interface FormDataState {
  nama_lengkap: string
  alamat: string
  asal_sekolah: string
  tanggal_lahir: string
}

function formatTanggal(tanggal: string): string {
  if (!tanggal) return '-'
  const parts = tanggal.split('-')
  if (parts.length !== 3) return tanggal
  const [year, month, day] = parts
  const dd = day.padStart(2, '0')
  const mm = month.padStart(2, '0')
  return `${dd}-${mm}-${year}`
}

// Avatar unik & lucu berdasarkan nama, konsisten tiap dibuka (pakai DiceBear "fun-emoji")
function getAvatarUrl(nama: string): string {
  const seed = encodeURIComponent(nama.trim().toLowerCase() || 'anon')
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}&backgroundType=gradientLinear`
}

export default function RemajaPage() {
  const [formData, setFormData] = useState<FormDataState>({
    nama_lengkap: '',
    alamat: '',
    asal_sekolah: '',
    tanggal_lahir: ''
  })
  const [remajaList, setRemajaList] = useState<Remaja[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [loadingRemaja, setLoadingRemaja] = useState<boolean>(false)

  // --- State untuk cek status admin (skema sama seperti RosterPage: localStorage 'isAdminRemaja') ---
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

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

    return () => {
      window.removeEventListener('storage', checkAdmin)
      clearInterval(interval)
    }
  }, [])

  // Data remaja HANYA diambil kalau isAdmin true, supaya user biasa
  // tidak ikut mengunduh data (nama, alamat, tgl lahir) ke browser mereka.
  useEffect(() => {
    if (isAdmin) {
      fetchRemaja()
    } else {
      setRemajaList([])
    }
  }, [isAdmin])

  async function fetchRemaja() {
    try {
      const { data, error } = await supabase.from('remaja').select('*').order('id', { ascending: false })
      if (error) {
        console.error('Error fetching remaja:', error.message)
      } else if (data) {
        setRemajaList(data)
      }
    } catch (err: unknown) {
      console.error('Terjadi kesalahan saat mengambil data remaja:', err)
    }
  }

  async function handleSubmitRemaja(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingRemaja(true)
    try {
      const { error } = await supabase.from('remaja').insert([formData])
      if (error) {
        alert('Gagal: ' + error.message)
      } else {
        alert('Data diri berhasil disimpan!')
        setFormData({ nama_lengkap: '', alamat: '', asal_sekolah: '', tanggal_lahir: '' })
        if (isAdmin) fetchRemaja()
      }
    } catch (err: any) {
      alert('Terjadi kesalahan sistem: ' + (err?.message || err))
    } finally {
      setLoadingRemaja(false)
    }
  }

  const filteredRemaja = remajaList.filter((item: Remaja) =>
    item.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="max-w-7xl mx-auto p-5 md:p-12 space-y-7">

      {/* Header */}
      <div className="reveal card-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h1
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                backgroundImage: 'linear-gradient(90deg, #6B4FBB, #B4862F)',
              }}
            >
              Pendataan & Daftar Remaja
            </h1>
            <p className="text-gray-500 text-sm">Isi data diri dan lihat daftar remaja yang sudah terdaftar.</p>
          </div>
        </div>
      </div>

      {/* Grid: Form & (khusus admin) Daftar Remaja */}
      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'md:grid-cols-3' : ''}`}>

        {/* Kotak Form Pendataan */}
        <div
          className={`reveal delay-1 tilt-card card-glass p-6 rounded-2xl space-y-4 ${
            isAdmin ? 'md:col-span-1' : 'md:max-w-md md:mx-auto w-full'
          }`}
        >
          <div className="space-y-1">
            <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Form Pendataan
            </span>
            <h2
              className="text-xl font-bold text-gray-800 mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              🧾 Simpan Data Diri
            </h2>
          </div>
          <form onSubmit={handleSubmitRemaja} className="space-y-3">
            <input
              type="text"
              placeholder="Nama Lengkap"
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold"
              value={formData.nama_lengkap}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nama_lengkap: e.target.value })}
            />
            <textarea
              rows={3}
              placeholder="Alamat Rumah"
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold"
              value={formData.alamat}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, alamat: e.target.value })}
            />
            <input
              type="text"
              placeholder="Asal Sekolah"
              required
              className="w-full p-2.5 rounded-lg text-sm input-gold"
              value={formData.asal_sekolah}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, asal_sekolah: e.target.value })}
            />
            <div className="space-y-1">
              <label htmlFor="tanggal_lahir" className="block text-xs font-semibold text-amber-800/70">
                🎂 Tanggal Lahir (Ulang Tahun)
              </label>
              <input
                id="tanggal_lahir"
                type="date"
                required
                className="w-full p-2.5 rounded-lg text-sm input-gold"
                value={formData.tanggal_lahir}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              />
              <p className="text-[11px] text-gray-500">Isi sesuai tanggal lahir untuk keperluan notifikasi ulang tahun.</p>
            </div>
            <button
              type="submit"
              disabled={loadingRemaja}
              className="w-full btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
            >
              {loadingRemaja ? 'Menyimpan...' : 'Simpan Data Diri'}
            </button>
          </form>
        </div>

        {/* Kotak Daftar Remaja — hanya dirender sama sekali kalau admin */}
        {isAdmin && (
          <div className="reveal delay-2 card-glass p-6 rounded-2xl space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="badge-soft text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Data Terdaftar
                </span>
                <h2
                  className="text-xl font-bold text-gray-800 mt-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  👥 Daftar Remaja
                </h2>
              </div>
              <span className="btn-gold text-xs font-semibold px-3 py-1.5 rounded-lg">
                {remajaList.length} Remaja
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/50 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Cari nama remaja..."
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

            {/* Tabel Data Remaja */}
            <div className="overflow-x-auto rounded-xl table-shell">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="table-head">
                    <th className="p-3">Nama</th>
                    <th className="p-3">Alamat</th>
                    <th className="p-3">Sekolah</th>
                    <th className="p-3">Ulang Tahun</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRemaja.length > 0 ? (
                    filteredRemaja.map((item: Remaja) => (
                      <tr key={item.id} className="table-row">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getAvatarUrl(item.nama_lengkap)}
                              alt={`Avatar ${item.nama_lengkap}`}
                              className="avatar-pic"
                              loading="lazy"
                            />
                            <span className="font-semibold text-gray-800 whitespace-nowrap">{item.nama_lengkap}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{item.alamat}</td>
                        <td className="p-3 text-gray-600">{item.asal_sekolah}</td>
                        <td className="p-3 text-gray-600">
                          <span className="inline-flex items-center gap-1 tanggal-pill whitespace-nowrap">
                            <span className="text-[10px]">🎂</span>
                            {formatTanggal(item.tanggal_lahir)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500 italic">
                        {remajaList.length > 0
                          ? `Tidak ada remaja yang cocok dengan pencarian "${searchTerm}".`
                          : 'Belum ada data remaja yang terdaftar.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        .card-glass {
          background: rgba(255,255,255,.85);
          border: 1px solid rgba(212,175,55,.25);
          box-shadow: 0 8px 24px rgba(90,60,150,.08);
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

        .table-shell {
          border: 1px solid rgba(212,175,55,.25);
          box-shadow: 0 4px 14px rgba(90,60,150,.06);
        }

        .table-head {
          background: #F1EBFB;
          color: #6B4FBB;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: .05em;
        }
        .table-row {
          border-top: 1px solid rgba(212,175,55,.2);
          transition: background .15s ease;
        }
        .table-row:hover {
          background: #FBF6EA;
        }

        .avatar-pic {
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          flex-shrink: 0;
          background: #FBF6EA;
          border: 1.5px solid rgba(212,175,55,.4);
          box-shadow: 0 2px 6px rgba(90,60,150,.12);
        }

        .tanggal-pill {
          background: #FBF6EA;
          border: 1px solid rgba(212,175,55,.3);
          color: #6B4FBB;
          padding: 2px 8px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 11px;
          white-space: nowrap;
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