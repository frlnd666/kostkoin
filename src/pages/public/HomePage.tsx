import { memo, useEffect, useState } from 'react'
import { Link, useNavigate }         from 'react-router-dom'
import { Search, MapPin, Shield, Star, ChevronRight } from 'lucide-react'
import { getApprovedListings } from '../../services/listingService'
import { formatRupiah }        from '../../utils/format'
import type { Listing }        from '../../types/listing'

const KOTA_BANTEN = [
  'Kota Serang', 'Kota Tangerang', 'Kota Tangerang Selatan',
  'Kota Cilegon', 'Kabupaten Serang', 'Kabupaten Tangerang',
  'Kabupaten Lebak', 'Kabupaten Pandeglang',
]

const HomePage = memo(() => {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [kota, setKota]           = useState('')
  const [listings, setListings]   = useState<Listing[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getApprovedListings()
      .then(setListings)
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (kota)   params.set('kota', kota)
    navigate(`/listing?${params.toString()}`)
  }

  const featured = listings.slice(0, 6)

  return (
    <main className="bg-slate-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-amber-400 px-4 pt-8 pb-16">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
            Cari Kost di Banten
          </h1>
          <p className="text-slate-700 text-sm">
            Temukan kost & kontrakan terbaik, harga transparan, bayar online
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nama kost atau alamat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select
            value={kota}
            onChange={e => setKota(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Semua Kota</option>
            {KOTA_BANTEN.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <button
            onClick={handleSearch}
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Cari
          </button>
        </div>
      </section>

      {/* ── Kota Populer ── */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 mb-8">
        <div className="grid grid-cols-4 gap-2">
          {KOTA_BANTEN.slice(0, 4).map(k => (
            <button
              key={k}
              onClick={() => navigate(`/listing?kota=${encodeURIComponent(k)}`)}
              className="bg-white rounded-xl shadow-sm p-3 text-center hover:shadow-md transition-shadow"
            >
              <MapPin size={20} className="text-amber-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 leading-tight">
                {k.replace('Kota ', '').replace('Kabupaten ', 'Kab. ')}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Listing Terbaru ── */}
      <section className="max-w-5xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Kost Tersedia</h2>
          <Link to="/listing" className="text-amber-500 text-sm font-medium flex items-center gap-1">
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-32 bg-slate-200" />
                <div className="p-3">
                  <div className="h-3 bg-slate-200 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Belum ada listing tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {featured.map(listing => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="h-32 bg-slate-100 overflow-hidden">
                  {listing.foto?.[0] ? (
                    <img src={listing.foto[0]} alt={listing.nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{listing.nama}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                    <MapPin size={10} />
                    <span className="truncate">{listing.kota}</span>
                  </div>
                  <p className="text-amber-500 font-bold text-sm mt-1">
                    {formatRupiah(listing.harga)}
                    <span className="text-slate-400 font-normal text-xs">/bln</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Keunggulan ── */}
      <section className="bg-white py-10 px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-slate-900 text-center mb-6">Kenapa KostKoin?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Star size={24} className="text-amber-400" />,   title: 'Listing Terverifikasi',  desc: 'Semua kost dicek & disetujui admin sebelum tayang' },
              { icon: <Shield size={24} className="text-amber-400" />, title: 'Pembayaran Aman',        desc: 'Transaksi terlindungi via Midtrans, uang aman' },
              { icon: <MapPin size={24} className="text-amber-400" />, title: 'Fokus Banten',           desc: 'Platform kost pertama khusus Provinsi Banten' },
            ].map((f, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-50">
                <div className="shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{f.title}</h3>
                  <p className="text-slate-500 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Pemilik ── */}
      <section className="mx-4 mb-10 bg-amber-400 rounded-2xl p-6 max-w-5xl md:mx-auto text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Punya Kost di Banten?</h2>
        <p className="text-slate-700 text-sm mb-4">Daftarkan gratis, jangkau ribuan penyewa sekarang</p>
        <Link
          to="/register"
          className="inline-block bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors"
        >
          Daftarkan Properti
        </Link>
      </section>

    </main>
  )
})

HomePage.displayName = 'HomePage'
export default HomePage
