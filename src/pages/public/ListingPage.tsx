import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, MapPin } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Badge   from '../../components/ui/Badge'
import { getApprovedListings } from '../../services/listingService'
import type { Listing } from '../../types/listing'
import { formatRupiah } from '../../utils/format'

const ListingPage = memo(() => {
  const navigate             = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [filtered, setFiltered] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [kota, setKota]         = useState('')

  useEffect(() => {
    getApprovedListings()
      .then(data => { setListings(data); setFiltered(data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = listings
    if (search) result = result.filter(l =>
      l.nama.toLowerCase().includes(search.toLowerCase()) ||
      l.alamat.toLowerCase().includes(search.toLowerCase())
    )
    if (kota) result = result.filter(l =>
      l.kota.toLowerCase().includes(kota.toLowerCase())
    )
    setFiltered(result)
  }, [search, kota, listings])

  const kotaList = [...new Set(listings.map(l => l.kota))].sort()

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Cari Kost</h1>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau alamat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={kota}
            onChange={e => setKota(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white appearance-none"
          >
            <option value="">Semua Kota</option>
            {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium">Kost tidak ditemukan</p>
          <p className="text-sm mt-1">Coba ubah filter pencarian</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <Card key={listing.id} padding="none" className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/listing/${listing.id}`)}>
              {/* Foto */}
              <div className="h-44 bg-slate-100 overflow-hidden">
                {listing.foto?.[0] ? (
                  <img src={listing.foto[0]} alt={listing.nama} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">🏠</div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1 truncate">{listing.nama}</h3>
                <div className="flex items-center gap-1 text-slate-500 text-xs mb-2">
                  <MapPin size={12} />
                  <span className="truncate">{listing.alamat}, {listing.kota}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-amber-500 font-bold text-base">{formatRupiah(listing.harga)}</span>
                    <span className="text-slate-400 text-xs">/bulan</span>
                  </div>
                  <Badge variant="success">Tersedia</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
})

ListingPage.displayName = 'ListingPage'
export default ListingPage
