import { memo, useEffect, useState } from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { ArrowLeft, AlertCircle }    from 'lucide-react'
import {
  listenBookingById,
  batalkanBooking,
  labelStatus, colorStatus,
  labelTipe, satuanTipe,
  formatTanggal, formatTanggalPendek,
} from '../../services/bookingService'
import { formatRupiah }   from '../../utils/format'
import { useAuthStore }   from '../../store/authStore'
import type { Booking }   from '../../types/booking'
import Spinner            from '../../components/ui/Spinner'
import Button             from '../../components/ui/Button'

const DetailBookingPage = memo(() => {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()

  const [booking, setBooking]       = useState<Booking | null>(null)
  const [loading, setLoading]       = useState(true)
  const [batalModal, setBatalModal] = useState(false)
  const [alasan, setAlasan]         = useState('')
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
    if (!booking || !user) return
    setProcessing(true)
    setError('')
    try {
      await batalkanBooking(booking.id, booking, alasan || 'Dibatalkan oleh penyewa', 'penyewa')
      setBatalModal(false)
      navigate('/riwayat')
    } catch {
      setError('Gagal membatalkan booking. Coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  const bolehBatal = booking?.status === 'menunggu_pembayaran' || booking?.status === 'sudah_dibayar'

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!booking) return (
    <div className="text-center py-20 text-slate-400">
      <p className="mb-3">Booking tidak ditemukan</p>
      <Button variant="ghost" onClick={() => navigate('/riwayat')}>Kembali</Button>
    </div>
  )

  return (
    <main className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/riwayat')}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">Detail Booking</h1>
          <p className="text-xs text-slate-400 truncate max-w-[240px]">{booking.listingNama}</p>
        </div>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border mb-4 ${colorStatus(booking.status).replace('text-', 'border-').replace('bg-', 'bg-')}`}>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${colorStatus(booking.status)}`}>
          {labelStatus(booking.status)}
        </span>
      </div>

      {/* Info Kost */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Kost</p>
        <p className="font-bold text-slate-900">{booking.listingNama}</p>
        <p className="text-sm text-slate-500 mt-0.5">{booking.listingAlamat}</p>
        <p className="text-xs text-slate-400 mt-1">Pemilik: {booking.pemilikNama}</p>
      </div>

      {/* Detail Sewa */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Detail Sewa</p>
        <div className="space-y-2.5">
          {[
            { label: 'Tipe Sewa',   value: labelTipe(booking.tipeKamar) },
            { label: 'Durasi',      value: `${booking.durasi} ${satuanTipe(booking.tipeKamar)}` },
            { label: 'Check-in',    value: formatTanggal(booking.tanggalMulai) },
            { label: 'Check-out',   value: formatTanggal(booking.tanggalSelesai) },
            { label: 'Harga/Satuan',value: formatRupiah(booking.hargaSatuan) },
            { label: 'Total Bayar', value: formatRupiah(booking.totalHarga), bold: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{row.label}</span>
              <span className={row.bold ? 'font-extrabold text-amber-500' : 'font-medium text-slate-700'}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Catatan penyewa */}
      {booking.catatanPenyewa && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Catatan</p>
          <p className="text-sm text-slate-600 leading-relaxed">{booking.catatanPenyewa}</p>
        </div>
      )}

      {/* Alasan batal */}
      {booking.alasanBatal && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-3">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Alasan Pembatalan</p>
          <p className="text-sm text-red-600">{booking.alasanBatal}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Aksi */}
      <div className="flex flex-col gap-3 mt-2">
        {booking.status === 'menunggu_pembayaran' && (
          <Button variant="primary" size="lg" fullWidth
            onClick={() => navigate(`/payment/${booking.id}`)}>
            Bayar Sekarang
          </Button>
        )}
        {bolehBatal && (
          <Button variant="ghost" size="lg" fullWidth
            onClick={() => setBatalModal(true)}
            className="text-red-500 hover:bg-red-50 border-red-100">
            Batalkan Booking
          </Button>
        )}
      </div>

      {/* Modal Konfirmasi Batal */}
      {batalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-xl">
            <h3 className="font-bold text-slate-900 mb-1">Batalkan Booking?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Tindakan ini tidak dapat dibatalkan. Dana yang sudah dibayar akan diproses refund sesuai kebijakan.
            </p>
            <textarea
              value={alasan}
              onChange={e => setAlasan(e.target.value)}
              placeholder="Alasan pembatalan (opsional)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 mb-4 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setBatalModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleBatal}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-bold transition-colors"
              >
                {processing ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
})

DetailBookingPage.displayName = 'DetailBookingPage'
export default DetailBookingPage
