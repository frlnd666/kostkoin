import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { Download, ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import {
  listenBookingById,
  formatTanggal,
  labelStatus,
  colorStatus,
  labelTipe,
} from '../../services/bookingService'
import type { Booking }  from '../../types/booking'
import { formatRupiah }  from '../../utils/format'
import Spinner           from '../../components/ui/Spinner'
import Button            from '../../components/ui/Button'

const BuktiBooking = memo(() => {
  const { id }                = useParams<{ id: string }>()
  const navigate              = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = listenBookingById(id, data => {
      setBooking(data)
      setLoading(false)
    })
    return () => unsub()
  }, [id])

  const handleDownload = () => {
    window.print()
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  )

  if (!booking) return (
    <div className="text-center py-20 text-slate-400">
      <p className="text-lg font-medium">Bukti booking tidak ditemukan</p>
      <button
        onClick={() => navigate('/riwayat')}
        className="mt-3 text-sm text-amber-500 hover:text-amber-600"
      >
        Kembali ke Riwayat
      </button>
    </div>
  )

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
        >
          <Download size={14} /> Unduh
        </button>
      </div>

      {/* Bukti Booking Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print:shadow-none print:border-0">

        {/* Header Bukti */}
        <div className="bg-amber-400 px-5 py-4 text-slate-900">
          <p className="text-xs font-semibold opacity-70 mb-0.5">KostKoin — Bukti Booking</p>
          <p className="font-bold text-lg">{booking.listingNama}</p>
          <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
            <MapPin size={11} /> {booking.listingAlamat}
          </p>
        </div>

        {/* Status */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorStatus(booking.status)}`}>
            {labelStatus(booking.status)}
          </span>
        </div>

        {/* Info Penyewa */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Info Penyewa</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Nama',   value: booking.penyewaNama  },
              { label: 'Email',  value: booking.penyewaEmail },
              { label: 'No. HP', value: booking.penyewaNoHp || '-' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400 flex-shrink-0">{item.label}</span>
                <span className="font-medium text-slate-700 text-right truncate">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Sewa */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Detail Sewa</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Tipe Sewa',  value: labelTipe(booking.tipeKamar)              },
              { label: 'Durasi',     value: `${booking.durasi} ${booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}` },
              { label: 'Check-in',  value: formatTanggal(booking.tanggalMulai)        },
              { label: 'Check-out', value: formatTanggal(booking.tanggalSelesai)      },
            ].map((item, i) => (
              <div key={i} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400 flex-shrink-0 flex items-center gap-1">
                  <CalendarDays size={11} /> {item.label}
                </span>
                <span className="font-medium text-slate-700 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biaya */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Rincian Biaya</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                {formatRupiah(booking.hargaSatuan)} × {booking.durasi}{' '}
                {booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}
              </span>
              <span className="font-medium text-slate-700">
                {formatRupiah(booking.hargaSatuan * booking.durasi)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2">
              <span className="text-slate-900">Total</span>
              <span className="text-amber-500">{formatRupiah(booking.totalHarga)}</span>
            </div>
          </div>
        </div>

        {/* Pembayaran */}
        {booking.pembayaran && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pembayaran</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Metode</span>
                <span className="font-medium text-slate-700 capitalize">{booking.pembayaran.metode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID</span>
                <span className="font-medium text-slate-700 text-right text-xs">{booking.pembayaran.orderId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order ID Booking */}
        <div className="px-5 py-4 bg-slate-50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Booking ID</span>
            <span className="text-xs font-mono font-semibold text-slate-600">{booking.orderId}</span>
          </div>
        </div>
      </div>

      {/* Aksi */}
      <div className="mt-4 flex flex-col gap-3">
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/booking/detail/${booking.id}`)}>
          Lihat Detail Booking
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/riwayat')}>
          Kembali ke Riwayat
        </Button>
      </div>
    </main>
  )
})

BuktiBooking.displayName = 'BuktiBooking'
export default BuktiBooking
