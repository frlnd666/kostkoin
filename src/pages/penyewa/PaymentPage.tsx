import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import {
  CheckCircle, XCircle, Clock,
  AlertCircle, RefreshCw, ArrowLeft
} from 'lucide-react'
import type { ReactElement }    from 'react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { getBookingById, labelTipe, satuanTipe, formatTanggal, formatTanggalPendek } from '../../services/bookingService'
import { createSnapToken, checkPaymentStatus } from '../../services/paymentService'
import { sendNotification, notifTemplates }    from '../../services/notificationService'
import { updateBookingStatus }                 from '../../services/bookingService'
import type { Booking, BookingStatus }         from '../../types/booking'
import { formatRupiah }                        from '../../utils/format'

// ── Midtrans Snap type ────────────────────────────────────────
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void
        onPending: (result: any) => void
        onError:   (result: any) => void
        onClose:   () => void
      }) => void
    }
  }
}

// ── Status display config ─────────────────────────────────────
const statusInfo = (status: BookingStatus): {
  icon: ReactElement; label: string; color: string; bg: string
} => ({
  menunggu_pembayaran: {
    icon:  <Clock size={18} />,
    label: 'Menunggu Pembayaran',
    color: 'text-amber-600',
    bg:    'bg-amber-50 border-amber-200'
  },
  sudah_dibayar: {
    icon:  <CheckCircle size={18} />,
    label: 'Pembayaran Berhasil',
    color: 'text-green-600',
    bg:    'bg-green-50 border-green-200'
  },
  dikonfirmasi: {
    icon:  <CheckCircle size={18} />,
    label: 'Dikonfirmasi Pemilik',
    color: 'text-indigo-600',
    bg:    'bg-indigo-50 border-indigo-200'
  },
  aktif: {
    icon:  <CheckCircle size={18} />,
    label: 'Booking Aktif',
    color: 'text-green-600',
    bg:    'bg-green-50 border-green-200'
  },
  selesai: {
    icon:  <CheckCircle size={18} />,
    label: 'Selesai',
    color: 'text-slate-600',
    bg:    'bg-slate-50 border-slate-200'
  },
  dibatalkan: {
    icon:  <XCircle size={18} />,
    label: 'Dibatalkan',
    color: 'text-red-600',
    bg:    'bg-red-50 border-red-200'
  },
  hangus: {
    icon:  <XCircle size={18} />,
    label: 'Hangus',
    color: 'text-orange-600',
    bg:    'bg-orange-50 border-orange-200'
  },
})[status] ?? {
  icon:  <Clock size={18} />,
  label: status,
  color: 'text-slate-500',
  bg:    'bg-slate-50 border-slate-200'
}

