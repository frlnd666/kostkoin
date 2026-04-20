import { memo, useEffect, useState } from 'react'
import { useParams }                  from 'react-router-dom'
import { Phone, MessageCircle, CheckCircle, XCircle, CalendarDays, MapPin, User } from 'lucide-react'
import { useAuthStore }              from '../../store/authStore'
import {
  listenBookingById,
  konfirmasiCheckin,
  aktivasiBooking,
  selesaikanBooking,
  batalkanBooking,
  formatTanggal,
  labelStatus,
  colorStatus,
} from '../../services/bookingService'
import type { Booking }  from '../../types/booking'
import { formatRupiah }  from '../../utils/format'
import Spinner           from '../../components/ui/Spinner'
import Button            from '../../components/ui/Button'
import Card              from '../../components/ui/Card'
import Modal             from '../../components/ui/Modal'

const BookingMasukPage = memo(() => {
  const { id }                      = useParams<{ id: string }>()
  const { user }                    = useAuthStore()
  const [booking, setBooking]       = useState<Booking | null>(null)
  const [loading, setLoading]       = useState(true)
  const [processing, setProcessing] = useState(false)
  const [batalModal, setBatalModal] = useState(false)
  const [alasanBatal, setAlasanBatal] = useState('')
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!id) return
    const unsub = listenBookingById(id, data => {
      setBooking(data)
      setLoading(false)
    })
    return () => unsub()
  }, [id])

  const handleKonfirmasiCheckin = async () => {
    if (!booking) return
    setProcessing(true)
    setError('')
    try {
      await konfirmasiCheckin(booking.id, booking)
    } catch {
      setError('Gagal mengkonfirmasi check-in. Coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  const handleAktivasi = async () => {
    if (!booking) return
    setProcessing(true)
    setError('')
    try {
      await aktivasiBooking(booking.id, booking)
    } catch {
      setError('Gagal mengaktifkan booking. Coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  const handleSelesai = async () => {
    if (!booking) return
    setProcessing(true)
    setError('')
    try {
      await selesaikanBooking(booking.id, booking)
    } catch {
      setError('Gagal menyelesaikan booking. Coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  const handleBatal = async () => {
    if (!booking || !alasanBatal.trim()) return
    setProcessing(true)
    setError('')
    try {
      await batalkanBooking(booking.id, booking, alasanBatal.trim(), 'pemilik')
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
    </div>
  )

  // Cek apakah pemilik yang berhak
  if (booking.pemilikId !== user?.uid) return (
    <div className="text-center py-20 text-slate-400">
      <p>Kamu tidak punya akses ke booking ini.</p>
    </div>
  )

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Detail Booking</h1>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${colorStatus(booking.status)}`}>
          {labelStatus(booking.status)}
        </span>
        <span className="text-xs text-slate-400">#{booking.id.slice(0, 8).toUpperCase()}</span>
      </div>

      {/* Info Kost */}
      <Card padding="md" className="mb-3">
        <div className="flex items-start gap-2 mb-1">
          <MapPin size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{booking.listingNama}</p>
            <p className="text-xs text-slate-500 mt-0.5">{booking.listingAlamat}</p>
          </div>
        </div>
      </Card>

      {/* Info Penyewa */}
      <Card padding="md" className="mb-3">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">Info Penyewa</h3>
        <div className="flex flex-col gap-2">
          {[
            { icon: <User size={14} />,          label: 'Nama',   value: booking.penyewaNama  },
            { icon: <Phone size={14} />,         label: 'No. HP', value: booking.penyewaNoHp || '-' },
            { icon: <MessageCircle size={14} />, label: 'Email',  value: booking.penyewaEmail },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-amber-400 flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0 flex justify-between gap-2">
                <span className="text-xs text-slate-400 flex-shrink-0">{item.label}</span>
                <span className="text-xs font-medium text-slate-700 text-right truncate">{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tombol Kontak */}
        {booking.penyewaNoHp && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <a
              href={`tel:${booking.penyewaNoHp}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              <Phone size={13} /> Telepon
            </a>
            <a
              href={`https://wa.me/${booking.penyewaNoHp.replace(/^0/, '62')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 hover:bg-green-100 rounded-xl text-xs font-semibold text-green-600 transition-colors"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        )}
      </Card>

      {/* Detail Booking */}
      <Card padding="md" className="mb-3">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">Detail Booking</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Tipe Sewa',      value: booking.tipeKamar ?? '-'                   },
            { label: 'Durasi',         value: `${booking.durasi} ${booking.tipeKamar === 'harian' ? 'hari' : booking.tipeKamar === 'mingguan' ? 'minggu' : 'bulan'}` },
            { label: 'Check-in',       value: formatTanggal(booking.tanggalMulai)        },
            { label: 'Check-out',      value: formatTanggal(booking.tanggalSelesai)      },
            { label: 'Harga Satuan',   value: formatRupiah(booking.hargaSatuan)          },
            { label: 'Total',          value: formatRupiah(booking.totalHarga)           },
          ].map((item, i) => (
            <div key={i} className="flex justify-between gap-4 text-xs">
              <span className="text-slate-400 flex-shrink-0">{item.label}</span>
              <span className="font-medium text-slate-700 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Catatan Penyewa */}
      {booking.catatanPenyewa && (
        <Card padding="md" className="mb-3">
          <h3 className="font-semibold text-slate-700 text-sm mb-1">Catatan Penyewa</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{booking.catatanPenyewa}</p>
        </Card>
      )}

      {/* Bukti Pembayaran */}
      {booking.pembayaran && (
        <Card padding="md" className="mb-3">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Pembayaran</h3>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Metode</span>
              <span className="font-medium text-slate-700 capitalize">{booking.pembayaran.metode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Order ID</span>
              <span className="font-medium text-slate-700">{booking.pembayaran.orderId}</span>
            </div>
            {booking.pembayaran.transactionId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID</span>
                <span className="font-medium text-slate-700">{booking.pembayaran.transactionId}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Alasan Batal */}
      {booking.status === 'dibatalkan' && booking.alasanBatal && (
        <Card padding="md" className="mb-4 bg-red-50 border border-red-100">
          <p className="text-xs font-semibold text-red-600 mb-1">Alasan Pembatalan</p>
          <p className="text-xs text-red-500">{booking.alasanBatal}</p>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Konfirmasi check-in setelah dibayar */}
        {booking.status === 'sudah_dibayar' && (
          <Button variant="primary" size="lg" fullWidth loading={processing} onClick={handleKonfirmasiCheckin}>
            <CheckCircle size={16} /> Konfirmasi Check-in
          </Button>
        )}

        {/* Aktifkan setelah dikonfirmasi */}
        {booking.status === 'dikonfirmasi' && (
          <Button variant="primary" size="lg" fullWidth loading={processing} onClick={handleAktivasi}>
            <CheckCircle size={16} /> Aktifkan Booking
          </Button>
        )}

        {/* Selesaikan saat aktif */}
        {booking.status === 'aktif' && (
          <Button variant="secondary" size="lg" fullWidth loading={processing} onClick={handleSelesai}>
            Selesaikan (Checkout)
          </Button>
        )}

        {/* Batal jika belum aktif/selesai/dibatalkan/hangus */}
        {['menunggu_pembayaran', 'sudah_dibayar', 'dikonfirmasi'].includes(booking.status) && (
          <Button variant="danger" size="lg" fullWidth onClick={() => setBatalModal(true)}>
            <XCircle size={16} /> Batalkan Booking
          </Button>
        )}
      </div>

      {/* Modal Batal */}
      <Modal isOpen={batalModal} onClose={() => setBatalModal(false)} title="Batalkan Booking">
        <p className="text-sm text-slate-600 mb-3">
          Kamu akan membatalkan booking <span className="font-semibold">{booking.listingNama}</span> milik{' '}
          <span className="font-semibold">{booking.penyewaNama}</span>.
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
          <Button
            variant="danger"
            size="md"
            fullWidth
            loading={processing}
            onClick={handleBatal}
          >
            Ya, Batalkan
          </Button>
        </div>
      </Modal>
    </main>
  )
})

BookingMasukPage.displayName = 'BookingMasukPage'
export default BookingMasukPage
