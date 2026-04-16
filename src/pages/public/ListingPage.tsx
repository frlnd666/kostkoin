import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import ListingCard from '../../components/ListingCard'
import { getApprovedListings } from '../../services/listingService'
import type { Listing } from '../../types/listing'

const ListingPage = memo(() => {
  const navigate                = useNavigate()
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
    <main style={{
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      minHeight: '100vh',
      padding: '1.5rem 1rem 4rem'
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
          fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--color-text)',
          marginBottom: '1.25rem'
        }}>
          Cari Kost
        </h1>

        {/* Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>

          {/* Search input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)', pointerEvents: 'none'
            }}/>
            <input
              type="text"
              placeholder="Cari nama atau alamat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.25rem', paddingRight: '1rem',
                paddingTop: '0.6rem', paddingBottom: '0.6rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 180ms ease',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,143,154,0.35)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          {/* Kota select */}
          <div style={{ position: 'relative' }}>
            <SlidersHorizontal size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)', pointerEvents: 'none'
            }}/>
            <select
              value={kota}
              onChange={e => setKota(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.25rem', paddingRight: '1rem',
                paddingTop: '0.6rem', paddingBottom: '0.6rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.85rem',
                color: kota ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
                outline: 'none', appearance: 'none',
              }}
            >
              <option value="">Semua Kota</option>
              {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        {/* Jumlah hasil */}
        {!loading && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {filtered.length} kost ditemukan
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 1rem',
            color: 'var(--color-text-muted)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}>🏠</div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
              Kost tidak ditemukan
            </p>
            <p style={{ fontSize: '0.8rem' }}>Coba ubah filter pencarian</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
            gap: '0.85rem'
          }}>
            {filtered.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
})

ListingPage.displayName = 'ListingPage'
export default ListingPage
