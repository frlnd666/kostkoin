// src/components/home/BannerSlider.tsx

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight }         from 'lucide-react'

interface BannerItem {
  id:       string
  imageUrl: string
  title:    string
  subtitle: string
  link:     string
  bgColor:  string
}

// ← Ganti dengan banner sesuai kebutuhan app
const BANNERS: BannerItem[] = [
  {
    id:       '1',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    title:    'Kost Impian Menanti',
    subtitle: 'Temukan hunian nyaman dekat kampus & kerja',
    link:     '/listing',
    bgColor:  'from-amber-500 to-orange-400',
  },
  {
    id:       '2',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    title:    'Promo Bulan Ini',
    subtitle: 'Diskon hingga 20% untuk sewa bulanan pertama',
    link:     '/listing?promo=true',
    bgColor:  'from-teal-500 to-cyan-400',
  },
  {
    id:       '3',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    title:    'Kost Full Furnished',
    subtitle: 'Masuk langsung tanpa beli perabot apapun',
    link:     '/listing?fasilitas=furnished',
    bgColor:  'from-violet-500 to-purple-400',
  },
]

const BannerSlider = () => {
  const [current, setCurrent]   = useState(0)
  const [paused,  setPaused]    = useState(false)

  const prev = useCallback(() =>
    setCurrent(c => (c - 1 + BANNERS.length) % BANNERS.length), [])
  const next = useCallback(() =>
    setCurrent(c => (c + 1) % BANNERS.length), [])

  // Auto-slide setiap 4 detik
  useEffect(() => {
    if (paused) return
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
  }, [paused, next])

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-md"
      style={{ aspectRatio: '16/7' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {BANNERS.map(banner => (
          <a
            key={banner.id}
            href={banner.link}
            className="relative flex-shrink-0 w-full h-full block"
          >
            {/* Gambar */}
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} opacity-60`} />
            {/* Teks */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5">
              <p className="text-white font-extrabold text-base leading-tight drop-shadow">
                {banner.title}
              </p>
              <p className="text-white/90 text-xs mt-0.5 drop-shadow">
                {banner.subtitle}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Tombol prev/next */}
      <button
        onClick={e => { e.preventDefault(); prev() }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
        aria-label="Sebelumnya"
      >
        <ChevronLeft size={14} className="text-white" />
      </button>
      <button
        onClick={e => { e.preventDefault(); next() }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
        aria-label="Berikutnya"
      >
        <ChevronRight size={14} className="text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${
              i === current
                ? 'w-5 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/50'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default BannerSlider
