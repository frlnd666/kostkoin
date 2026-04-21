import { memo, useEffect, useState }    from 'react'
import { useParams, useNavigate }       from 'react-router-dom'
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import type { ReactElement }            from 'react'
import { getBookingById }               from '../../services/bookingService'
import { createSnapToken, checkPaymentStatus } from '../../services/paymentService'
import type { Booking, BookingStatus }  from '../../types/booking'
import { formatRupiah }                 from '../../utils/format'
import Card                             from '../../components/ui/Card'
import Button                           from '../../components/ui/Button'
import Spinner                          from '../../components/ui/Spinner'
import { playSuccessSound, playErrorSound, playPendingSound } from '../../utils/notifSound'

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: Record<string, string>) => void
        onPending: (result: Record<string, string>) => void
        onError:   (result: Record<string, string>) => void
        onClose:   () => void
      }) => void
    }
  }
}

const statusInfo = (status: string): { icon: ReactElement; label: string; color: string } => {
  const map: Record<string, { icon: ReactElement; label: string; color: string }> = {
    menunggu_pembayaran: { icon: <Clock size={20} />,       label: 'Menunggu Pembayaran', color: 'text-amber-500'  },
    sudah_dibayar:       { icon: <CheckCircle size={20} />, label: 'Pembayaran Berhasil', color: 'text-green-500'  },
    dikonfirmasi:        { icon: <CheckCircle size={20} />, label: 'Booking Dikonfirmasi', color: 'text-indigo-500' },
    aktif:               { icon: <CheckCircle size={20} />, label: 'Booking Aktif',        color: 'text-green-500'  },
    dibatalkan:          { icon: <XCircle size={20} />,     label: 'Pembayaran Dibatalkan', color: 'text-red-500'   },
    hangus:              { icon: <XCircle size={20} />,     label: 'Booking Hangus',        color: 'text-orange-500' },
    selesai:             { icon: <CheckCircle size={20} />, label: 'Booking Selesai',       color: 'text-slate-500'  },
  }
  return map[status] ?? { icon: <Clock size={20} />, label: status, color: 'text-slate-500' }
}

const PaymentPage = memo(() => {
  const { id }                      = useParams<{ id: string }>()
  const navigate                    = useNavigate()
  const [booking, setBooking]       = useState<Booking | null>(null)
  const [loading, setLoading]       = useState(true)
  const [paying, setPaying]         = useState(false)
  const [checking, setChecking]     = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!id) return
    getBookingById(id).then(setBooking).finally(() => setLoading(false))
  }, [id])

  const handlePay = async () => {
    if (!booking) return
    setPaying(true)
    setError('')
    try {
      const token = await createSnapToken({
        bookingId:   booking.id,
        orderId:     booking.orderId,
        totalHarga:  booking.totalHarga,
        penyewaNama: booking.penyewaNama,
        penyewaEmail: booking.penyewaEmail,
        penyewaNoHp: booking.penyewaNoHp,
      })

      window.snap.pay(token, {
        onSuccess: () => {
  playSuccessSound()   // ← tambahkan ini
  setBooking(prev => prev ? { ...prev, status: 'sudah_dibayar' as BookingStatus } : prev)
  setPaying(false)
},
        onPending: () => {
          playPendingSound()
          setBooking(prev => prev ? { ...prev, status: 'menunggu_pembayaran' as BookingStatus } : prev)
          setPaying(false)
        },
        onError: (_result: Record<string, string>) => {
    playErrorSound()
    setError('Pembayaran gagal, silakan coba lagi.')
    setPaying(false)
  },
  onClose: () => {          // ← ini yang menyebabkan error TS2345
    setPaying(false)
  },
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memproses pembayaran')
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mengecek status pembayaran')
    } finally {
      setChecking(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!booking) return (
    <div className="text-center py-20 text-slate-400">
      <p>Booking tidak ditemukan</p>
      <Button variant="ghost" onClick={() => navigate(-1)}>Kembali</Button>
    </div>
  )

  const { icon, label, color } = statusInfo(booking.status)

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Detail Pembayaran</h1>

      {/* Status */}
      <Card padding="md" className="mb-4">
        <div className={`flex items-center gap-2 font-semibold ${color}`}>
          {icon}
          <span>{label}</span>
        </div>
      </Card>

      {/* Info Booking */}
      <Card padding="md" className="mb-4">
        <h3 className="font-semibold text-slate-700 mb-3">Detail Booking</h3>
        <div className="flex flex-col gap-2 text-sm">
          {[
            { label: 'Kost',           value: booking.listingNama                },
            { label: 'Alamat',         value: booking.listingAlamat              },
            { label: 'Tipe Sewa',      value: booking.tipeKamar                  },
            { label: 'Durasi',         value: `${booking.durasi} ${booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}` },
            { label: 'Order ID',       value: booking.orderId                    },
          ].map((item, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span className="text-slate-400 flex-shrink-0">{item.label}</span>
              <span className="text-slate-700 font-medium text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Ringkasan Biaya */}
      <Card padding="md" className="mb-4 bg-amber-50 border border-amber-100">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>
              {formatRupiah(booking.hargaSatuan)} × {booking.durasi}{' '}
              {booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}
            </span>
            <span>{formatRupiah(booking.hargaSatuan * booking.durasi)}</span>
          </div>
          <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-900">
            <span>Total Pembayaran</span>
            <span className="text-amber-500 text-base">{formatRupiah(booking.totalHarga)}</span>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 mb-4">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {/* Action Buttons */}
      {booking.status === 'menunggu_pembayaran' && (
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth loading={paying} onClick={handlePay}>
            Bayar Sekarang {formatRupiah(booking.totalHarga)}
          </Button>
          <Button variant="ghost" size="lg" fullWidth loading={checking} onClick={handleCekStatus}>
            <RefreshCw size={15} className="mr-1.5" /> Cek Status Pembayaran
          </Button>
        </div>
      )}

      {booking.status === 'sudah_dibayar' && (
        <div className="flex flex-col gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center font-medium">
            Pembayaran berhasil! Menunggu konfirmasi pemilik.
          </div>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate(`/booking/detail/${booking.id}`)}>
            Lihat Detail Booking
          </Button>
        </div>
      )}

      {(booking.status === 'dikonfirmasi' || booking.status === 'aktif') && (
        <div className="flex flex-col gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center font-medium">
            {booking.status === 'dikonfirmasi' ? 'Check-in sudah dikonfirmasi pemilik! 🎉' : 'Booking sedang aktif 🏠'}
          </div>
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate(`/booking/detail/${booking.id}`)}>
            Lihat Detail Booking
          </Button>
        </div>
      )}

      {booking.status === 'dibatalkan' && (
        <div className="flex flex-col gap-3">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm text-center">
            Booking dibatalkan. Silakan booking ulang.
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/listing')}>
            Cari Kost Lagi
          </Button>
        </div>
      )}
    </main>
  )
})

PaymentPage.displayName = 'PaymentPage'
export default PaymentPage