// ─────────────────────────────────────────────────────────────
const PaymentPage = memo(() => {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()

  const [booking, setBooking]   = useState<Booking | null>(null)
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!id) return
    getBookingById(id)
      .then(setBooking)
      .finally(() => setLoading(false))
  }, [id])

  const handlePay = async () => {
    if (!booking) return
    setPaying(true)
    setError('')
    try {
      const token = await createSnapToken({
        bookingId:    booking.id,
        orderId:      booking.orderId!,
        totalHarga:   booking.totalHarga,
        penyewaNama:  booking.penyewaNama,
        penyewaEmail: booking.penyewaEmail,
        penyewaNoHp:  booking.penyewaNoHp ?? '',
      })

      window.snap.pay(token, {
        onSuccess: async () => {
          // Update status booking → sudah_dibayar
          await updateBookingStatus(booking.id, 'sudah_dibayar')

          // Notif ke penyewa
          const tmpl = notifTemplates.pembayaranLunas(booking.listingNama, booking.id)
          await sendNotification(
            booking.penyewaId, 'pembayaran_lunas',
            tmpl.title, tmpl.body, tmpl.data
          )

          setBooking(prev => prev ? { ...prev, status: 'sudah_dibayar' } : prev)
          setPaying(false)
        },
        onPending: () => {
          setBooking(prev => prev ? { ...prev, status: 'menunggu_pembayaran' } : prev)
          setPaying(false)
        },
        onError: () => {
          setError('Pembayaran gagal. Silakan coba lagi.')
          setPaying(false)
        },
        onClose: () => {
          setPaying(false)
        },
      })
    } catch (e: any) {
      setError(e.message ?? 'Gagal memproses pembayaran')
      setPaying(false)
    }
  }

  const handleCekStatus = async () => {
    if (!booking?.orderId) return
    setChecking(true)
    setError('')
    try {
      const status = await checkPaymentStatus(booking.orderId) as BookingStatus
      setBooking(prev => prev ? { ...prev, status } : prev)
    } catch (e: any) {
      setError(e.message ?? 'Gagal mengecek status pembayaran')
    } finally {
      setChecking(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center py-20">
      <Spinner size="lg" />
    </div>
  )

  if (!booking) return (
    <div className="text-center py-20 text-slate-400">
      <p className="mb-3">Booking tidak ditemukan</p>
      <Button variant="ghost" onClick={() => navigate('/')}>Kembali</Button>
    </div>
  )

  const { icon, label, color, bg } = statusInfo(booking.status)

  return (
    <main className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">Detail Pembayaran</h1>
          <p className="text-xs text-slate-400 truncate max-w-[240px]">{booking.listingNama}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border mb-4 ${bg}`}>
        <span className={color}>{icon}</span>
        <span className={`font-semibold text-sm ${color}`}>{label}</span>
      </div>

      {/* Info Booking */}
      <Card padding="md" className="mb-4">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">Detail Booking</h3>
        <div className="flex flex-col gap-2.5 text-sm">
          {[
            { label: 'Kost',      value: booking.listingNama },
            { label: 'Alamat',    value: booking.listingAlamat },
            { label: 'Tipe Sewa', value: labelTipe(booking.tipeKamar) },
            { label: 'Check-in',  value: formatTanggalPendek(booking.tanggalMulai) },
            { label: 'Check-out', value: formatTanggalPendek(booking.tanggalSelesai) },
            { label: 'Durasi',    value: `${booking.durasi} ${satuanTipe(booking.tipeKamar)}` },
          ].map(item => (
            <div key={item.label} className="flex justify-between gap-4">
              <span className="text-slate-400 shrink-0">{item.label}</span>
              <span className="text-slate-700 font-medium text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Ringkasan Biaya */}
      <Card padding="md" className="mb-4 bg-amber-50 border border-amber-100">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>{formatRupiah(booking.hargaSatuan)} × {booking.durasi} {satuanTipe(booking.tipeKamar)}</span>
            <span>{formatRupiah(booking.totalHarga)}</span>
          </div>
          <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-slate-900">
            <span>Total Pembayaran</span>
            <span className="text-amber-500 text-base">{formatRupiah(booking.totalHarga)}</span>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 mb-4">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Aksi: Menunggu Pembayaran */}
      {booking.status === 'menunggu_pembayaran' && (
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth loading={paying} onClick={handlePay}>
            Bayar Sekarang · {formatRupiah(booking.totalHarga)}
          </Button>
          <Button variant="ghost" size="lg" fullWidth loading={checking} onClick={handleCekStatus}>
            <RefreshCw size={15} className="mr-1.5" />
            Cek Status Pembayaran
          </Button>
        </div>
      )}

      {/* Aksi: Sudah Bayar */}
      {booking.status === 'sudah_dibayar' && (
        <div className="flex flex-col gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 text-green-700 text-sm text-center font-medium">
            🎉 Pembayaran berhasil! Tunggu konfirmasi check-in dari pemilik ya.
          </div>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/riwayat')}>
            Lihat Riwayat Booking
          </Button>
        </div>
      )}

      {/* Aksi: Aktif / Dikonfirmasi */}
      {(booking.status === 'aktif' || booking.status === 'dikonfirmasi') && (
        <div className="flex flex-col gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 text-green-700 text-sm text-center font-medium">
            ✅ Booking kamu sudah aktif. Selamat menikmati!
          </div>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/riwayat')}>
            Lihat Riwayat Booking
          </Button>
        </div>
      )}

      {/* Aksi: Dibatalkan / Hangus */}
      {(booking.status === 'dibatalkan' || booking.status === 'hangus') && (
        <div className="flex flex-col gap-3">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-red-700 text-sm text-center">
            {booking.status === 'hangus'
              ? 'Booking hangus karena melewati batas waktu pembayaran.'
              : `Booking dibatalkan. ${booking.alasanBatal ? `Alasan: ${booking.alasanBatal}` : ''}`
            }
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/listing')}>
            Cari Kost Lain
          </Button>
        </div>
      )}

    </main>
  )
})

PaymentPage.displayName = 'PaymentPage'
export default PaymentPage
