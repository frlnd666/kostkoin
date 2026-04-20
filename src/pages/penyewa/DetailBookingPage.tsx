import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { ArrowLeft, FileText, XCircle, CalendarDays, MapPin, Phone, MessageCircle } from 'lucide-react'
import {
  listenBookingById,
  batalkanBooking,
  formatTanggal,
  labelStatus,
  colorStatus,
  labelTipe,
} from '../../services/bookingService'
import type { Booking }  from '../../types/booking'
import { formatRupiah }  from '../../utils/format'
import Spinner           from '../../components/ui/Spinner'
import Button            from '../../components/ui/Button'
import Card              from '../../components/ui/Card'
import Modal             from '../../components/ui/Modal'
import { useAuthStore }  from '../../store/authStore'

const DetailBookingPage = memo(() => {
  const { id }                      = useParams<{ id: string }>()
  const navigate                    = useNavigate()
  const { user }                    = useAuthStore()
  const [booking, setBooking]       = useState<Booking | null>(null)
  const [loading, setLoading]       = useState(true)
  const [batalModal, setBatalModal] = useState(false)
  const [alasanBatal, setAlasanBatal] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!id) return
    const unsub = listenBookingById(id, data => {
      setBooking(data)
      setLoading(false)
    })
    return () => unsub()
  }, [id])

  const handleBatal = async () => {
    if (!booking || !alasanBatal.trim()) return
    setProcessing(true)
    setError('')
    try {
      await batalkanBooking(booking.id, booking, alasanBatal.trim(), 'penyewa')
      setBatalModal(false)
      setAlasanBatal('')
    } catch {
      setError('Gagal membatalkan booking. Coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  )

  if (!booking) return (
    <div className="text-center py-20 text-slate-400">
      <p className="text-lg font-medium">Booking tidak ditemukan</p>
      <button onClick={() => navigate('/riwayat')} className="mt-3 text-sm text-amber-500">
        Kembali ke Riwayat
      </button>
    </div>
  )

  const canBatal = ['menunggu_pembayaran'].includes(booking.status)
  const canBayar = booking.status === 'menunggu_pembayaran'

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Detail Booking</h1>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${colorStatus(booking.status)}`}>
          {labelStatus(booking.status)}
        </span>
        <span className="text-xs text-slate-300">#{booking.orderId || booking.id.slice(0, 8).toUpperCase()}</span>
      </div>

      {/* Info Kost */}
      <Card padding="md" className="mb-3">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{booking.listingNama}</p>
            <p className="text-xs text-slate-500 mt-0.5">{booking.listingAlamat}</p>
          </div>
        </div>
      </Card>

      {/* Detail Sewa */}
      <Card padding="md" className="mb-3">
        <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
          <CalendarDays size={14} className="text-amber-400" /> Detail Sewa
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Tipe Sewa',  value: labelTipe(booking.tipeKamar) },
            { label: 'Durasi',     value: `${booking.durasi} ${booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}` },
            { label: 'Check-in',  value: formatTanggal(booking.tanggalMulai)   },
            { label: 'Check-out', value: formatTanggal(booking.tanggalSelesai) },
          ].map((item, i) => (
            <div key={i} className="flex justify-between gap-4 text-xs">
              <span className="text-slate-400">{item.label}</span>
              <span className="font-medium text-slate-700 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Ringkasan Biaya */}
      <Card padding="md" className="mb-3 bg-amber-50 border border-amber-100">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">Ringkasan Biaya</h3>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>
              {formatRupiah(booking.hargaSatuan)} ×{' '}
              {booking.durasi}{' '}
              {booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}
            </span>
            <span>{formatRupiah(booking.hargaSatuan * booking.durasi)}</span>
          </div>
          <div className="border-t border-amber-200 pt-1.5 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span className="text-amber-500 text-sm">{formatRupiah(booking.totalHarga)}</span>
          </div>
        </div>
      </Card>

      {/* Info Pemilik */}
      <Card padding="md" className="mb-3">
        <h3 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-1.5">
          <Phone size={13} className="text-amber-400" /> Kontak Pemilik
        </h3>
        <p className="text-sm font-medium text-slate-800">{booking.pemilikNama}</p>
      </Card>

      {/* Catatan */}
      {booking.catatanPenyewa && (
        <Card padding="md" className="mb-3">
          <h3 className="font-semibold text-slate-700 text-sm mb-1">Catatan Saya</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{booking.catatanPenyewa}</p>
        </Card>
      )}

      {/* Alasan Batal */}
      {booking.status === 'dibatalkan' && booking.alasanBatal && (
        <Card padding="md" className="mb-4 bg-red-50 border border-red-100">
          <p className="text-xs font-semibold text-red-600 mb-1">Alasan Pembatalan</p>
          <p className="text-xs text-red-500">{booking.alasanBatal}</p>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {canBayar && (
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/payment/${booking.id}`)}>
            Bayar Sekarang
          </Button>
        )}

        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => navigate(`/booking/bukti/${booking.id}`)}
        >
          <FileText size={15} /> Lihat Bukti Booking
        </Button>

        {canBatal && (
          <Button variant="danger" size="lg" fullWidth onClick={() => setBatalModal(true)}>
            <XCircle size={16} /> Batalkan Booking
          </Button>
        )}
      </div>

      {/* Modal Batal */}
      <Modal isOpen={batalModal} onClose={() => setBatalModal(false)} title="Batalkan Booking">
        <p className="text-sm text-slate-600 mb-3">
          Kamu akan membatalkan booking <span className="font-semibold">{booking.listingNama}</span>.
        </p>
        <textarea
          value={alasanBatal}
          onChange={e => setAlasanBatal(e.target.value)}
          placeholder="Tuliskan alasan pembatalan..."
          rows={3}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
        />
        <div className="flex gap-3">
          <Button variant="ghost" size="md" fullWidth onClick={() => setBatalModal(false)}>
            Batal
          </Button>
          <Button variant="danger" size="md" fullWidth loading={processing} onClick={handleBatal}>
            Ya, Batalkan
          </Button>
        </div>
      </Modal>
    </main>
  )
})

DetailBookingPage.displayName = 'DetailBookingPage'
export default DetailBookingPage
