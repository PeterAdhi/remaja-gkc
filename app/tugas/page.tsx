'use client'

export default function TugasPage() {
  const divisiList = [
    {
      icon: '📜',
      title: 'Liturgos',
      desc: 'Memimpin jalannya tata ibadah (liturgi) dari awal hingga akhir acara.',
    },
    {
      icon: '👥',
      title: 'Usher & Kolektan',
      desc: 'Menyambut jemaat/remaja, membagikan kolekte, serta mengedarkan persembahan.',
    },
    {
      icon: '🙏',
      title: 'Doa Syafaat',
      desc: 'Menaikkan doa syafaat bagi pelayanan, gereja, sekolah, bangsa, dan sesama rekan remaja.',
    },
    {
      icon: '📢',
      title: 'Warta',
      desc: 'Menyampaikan pengumuman atau informasi kegiatan penting seputar pelayanan remaja.',
    },
    {
      icon: '💻',
      title: 'Multimedia',
      desc: 'Mengoperasikan slide lirik (Multimedia).',
    },
    {
      icon: '🎸',
      title: 'Tim Musik',
      desc: 'Mengiringi puji-pujian (Tim Musik)',
    },
  ]

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
              Penjelasan Tugas Setiap Divisi
            </h1>
            <p className="text-gray-500 text-sm">Pahami peran dan tanggung jawab setiap pelayanan remaja.</p>
          </div>
        </div>
      </div>

      {/* Grid Divisi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {divisiList.map((item, i) => (
          <div
            key={item.title}
            className={`reveal delay-${(i % 5) + 1} tilt-card petugas-box p-5 rounded-2xl space-y-2`}
          >
            <span className="badge-soft inline-block text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Divisi Pelayanan
            </span>
            <h3
              className="text-lg font-bold text-gray-800 flex items-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              <span>{item.icon}</span> {item.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
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

        .reveal {
          animation: fadeUpDash .5s ease both;
        }
        .delay-1 { animation-delay: .05s; }
        .delay-2 { animation-delay: .1s; }
        .delay-3 { animation-delay: .15s; }
        .delay-4 { animation-delay: .18s; }
        .delay-5 { animation-delay: .22s; }
        @keyframes fadeUpDash {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .tilt-card, .petugas-box {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}