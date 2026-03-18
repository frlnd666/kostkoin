import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Home, Clock, CheckCircle, XCircle } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Badge   from '../../components/ui/Badge'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useAuthStore }          from '../../store/authStore'
import { getListingsByPemilik }  from '../../services/listingService'
import { formatRupiah }          from '../../utils/format'
import type { Listing }          from '../../types/listing'

const statusBadge = (status: string): { variant: 'success' | 'warning' | 'danger' | 'default', label: string } => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default', label: string }> = {
    approved: { variant: 'success', label: 'Aktif' },
    active:   { variant: 'success', label: 'Aktif' },
    pending:  { variant: 'warning', label: 'Menunggu Review' },
    rejected: { variant: 'danger',  label: 'Ditolak' },
    inactive: { variant: 'default', label: 'Nonaktif' },
  }
  return map[status] ?? { variant: 'default', label: status }
}

const DashboardPemilik = memo(() => {
  const { user }                      = useAuthStore()
  const [listings, setListings]       = useState<Listing[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!user) return
    getListingsByPemilik(user.uid ?? user.id)
      .then(setListings)
      .finally(() => setLoading(false))
  }, [user])

  const stats = {
    total:    listings.length,
    active:   listings.filter(l => l.status === 'approved' || l.status === 'active').length,
    pending:  listings.filter(l => l.status === 'pending').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Pemilik</h1>
          <p className="text-slate-500 text-sm">Halo, {user?.nama} 👋</p>
        </div>
        <Link to="/pemilik/tambah">
          <Button variant="primary" size="md">
            <PlusCircle size={16} />
            Tambah Listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Listing', value: stats.total,    icon: <Home size={20} />,       color: 'text-blue-500'   },
          { label: 'Aktif',         value: stats.active,   icon: <CheckCircle size={20} />, color: 'text-green-500'  },
          { label: 'Pending',       value: stats.pending,  icon: <Clock size={20} />,       color: 'text-yellow-500' },
          { label: 'Ditolak',       value: stats.rejected, icon: <XCircle size={20} />,     color: 'text-red-500'    },
        ].map((s, i) => (
          <Card key={i} padding="md">
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Listing List */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">Listing Saya</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : listings.length === 0 ? (
          <Card padding="md" className="text-center py-12">
            <Home size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada listing</p>
            <p className="text-slate-400 text-sm mb-4">Mulai tambahkan kost atau kontrakan kamu</p>
            <Link to="/pemilik/tambah">
              <Button variant="primary">
                <PlusCircle size={16} />
                Tambah Listing Pertama
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map(listing => {
              const { variant, label } = statusBadge(listing.status)
              return (
                <Card key={listing.id} padding="md">
                  <div className="flex items-start justify-between gap-3">

                    {/* Foto Thumbnail */}
                    {listing.foto?.[0] && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={listing.foto[0]} alt={listing.nama} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">{listing.nama}</h3>
                        <Badge variant={variant}>{label}</Badge>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{listing.alamat}, {listing.kota}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-amber-500 font-semibold">{formatRupiah(listing.harga)}</span>
                        <span className="text-slate-400">/bulan</span>
                      </div>
                    </div>

                    {listing.status === 'rejected' && (
                      <p className="text-xs text-red-400 max-w-xs shrink-0">Ditolak admin. Hubungi support.</p>
                    )}

                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

    </main>
  )
})

DashboardPemilik.displayName = 'DashboardPemilik'
export default DashboardPemilik
