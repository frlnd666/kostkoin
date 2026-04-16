import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { MapPin, CheckCircle, ArrowLeft, Share2, CheckCircle2 } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Badge   from '../../components/ui/Badge'
import { getListingById } from '../../services/listingService'
import { useAuthStore }   from '../../store/authStore'
import type { Listing }   from '../../types/listing'
import { formatRupiah }   from '../../utils/format'

const DetailPage = memo(() => {
  const { id }                = useParams<{ id: string }>()
  const navigate              = useNavigate()
  const { user }              = useAuthStore()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (!id) return
    getListingById(id)
      .then(setListing)
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
  const url = window.location.href
  const teks = `🏠 *${listing?.nama}*\n📍 ${listing?.alamat}, ${listing?.kota}\n💰 ${formatRupiah(listing?.harga ?? 0)}/bulan\n\nCek di KostKoin 👇\n${url}`

  if (navigator.share) {
    await navigator.share({
      title: listing?.nama ?? 'KostKoin',
      text:  teks,
      url,
    })
  } else {
    await navigator.clipboard.writeText(`${teks}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
}

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!listing) return (
    <div className="text-center py-20 text-slate-400">
      <p className="text-lg font-medium">Kost tidak ditemukan</p>
      <Button variant="ghost" onClick={() => navigate('/listing')}>Kembali</Button>
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">

      {/* Back + Share */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-green-500">Link disalin!</span>
            </>
          ) : (
            <>
              <Share2 size={16} />
              Share
            </>
          )}
        </button>
      </div>

      {/* Foto Gallery */}
      <div className="rounded-2xl overflow-hidden h-56 bg-slate-100 mb-2">
        {listing.foto?.[fotoIdx] ? (
          <img src={listing.foto[fotoIdx]} alt={listing.nama} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl">🏠</div>
        )}
      </div>
      {listing.foto?.length > 1 && (
        <div className="flex gap-2 mb-4">
          {listing.foto.map((f, i) => (
            <button key={i} onClick={() => setFotoIdx(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${fotoIdx === i ? 'border-amber-400' : 'border-transparent'}`}>
              <img src={f} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Info Utama */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-xl font-bold text-slate-900">{listing.nama}</h1>
        <Badge variant="success">Tersedia</Badge>
      </div>
      <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
        <MapPin size={14} />
        <span>{listing.alamat}, {listing.kota}</span>
      </div>

      {/* Harga */}
      <Card padding="md" className="mb-4 bg-amber-50 border border-amber-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Harga Sewa</p>
            <p className="text-2xl font-bold text-amber-500">
              {formatRupiah(listing.harga)}
              <span className="text-sm font-normal text-slate-400">/bulan</span>
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => user ? navigate(`/booking/${listing.id}`) : navigate('/login')}
          >
            {user ? 'Booking Sekarang' : 'Login untuk Booking'}
          </Button>
        </div>
      </Card>

      {/* Deskripsi */}
      <Card padding="md" className="mb-4">
        <h3 className="font-semibold text-slate-700 mb-2">Deskripsi</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{listing.deskripsi}</p>
      </Card>

      {/* Fasilitas */}
      {listing.fasilitas?.length > 0 && (
        <Card padding="md" className="mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Fasilitas</h3>
          <div className="grid grid-cols-2 gap-2">
            {listing.fasilitas.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle size={14} className="text-amber-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Pemilik */}
      <Card padding="md">
        <h3 className="font-semibold text-slate-700 mb-3">Info Pemilik</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold">
            {listing.pemilikNama?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{listing.pemilikNama}</p>
            <p className="text-xs text-slate-400">Pemilik Kost</p>
          </div>
        </div>
      </Card>

    </main>
  )
})

DetailPage.displayName = 'DetailPage'
export default DetailPage
