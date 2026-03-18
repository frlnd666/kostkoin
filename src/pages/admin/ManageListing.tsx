import { memo, useEffect, useState } from 'react'
import { CheckCircle, XCircle, EyeOff, RefreshCw } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Badge   from '../../components/ui/Badge'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getAllListings, approveListing, rejectListing, deactivateListing } from '../../services/adminService'
import { formatRupiah } from '../../utils/format'
import type { Listing } from '../../types/listing'

const statusBadge = (status: string): { variant: 'success' | 'warning' | 'danger' | 'default', label: string } => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default', label: string }> = {
    approved: { variant: 'success', label: 'Aktif' },
    active:   { variant: 'success', label: 'Aktif' },
    pending:  { variant: 'warning', label: 'Pending' },
    inactive: { variant: 'default', label: 'Nonaktif' },
    rejected: { variant: 'danger',  label: 'Ditolak' },
  }
  return map[status] ?? { variant: 'default', label: status }
}

const ManageListing = memo(() => {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [filter, setFilter]     = useState<string>('all')

  const fetchListings = async () => {
    setLoading(true)
    const data = await getAllListings()
    setListings(data)
    setLoading(false)
  }

  useEffect(() => { fetchListings() }, [])

  const handleApprove = async (id: string) => {
    setActionId(id)
    await approveListing(id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l))
    setActionId(null)
  }

  const handleReject = async (id: string) => {
    setActionId(id)
    await rejectListing(id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
    setActionId(null)
  }

  const handleDeactivate = async (id: string) => {
    setActionId(id)
    await deactivateListing(id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'inactive' } : l))
    setActionId(null)
  }

  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter)

  const counts = {
    all:      listings.length,
    pending:  listings.filter(l => l.status === 'pending').length,
    active:   listings.filter(l => l.status === 'approved' || l.status === 'active').length,
    inactive: listings.filter(l => l.status === 'inactive').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Kelola Listing</h2>
        <Button variant="ghost" size="sm" onClick={fetchListings}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all',      label: `Semua (${counts.all})` },
          { key: 'pending',  label: `Pending (${counts.pending})` },
          { key: 'approved', label: `Aktif (${counts.active})` },
          { key: 'inactive', label: `Nonaktif (${counts.inactive})` },
          { key: 'rejected', label: `Ditolak (${counts.rejected})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-amber-400 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card padding="md" className="text-center py-12">
          <p className="text-slate-400">Tidak ada listing</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(listing => {
            const { variant, label } = statusBadge(listing.status)
            const isActioning = actionId === listing.id
            return (
              <Card key={listing.id} padding="md">
                <div className="flex items-start justify-between gap-4">

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
                    <p className="text-sm text-slate-500 mb-1">{listing.alamat}, {listing.kota}</p>
                    <p className="text-sm text-slate-500 mb-1">
                      Pemilik: <span className="font-medium">{listing.pemilikNama}</span>
                    </p>
                    <p className="text-amber-500 font-semibold text-sm">
                      {formatRupiah(listing.harga)}<span className="text-slate-400 font-normal">/bulan</span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {listing.status === 'pending' && (
                      <>
                        <Button variant="primary" size="sm" loading={isActioning} onClick={() => handleApprove(listing.id)}>
                          <CheckCircle size={14} /> Approve
                        </Button>
                        <Button variant="danger" size="sm" loading={isActioning} onClick={() => handleReject(listing.id)}>
                          <XCircle size={14} /> Tolak
                        </Button>
                      </>
                    )}
                    {(listing.status === 'approved' || listing.status === 'active') && (
                      <Button variant="secondary" size="sm" loading={isActioning} onClick={() => handleDeactivate(listing.id)}>
                        <EyeOff size={14} /> Nonaktifkan
                      </Button>
                    )}
                    {(listing.status === 'inactive' || listing.status === 'rejected') && (
                      <Button variant="outline" size="sm" loading={isActioning} onClick={() => handleApprove(listing.id)}>
                        <CheckCircle size={14} /> Aktifkan
                      </Button>
                    )}
                  </div>

                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
})

ManageListing.displayName = 'ManageListing'
export default ManageListing
