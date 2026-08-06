'use client'
import { useState, useEffect, useMemo } from 'react'

const TITLE = 'Remaja GKC'
const SUBTITLE = 'bertumbuh dalam terang kasih-Nya'
const HOLD_MS = 2200   // durasi tampil sebelum mulai keluar
const EXIT_MS = 700    // durasi animasi keluar

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true)
      const removeTimer = setTimeout(onFinish, EXIT_MS)
      return () => clearTimeout(removeTimer)
    }, HOLD_MS)
    return () => clearTimeout(timer)
  }, [onFinish])

  // Partikel cahaya (embers) dengan posisi & timing acak, dibuat sekali saja
  const embers = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        delay: Math.random() * 2.2,
        duration: 2.6 + Math.random() * 1.8,
        size: 2 + Math.random() * 2.5,
        drift: (Math.random() - 0.5) * 40,
      })),
    []
  )

  const letters = useMemo(() => TITLE.split(''), [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden splash-root ${
        isFading ? 'splash-exit' : ''
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 38%, #2B1B63 0%, #1B1140 55%, #140A2E 100%)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Memuat aplikasi"
    >
      {/* Bintang latar */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <span className="star" style={{ top: '18%', left: '12%', animationDelay: '0s' }} />
        <span className="star" style={{ top: '68%', left: '20%', animationDelay: '.6s' }} />
        <span className="star" style={{ top: '28%', left: '46%', animationDelay: '1.1s' }} />
        <span className="star" style={{ top: '74%', left: '62%', animationDelay: '.3s' }} />
        <span className="star" style={{ top: '22%', left: '80%', animationDelay: '.9s' }} />
        <span className="star" style={{ top: '64%', left: '90%', animationDelay: '1.4s' }} />
        <span className="star" style={{ top: '10%', left: '60%', animationDelay: '1.7s' }} />
      </div>

      {/* Partikel cahaya naik (embers) */}
      <div className="pointer-events-none absolute inset-0">
        {embers.map((e) => (
          <span
            key={e.id}
            className="ember"
            style={
              {
                left: `${e.left}%`,
                width: `${e.size}px`,
                height: `${e.size}px`,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.duration}s`,
                '--drift': `${e.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Konten utama */}
      <div className="relative flex flex-col items-center">
        {/* Logo Remaja — sama seperti di navbar, dengan glow keemasan */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center logo-pop">
          <span className="cross-glow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo Remaja GKC"
            className="relative w-20 h-20 object-cover rounded-full border-2 border-amber-200/50"
          />
        </div>

        {/* Judul — bertahap huruf demi huruf dengan shimmer emas */}
        <h1
          className="title-shimmer text-2xl md:text-3xl font-bold tracking-wide text-center px-6"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {letters.map((ch, i) => (
            <span
              key={i}
              className="letter"
              style={{ animationDelay: `${0.55 + i * 0.045}s` }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </h1>

        {/* Subjudul */}
        <p
          className="subtitle mt-1.5 text-amber-200/70"
          style={{ fontFamily: "'Great Vibes', cursive", fontSize: '18px' }}
        >
          {SUBTITLE}
        </p>

        {/* Progress bar tipis, menggantikan spinner generik */}
        <div className="progress-track mt-7">
          <div className="progress-fill" />
        </div>
      </div>

      <style jsx>{`
        .splash-root {
          transition: opacity ${EXIT_MS}ms ease, filter ${EXIT_MS}ms ease,
            transform ${EXIT_MS}ms ease;
        }
        .splash-exit {
          opacity: 0;
          filter: blur(10px);
          transform: scale(1.04);
        }

        /* Bintang */
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

        /* Partikel cahaya naik */
        @keyframes emberRise {
          0% { opacity: 0; transform: translate(0, 0); }
          15% { opacity: .9; }
          100% { opacity: 0; transform: translate(var(--drift), -120px); }
        }
        .ember {
          position: absolute;
          bottom: 30%;
          border-radius: 9999px;
          background: radial-gradient(circle, #FFF3C4 0%, #F4D35E 60%, transparent 100%);
          box-shadow: 0 0 8px 1px rgba(244, 211, 94, .8);
          animation-name: emberRise;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }

        /* Logo: muncul dengan efek pop lembut */
        @keyframes logoPop {
          0% { opacity: 0; transform: scale(.7); }
          60% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .logo-pop {
          animation: logoPop .6s cubic-bezier(.34,1.56,.64,1) forwards;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: .8; transform: scale(1.25); }
        }
        .cross-glow {
          position: absolute;
          width: 96px;
          height: 96px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(244,211,94,.55) 0%, rgba(244,211,94,0) 70%);
          animation: glowPulse 2.4s ease-in-out infinite;
          animation-delay: .6s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        /* Judul: huruf muncul bertahap lalu berkilau */
        .letter {
          display: inline-block;
          opacity: 0;
          transform: translateY(10px);
          animation: letterIn .5s ease forwards;
          background-image: linear-gradient(90deg, #FCE38A, #FFF3C4 20%, #F4D35E 40%, #E0A93A 60%, #FCE38A 80%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        @keyframes letterIn {
          to { opacity: 1; transform: translateY(0); }
        }
        .title-shimmer .letter {
          animation: letterIn .5s ease forwards, shimmerSweep 2.8s linear 1.6s infinite;
        }
        @keyframes shimmerSweep {
          0% { background-position: 220% 0; }
          100% { background-position: -20% 0; }
        }

        /* Subjudul */
        .subtitle {
          opacity: 0;
          transform: translateY(6px);
          animation: subtitleIn .6s ease forwards;
          animation-delay: 1.35s;
        }
        @keyframes subtitleIn {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Progress bar */
        .progress-track {
          width: 120px;
          height: 3px;
          border-radius: 9999px;
          background: rgba(244, 211, 94, .18);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          width: 0%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #F4D35E, #FFF3C4);
          box-shadow: 0 0 8px rgba(244, 211, 94, .6);
          animation: fillProgress ${HOLD_MS}ms linear forwards;
        }
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-root, .star, .ember, .logo-pop, .cross-glow,
          .letter, .title-shimmer .letter, .subtitle, .progress-fill {
            animation: none !important;
            transition: none !important;
          }
          .letter, .subtitle { opacity: 1 !important; transform: none !important; }
          .logo-pop { opacity: 1 !important; transform: scale(1) !important; }
          .progress-fill { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}