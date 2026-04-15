import { memo, useEffect, useState, useRef } from 'react'
import { useParams, useNavigate }            from 'react-router-dom'
import { CheckCircle, Download, ArrowLeft }  from 'lucide-react'
import Spinner from '../../components/ui/Spinner'
import { getBookingById }              from '../../services/bookingService'
import { formatRupiah, formatTanggal } from '../../utils/format'
import type { Booking }                from '../../types/booking'

const BuktiBooking = memo(() => {
  const { id }                  = useParams<{ id: string }>()
  const navigate                = useNavigate()
  const [booking, setBooking]   = useState<Booking | null>(null)
  const [loading, setLoading]   = useState(true)
  const buktiRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getBookingById(id)
      .then(setBooking)
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => window.print()

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!booking) return (
    <div className="text-center py-20 text-slate-400">
      <p>Bukti tidak ditemukan</p>
      <button onClick={() => navigate(-1)} className="mt-2 text-amber-500 text-sm">Kembali</button>
    </div>
  )

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-slate-500 text-sm mb-4 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Bukti Card */}
      <div ref={buktiRef} className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:shadow-none">

        {/* Header */}
        <div className="bg-amber-400 px-6 py-5 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">KostKoin</h1>
          <p className="text-slate-700 text-xs mt-0.5">Bukti Pembayaran Resmi</p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 py-4 border-b border-slate-100">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-semibold text-green-600 text-sm">Pembayaran Berhasil</span>
        </div>

        {/* Detail */}
        <div className="px-6 py-4 flex flex-col gap-3">
          {[
            { label: 'No. Booking',     value: booking.id },
            { label: 'No. Order',       value: booking.orderId ?? '-' },
            { label: 'Nama Penyewa',    value: booking.penyewaNama },
            { label: 'No. HP',          value: booking.penyewaNoHp },
            { label: 'Kost',            value: booking.listingNama },
            { label: 'Alamat',          value: booking.listingAlamat },
            { label: 'Tanggal Mulai',   value: formatTanggal(booking.tanggalMulai) },
            { label: 'Tanggal Selesai', value: formatTanggal(booking.tanggalSelesai) },
            { label: 'Durasi',          value: `${booking.durasi} Bulan` },
          ].map((item, i) => (
            <div key={i} className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400 shrink-0">{item.label}</span>
              <span className="text-slate-800 font-medium text-right break-all">{item.value}</span>
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 my-1" />

          {/* Rincian Biaya */}
          <div className="flex justify-between text-sm text-slate-500">
            <span>Harga Kost</span>
            <span>{formatRupiah(booking.harga)} × {booking.durasi} bln</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Biaya Layanan (10%)</span>
            <span>{formatRupiah(Math.round(booking.harga * booking.durasi * 0.1))}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Biaya Midtrans</span>
            <span>{formatRupiah(4000)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
            <span>Total Dibayar</span>
            <span className="text-amber-500">{formatRupiah(booking.totalHarga)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 text-center">
          <p className="text-xs text-slate-400">
            Tunjukkan bukti ini kepada pemilik kost saat check-in
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            KostKoin · kostkoin.vercel.app
          </p>
        </div>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors print:hidden"
      >
        <Download size={16} />
        Simpan / Print Bukti
      </button>
    </main>
  )
})

BuktiBooking.displayName = 'BuktiBooking'
export default BuktiBooking
