import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { CalendarDays, Clock, MapPin, AlertCircle } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getListingById } from '../../services/listingService'
import { createBooking }  from '../../services/bookingService'
import { useAuthStore }   from '../../store/authStore'
import type { Listing }   from '../../types/listing'
import { formatRupiah }   from '../../utils/format'

const BookingPage = memo(() => {
  const { id }                      = useParams<{ id: string }>()
  const navigate                    = useNavigate()
  const { user }                    = useAuthStore()
  const [listing, setListing]       = useState<Listing | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [tanggalMulai, setTanggalMulai] = useState(today)
  const [durasi, setDurasi]             = useState(1)

  useEffect(() => {
    if (!id) return
    getListingById(id)
      .then(setListing)
      .finally(() => setLoading(false))
  }, [id])

  const tanggalSelesai = (() => {
    const d = new Date(tanggalMulai)
    d.setMonth(d.getMonth() + durasi)
    return d.toISOString().split('T')[0]
  })()

  const totalHarga = listing ? listing.harga * durasi : 0

  const handleBooking = async () => {
    if (!listing || !user) return
    setSubmitting(true)
    setError('')
    try {
      const orderId   = `ORDER-${Date.now()}-${user.uid.slice(0, 5)}`
      const bookingId = await createBooking({
        listingId:      listing.id,
        listingNama:    listing.nama,
        listingAlamat:  `${listing.alamat}, ${listing.kota}`,
        penyewaId:      user.uid,
        penyewaNama:    user.nama,
        penyewaEmail:   user.email,
        penyewaNoHp:    user.noHp,
        pemilikId:      listing.pemilikId,
        harga:          listing.harga,
        durasi,
        totalHarga,
        tanggalMulai,
        tanggalSelesai,
        status:         'pending',
        orderId,
      })
      navigate(`/payment/${bookingId}`)
    } catch (e) {
      console.error('BOOKING ERROR:', e)
      setError('Gagal membuat booking, coba lagi.')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!listing) return <div className="text-center py-20 text-slate-400">Listing tidak ditemukan</div>

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Form Booking</h1>

      {/* Info Kost */}
      <Card padding="md" className="mb-4">
        <h2 className="font-semibold text-slate-900 mb-1">{listing.nama}</h2>
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <MapPin size={13} />
          <span>{listing.alamat}, {listing.kota}</span>
        </div>
        <p className="text-amber-500 font-bold mt-2">
          {formatRupiah(listing.harga)}
          <span className="text-slate-400 text-xs font-normal">/bulan</span>
        </p>
      </Card>

      {/* Form */}
      <Card padding="md" className="mb-4">
        <h3 className="font-semibold text-slate-700 mb-4">Detail Booking</h3>
        <div className="flex flex-col gap-4">

          <div>
            <label htmlFor="tanggal-mulai" className="text-sm text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium">
              <CalendarDays size={14} className="text-amber-400" /> Tanggal Mulai
            </label>
            <input
              id="tanggal-mulai"
              name="tanggalMulai"
              type="date"
              min={today}
              value={tanggalMulai}
              onChange={e => setTanggalMulai(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="durasi" className="text-sm text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium">
              <Clock size={14} className="text-amber-400" /> Durasi Sewa
            </label>
            <select
              id="durasi"
              name="durasi"
              value={durasi}
              onChange={e => setDurasi(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {[1,2,3,4,5,6,9,12].map(n => (
                <option key={n} value={n}>{n} Bulan</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm">
            <span className="text-slate-400">Tanggal Selesai: </span>
            <span className="font-medium text-slate-700">{tanggalSelesai}</span>
          </div>
        </div>
      </Card>

      {/* Ringkasan */}
      <Card padding="md" className="mb-4 bg-amber-50 border border-amber-100">
        <h3 className="font-semibold text-slate-700 mb-3">Ringkasan Biaya</h3>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{formatRupiah(listing.harga)} × {durasi} bulan</span>
            <span>{formatRupiah(totalHarga)}</span>
          </div>
          <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span className="text-amber-500 text-base">{formatRupiah(totalHarga)}</span>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <Button variant="primary" size="lg" fullWidth loading={submitting} onClick={handleBooking}>
        Lanjut ke Pembayaran
      </Button>
    </main>
  )
})

BookingPage.displayName = 'BookingPage'
export default BookingPage
