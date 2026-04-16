import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { formatRupiah } from '../../utils/format'
import type { Listing } from '../../types/listing'

interface ListingCardProps {
  listing: Listing
}

const ListingCard = memo<ListingCardProps>(({ listing }) => {
  return (
    <Link to={`/listing/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = 'var(--shadow-md)'
          el.style.borderColor = 'rgba(255,255,255,0.11)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          el.style.borderColor = 'var(--color-border)'
        }}
      >
        {/* Foto */}
        <div style={{ position: 'relative', height: 176, overflow: 'hidden' }}>
          {listing.foto?.[0] ? (
            <img
              src={listing.foto[0]}
              alt={listing.nama}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-surface-dynamic)',
              fontSize: '2.5rem', opacity: 0.3
            }}>
              🏠
            </div>
          )}

          {/* Badge status */}
          <span style={{
            position: 'absolute', top: 8, left: 8,
            fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            color: 'var(--color-primary)',
            background: 'rgba(74,143,154,0.15)',
            border: '1px solid rgba(74,143,154,0.25)',
            padding: '0.18rem 0.55rem', borderRadius: 999,
            backdropFilter: 'blur(8px)',
          }}>
            Tersedia
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '0.85rem 0.95rem 0.95rem' }}>

          {/* Nama */}
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.92rem', fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '0.25rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.3
          }}>
            {listing.nama}
          </h3>

          {/* Lokasi */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: 'var(--color-text-muted)',
            marginBottom: '0.65rem'
          }}>
            <MapPin size={11} style={{ flexShrink: 0, color: 'var(--color-text-faint)' }}/>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {listing.alamat}, {listing.kota}
            </span>
          </div>

          {/* Fasilitas */}
          {listing.fasilitas.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.7rem' }}>
              {listing.fasilitas.slice(0, 3).map(f => (
                <span key={f} style={{
                  fontSize: '0.62rem', fontWeight: 500,
                  color: '#6db8c5',
                  background: 'rgba(74,143,154,0.08)',
                  border: '1px solid rgba(74,143,154,0.15)',
                  padding: '0.13rem 0.45rem', borderRadius: 999
                }}>
                  {f}
                </span>
              ))}
              {listing.fasilitas.length > 3 && (
                <span style={{
                  fontSize: '0.62rem', fontWeight: 500,
                  color: 'var(--color-text-faint)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border)',
                  padding: '0.13rem 0.45rem', borderRadius: 999
                }}>
                  +{listing.fasilitas.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer: harga + rating */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--color-divider)'
          }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem', fontWeight: 700,
                color: 'var(--color-gold)'
              }}>
                {formatRupiah(listing.harga)}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginLeft: 3 }}>
                /bulan
              </span>
            </div>
          </div>

        </div>
      </div>
    </Link>
  )
})

ListingCard.displayName = 'ListingCard'
export default ListingCard
