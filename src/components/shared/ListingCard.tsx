import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Users } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { formatRupiah } from '../../utils/formatRupiah'
import type { Listing } from '../../types/listing'

interface ListingCardProps {
  listing: Listing
}

const ListingCard = memo<ListingCardProps>(({ listing }) => {
  return (
    <Link to={`/listing/${listing.id}`}>
      <Card hoverable padding="none" className="overflow-hidden">
        {/* Foto */}
        <div className="relative h-48 bg-slate-200">
          {listing.foto[0] ? (
            <img
              src={listing.foto[0]}
              alt={listing.nama}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Tidak ada foto
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="info">{listing.tipe}</Badge>
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="success">{listing.tipeSewa}</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 truncate mb-1">{listing.nama}</h3>

          <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
            <MapPin size={12} />
            <span className="truncate">{listing.kecamatan}, {listing.kota}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-amber-500">
                {formatRupiah(listing.harga)}
              </span>
              <span className="text-xs text-slate-400 ml-1">
                / {listing.tipeSewa === 'Per Jam' ? 'jam' : listing.tipeSewa === 'Per Hari' ? 'hari' : 'bulan'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Users size={12} />
              <span>{listing.kapasitas} orang</span>
            </div>
          </div>

          {/* Fasilitas */}
          {listing.fasilitas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {listing.fasilitas.slice(0, 3).map(f => (
                <span key={f} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {f}
                </span>
              ))}
              {listing.fasilitas.length > 3 && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  +{listing.fasilitas.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
})

ListingCard.displayName = 'ListingCard'
export default ListingCard
 
