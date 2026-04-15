import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { CalendarDays, Clock, MapPin, AlertCircle, Info } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getListingById } from '../../services/listingService'
import { createBooking }  from '../../services/bookingService'
import { useAuthStore }   from '../../store/authStore'
import type { Listing }   from '../../types/listing'
import { formatRupiah }   from '../../utils/format'

// ── Konstanta fee ──────────────────────────────────────────
const FEE_PERSEN     = 0.10   // 10% biaya layanan
const BIAYA_MIDTRANS = 4_000  // Rp 4.000 biaya payment gateway

// ── Helper kalkulasi ───────────────────────────────────────
const hitungTanggalSelesai = (
  tanggalMulai: string,
  durasi: number,
  tipe: 'perhari' | 'perbulan'
): string => {
  const d = new Date(tanggalMulai)
  if (tipe === 'perhari') {
    d.setDate(d.getDate() + durasi)
  } else {
    d.setMonth(d.getMonth() + durasi)
  }
  return d.toISOString().split('T')[0]
}

const hitungTotal = (harga: number, durasi: number): number => {
  const subtotal    = harga * durasi
  const biayaLayan  = Math.round(subtotal * FEE_PERSEN)
  return subtotal + biayaLayan + BIAYA_MIDTRANS
}

// ── Opsi durasi ────────────────────────────────────────────
const DURASI_HARIAN  = [1, 2, 3, 5, 7, 14, 30]
const DURASI_BULANAN = [1, 2, 3, 4, 5, 6, 9, 12]

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
      .then(data => {
        setListing(data)
        // Reset durasi saat listing berubah
        setDurasi(1)
      })
      .finally(() => setLoading(false))
  }, [id])

  const tipeHarga     = listing?.tipeHarga ?? 'perbulan'
  const satuanLabel   = tipeHarga === 'perhari' ? 'hari' : 'bulan'
  const opsiDurasi    = tipeHarga === 'perhari' ? DURASI_HARIAN : DURASI_BULANAN

  const tanggalSelesai = listing
    ? hitungTanggalSelesai(tanggalMulai, durasi, tipeHarga)
    : today

  // Rincian biaya
  const subtotal     = listing ? listing.harga * durasi : 0
  const biayaLayan   = Math.round(subtotal * FEE_PERSEN)
  const totalHarga   = subtotal + biayaLayan + BIAYA_MIDTRANS

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
        tipeHarga,
        durasi,
        subtotal,
        biayaLayanan:   biayaLayan,
        biayaMidtrans:  BIAYA_MIDTRANS,
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

      {/* ── Info Kost ── */}
      <Card padding="md" className="mb-4">
        {listing.foto?.[0] && (
          <div className="h-36 rounded-xl overflow-hidden mb-3 -mx-1">
            <img src={listing.foto[0]} alt={listing.nama} className="w-full h-full object-cover" />
          </div>
        )}
        <h2 className="font-semibold text-slate-900 mb-1">{listing.nama}</h2>
        <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
          <MapPin size={13} />
          <span>{listing.alamat}, {listing.kota}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold">
            {formatRupiah(listing.harga)}
          </span>
          <span className="text-slate-400 text-xs">/{satuanLabel}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            tipeHarga === 'perhari'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-green-50 text-green-600'
          }`}>
            {tipeHarga === 'perhari' ? '📅 Per Hari' : '🗓️ Per Bulan'}
          </span>
        </div>
      </Card>

      {/* ── Form Booking ── */}
      <Card padding="md" className="mb-4">
        <h3 className="font-semibold text-slate-700 mb-4">Detail Sewa</h3>
        <div className="flex flex-col gap-4">

          {/* Tanggal Mulai */}
          <div>
            <label
              htmlFor="tanggal-mulai"
              className="text-sm text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium"
            >
              <CalendarDays size={14} className="text-amber-400" /> Tanggal Mulai
            </label>
            <input
              id="tanggal-mulai"
              type="date"
              min={today}
              value={tanggalMulai}
              onChange={e => setTanggalMulai(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Durasi */}
          <div>
            <label
              htmlFor="durasi"
              className="text-sm text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium"
            >
              <Clock size={14} className="text-amber-400" />
              Durasi Sewa
            </label>
            <select
              id="durasi"
              value={durasi}
              onChange={e => setDurasi(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {opsiDurasi.map(n => (
                <option key={n} value={n}>
                  {n} {satuanLabel}
                  {tipeHarga === 'perhari' && n >= 7 ? ` (${Math.round(n / 7)} minggu)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Selesai */}
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm flex justify-between items-center">
            <span className="text-slate-400">Tanggal Selesai</span>
            <span className="font-medium text-slate-700">{tanggalSelesai}</span>
          </div>

        </div>
      </Card>

      {/* ── Ringkasan Biaya ── */}
      <Card padding="md" className="mb-4 bg-amber-50 border border-amber-100">
        <h3 className="font-semibold text-slate-700 mb-3">Ringkasan Biaya</h3>
        <div className="flex flex-col gap-2 text-sm">

          {/* Subtotal */}
          <div className="flex justify-between text-slate-600">
            <span>{formatRupiah(listing.harga)} × {durasi} {satuanLabel}</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          {/* Biaya layanan */}
          <div className="flex justify-between text-slate-500">
            <span className="flex items-center gap-1">
              Biaya layanan (10%)
              <Info size={12} className="text-slate-400" />
            </span>
            <span>{formatRupiah(biayaLayan)}</span>
          </div>

          {/* Biaya Midtrans */}
          <div className="flex justify-between text-slate-500">
            <span>Biaya pembayaran</span>
            <span>{formatRupiah(BIAYA_MIDTRANS)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-amber-200 pt-2 mt-1 flex justify-between font-bold text-slate-900">
            <span>Total Pembayaran</span>
            <span className="text-amber-500 text-base">{formatRupiah(totalHarga)}</span>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        onClick={handleBooking}
      >
        Lanjut ke Pembayaran — {formatRupiah(totalHarga)}
      </Button>

    </main>
  )
})

BookingPage.displayName = 'BookingPage'
export default BookingPage
