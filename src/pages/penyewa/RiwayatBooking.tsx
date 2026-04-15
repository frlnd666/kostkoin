import { memo, useEffect, useState } from 'react'
import { useNavigate }               from 'react-router-dom'
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Badge   from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { useAuthStore }          from '../../store/authStore'
import { getBookingsByPenyewa }  from '../../services/bookingService'
import { formatRupiah, formatTanggal } from '../../utils/format'
import type { Booking } from '../../types/booking'

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'success'|'warning'|'danger'|'default', label: string }> = {
    pending:   { variant: 'warning', label: 'Menunggu Bayar' },
    paid:      { variant: 'success', label: 'Lunas' },
    active:    { variant: 'success', label: 'Aktif' },
    done:      { variant: 'default', label: 'Selesai' },
    cancelled: { variant: 'danger',  label: 'Dibatalkan' },
  }
  return map[status] ?? { variant: 'default', label: status }
}

const statusIcon = (status: string) => {
  if (status === 'paid' || status === 'active' || status === 'done')
    return <CheckCircle size={16} className="text-green-500" />
  if (status === 'cancelled')
    return <XCircle size={16} className="text-red-500" />
  return <Clock size={16} className="text-yellow-500" />
}

const RiwayatBooking = memo(() => {
  const navigate            = useNavigate()
  const { user }            = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    getBookingsByPenyewa(user.uid)
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Riwayat Booking</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <Card padding="md" className="text-center py-12">
          <FileText size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada riwayat booking</p>
          <p className="text-slate-400 text-sm mb-4">Yuk cari dan pesan kost impianmu!</p>
          <button
            onClick={() => navigate('/listing')}
            className="bg-amber-400 text-slate-900 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-amber-500 transition-colors"
          >
            Cari Kost
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map(booking => {
            const { variant, label } = statusBadge(booking.status)
            return (
              <Card key={booking.id} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {statusIcon(booking.status)}
                      <h3 className="font-semibold text-slate-900 truncate">{booking.listingNama}</h3>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{booking.listingAlamat}</p>
                    <p className="text-xs text-slate-400">
                      {formatTanggal(booking.tanggalMulai)} – {formatTanggal(booking.tanggalSelesai)}
                      <span className="ml-1">({booking.durasi} bulan)</span>
                    </p>
                    <p className="text-amber-500 font-bold text-sm mt-1">
                      {formatRupiah(booking.totalHarga)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => navigate(`/payment/${booking.id}`)}
                        className="bg-amber-400 text-slate-900 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-500 transition-colors"
                      >
                        Bayar
                      </button>
                    )}
                    {(booking.status === 'paid' || booking.status === 'active' || booking.status === 'done') && (
                      <button
                        onClick={() => navigate(`/booking/${booking.id}/bukti`)}
                        className="bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200 transition-colors flex items-center gap-1"
                      >
                        <FileText size={12} /> Bukti
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
})

RiwayatBooking.displayName = 'RiwayatBooking'
export default RiwayatBooking
