'use client'
import './globals.css'
import { useState, useEffect, FormEvent } from 'react'

interface NavItem {
  href: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '✦' },
  { href: '/tema', label: 'Jadwal Tema', icon: '✦' },
  { href: '/roster', label: 'Roster Pelayanan', icon: '✦' },
  { href: '/tugas', label: 'Penjelasan Tugas', icon: '✦' },
  { href: '/lagu', label: 'Manajemen Lagu', icon: '✦' },
  { href: '/remaja', label: 'Pendataan Remaja', icon: '✦' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [adminPassword, setAdminPassword] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  // Cek status login dari localStorage saat pertama kali halaman dimuat
  useEffect(() => {
    const savedAdminStatus = localStorage.getItem('isAdminRemaja')
    if (savedAdminStatus === 'true') {
      setIsAdmin(true)
    }
  }, [])

  function handleLoginAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (adminPassword === 'adminremaja123') {
      setIsAdmin(true)
      localStorage.setItem('isAdminRemaja', 'true') // Simpan status ke localStorage
      setShowModal(false)
      setAdminPassword('')
      alert('Berhasil masuk sebagai Admin!')
    } else {
      alert('Password Admin salah!')
    }
  }

  function handleLogout() {
    setIsAdmin(false)
    localStorage.removeItem('isAdminRemaja') // Hapus status dari localStorage
    alert('Berhasil keluar dari mode Admin.')
  }

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@400;500;600;700&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen text-gray-800"
        style={{
          fontFamily: "'Poppins', sans-serif",
          background:
            'radial-gradient(circle at 15% 0%, #FFF6E0 0%, #FDF4E7 35%, #F7EFE1 100%)',
        }}
      >
        {/* ================= NAVBAR ================= */}
        <nav
          className="sticky top-0 z-50 border-b relative overflow-hidden"
          style={{
            background:
              'linear-gradient(120deg, #1B1140 0%, #2B1B63 45%, #3A2472 100%)',
            borderColor: '#D4AF37',
          }}
        >
          {/* halus: bintang berkelip di latar navbar */}
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <span className="star" style={{ top: '20%', left: '8%', animationDelay: '0s' }} />
            <span className="star" style={{ top: '60%', left: '22%', animationDelay: '.6s' }} />
            <span className="star" style={{ top: '30%', left: '48%', animationDelay: '1.1s' }} />
            <span className="star" style={{ top: '70%', left: '65%', animationDelay: '.3s' }} />
            <span className="star" style={{ top: '25%', left: '82%', animationDelay: '.9s' }} />
            <span className="star" style={{ top: '65%', left: '92%', animationDelay: '1.4s' }} />
          </div>
          {/* garis cahaya kemuliaan bawah navbar */}
          <div className="shimmer-line" />

          <div className="max-w-7xl mx-auto px-5 md:px-8 py-3.5 relative flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <span className="glow-ring" />
                <span className="text-xl relative">✝️</span>
              </div>
              <div className="leading-tight">
                <span
                  className="block font-bold text-lg tracking-wide bg-clip-text text-transparent"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    backgroundImage: 'linear-gradient(90deg, #F4D35E, #E9B44C, #F4D35E)',
                  }}
                >
                  Remaja GKC
                </span>
                <span
                  className="hidden sm:block text-[11px] text-amber-200/70 -mt-0.5"
                  style={{ fontFamily: "'Great Vibes', cursive", fontSize: '13px' }}
                >
                  bertumbuh dalam terang kasih-Nya
                </span>
              </div>
            </div>

            {/* Menu Navigasi — Desktop */}
            <div className="hidden lg:flex items-center gap-1 text-xs font-medium">
              {NAV_ITEMS.map((item: NavItem) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="nav-link px-3 py-2 rounded-lg text-amber-50/90 hover:text-amber-200 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Kanan: Admin / Login + Hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="admin-badge text-xs font-semibold px-3 py-1.5 rounded-full">
                    ✨ Admin Aktif
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-200 border border-rose-300/50 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  className="hidden sm:inline-flex btn-gold text-xs font-semibold px-4 py-2 rounded-lg items-center gap-1.5"
                >
                  🔑 Login Admin
                </button>
              )}

              {/* Hamburger (mobile & tablet) */}
              <button
                onClick={() => setMenuOpen((v: boolean) => !v)}
                className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-amber-200/30 hover:bg-white/5 transition"
                aria-label="Buka menu"
              >
                <span className={`hbar ${menuOpen ? 'hbar-open-1' : ''}`} />
                <span className={`hbar ${menuOpen ? 'hbar-open-2' : ''}`} />
                <span className={`hbar ${menuOpen ? 'hbar-open-3' : ''}`} />
              </button>
            </div>
          </div>

          {/* Drawer Mobile */}
          <div className={`lg:hidden drawer ${menuOpen ? 'drawer-open' : ''}`}>
            <div className="px-5 pb-4 pt-1 flex flex-col gap-1">
              {NAV_ITEMS.map((item: NavItem) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-amber-50/90 hover:text-amber-200 hover:bg-white/5 text-sm font-medium px-3 py-2.5 rounded-lg transition"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 border-t border-white/10 mt-1">
                {isAdmin ? (
                  <div className="flex items-center justify-between gap-2 pt-3">
                    <span className="admin-badge text-xs font-semibold px-3 py-1.5 rounded-full">
                      ✨ Admin Aktif
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-rose-200 border border-rose-300/50 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowModal(true); setMenuOpen(false); }}
                    className="btn-gold w-full mt-3 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    🔑 Login Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ================= MODAL LOGIN ADMIN ================= */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#140A2E]/70 backdrop-blur-sm p-4">
            <div className="modal-card relative w-full max-w-sm p-6 space-y-4">
              <span className="glow-ring modal-glow" />

              <div className="flex justify-between items-center border-b border-amber-200/20 pb-3 relative">
                <h3
                  className="text-base font-bold text-amber-100 flex items-center gap-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '19px' }}
                >
                  🕊️ Masuk Sebagai Admin
                </h3>
                <button
                  onClick={() => { setShowModal(false); setAdminPassword(''); }}
                  className="text-amber-100/60 hover:text-amber-100 text-lg font-bold transition"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleLoginAdmin} className="space-y-4 relative">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-amber-100/80">Password Admin</label>
                  <input
                    type="password"
                    placeholder="Masukkan password..."
                    className="w-full p-2.5 text-xs rounded-lg bg-white/95 border border-amber-200/40 focus:outline-none focus:ring-2 focus:ring-[#E9B44C] transition"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setAdminPassword(''); }}
                    className="px-4 py-2 text-xs font-medium text-amber-100/80 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-gold px-4 py-2 text-xs font-semibold rounded-lg">
                    Masuk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {children}

        {/* ================= STYLE & ANIMASI ================= */}
        <style jsx global>{`
          @keyframes twinkle {
            0%, 100% { opacity: .15; transform: scale(.8); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          .star {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 9999px;
            background: #F4D35E;
            box-shadow: 0 0 6px 1px #F4D35E;
            animation: twinkle 2.6s ease-in-out infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer-line {
            height: 2px;
            width: 100%;
            background: linear-gradient(90deg, transparent, #F4D35E, #FFF3C4, #F4D35E, transparent);
            background-size: 200% 100%;
            animation: shimmer 3.5s linear infinite;
          }

          @keyframes pulseGlow {
            0%, 100% { opacity: .35; transform: scale(1); }
            50% { opacity: .75; transform: scale(1.18); }
          }
          .glow-ring {
            position: absolute;
            inset: -6px;
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(244,211,94,.9) 0%, rgba(244,211,94,0) 70%);
            animation: pulseGlow 2.4s ease-in-out infinite;
          }
          .modal-glow {
            inset: -30px;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 140px;
            height: 90px;
          }

          .nav-link {
            position: relative;
          }
          .nav-link::after {
            content: '';
            position: absolute;
            left: 12px;
            right: 12px;
            bottom: 4px;
            height: 2px;
            background: linear-gradient(90deg, #F4D35E, #E9B44C);
            transform: scaleX(0);
            transform-origin: left;
            transition: transform .25s ease;
            border-radius: 2px;
          }
          .nav-link:hover::after {
            transform: scaleX(1);
          }

          .btn-gold {
            color: #241246;
            background: linear-gradient(135deg, #FCE38A, #F4D35E 45%, #E0A93A);
            box-shadow: 0 2px 10px rgba(233,180,76,.45);
            transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          }
          .btn-gold:hover {
            transform: translateY(-1px) scale(1.03);
            box-shadow: 0 6px 16px rgba(233,180,76,.55);
            filter: brightness(1.05);
          }
          .btn-gold:active {
            transform: translateY(0) scale(.98);
          }

          .admin-badge {
            color: #064E3B;
            background: linear-gradient(135deg, #A7F3D0, #6EE7B7);
            box-shadow: 0 0 0 1px rgba(255,255,255,.4) inset;
          }

          .hbar {
            width: 18px;
            height: 2px;
            background: #F4D35E;
            border-radius: 2px;
            transition: transform .25s ease, opacity .25s ease;
          }
          .hbar-open-1 { transform: translateY(6.5px) rotate(45deg); }
          .hbar-open-2 { opacity: 0; }
          .hbar-open-3 { transform: translateY(-6.5px) rotate(-45deg); }

          .drawer {
            max-height: 0;
            overflow: hidden;
            transition: max-height .35s ease;
            border-top: 1px solid rgba(244,211,94,0);
          }
          .drawer-open {
            max-height: 480px;
            border-top: 1px solid rgba(244,211,94,.2);
          }

          @keyframes modalIn {
            0% { opacity: 0; transform: translateY(12px) scale(.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .modal-card {
            border-radius: 18px;
            background: linear-gradient(160deg, #251550 0%, #341D6B 100%);
            border: 1px solid rgba(244,211,94,.35);
            box-shadow: 0 20px 60px rgba(20,10,46,.5);
            animation: modalIn .28s cubic-bezier(.2,.8,.2,1);
          }

          @media (prefers-reduced-motion: reduce) {
            .star, .shimmer-line, .glow-ring, .btn-gold, .modal-card {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>
      </body>
    </html>
  )
}