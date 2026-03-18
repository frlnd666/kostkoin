import { memo, useEffect, useState } from 'react'
import { ClipboardList, MapPin, Calendar, Clock } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Badge   from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { useAuthStore }         from '../../store/authStore'
import { getBookingsByPemilik } from '../../services/bookingService'
import { formatRupiah }         from '../../utils/format'
import type { Booking }         from '../../types/booking'

const statusBadge = (status: string): { variant: 'success' | 'warning' | 'danger' | 'default', label: string } => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default', label: string }> = {
    pending:   { variant: 'warning', label: 'Menunggu Bayar' },
    paid:      { variant: 'success', label: 'Sudah Dibayar'  },
    confirmed: { variant: 'success', label: 'Dikonfirmasi'   },
    completed: { variant: 'default', label: 'Selesai'        },
    cancelled: { variant: 'danger',  label: 'Dibatalkan'     },
  }
  return map[status] ?? { variant: 'default', label: status }
}

const RiwayatBooking = memo(() => {
  const { user }                    = useAuthStore()
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user) return
    getBookingsByPemilik(user.uid)
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Riwayat Booking</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <Card padding="md" className="text-center py-12">
          <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada booking masuk</p>
          <p className="text-slate-400 text-sm">Booking akan muncul di sini setelah listing kamu aktif</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map(booking => {
            const { variant, label } = statusBadge(booking.status)
            return (
              <Card key={booking.id} padding="md">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{booking.listingNama}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                      <MapPin size={11} />
                      <span>{booking.listingAlamat}</span>
                    </div>
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar size={13} className="text-amber-400" />
                    <span>{booking.tanggalMulai}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={13} className="text-amber-400" />
                    <span>{booking.durasi} Bulan</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Penyewa</p>
                    <p className="text-sm font-medium text-slate-700">{booking.penyewaNama}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total Pembayaran</p>
                    <p className="text-base font-bold text-amber-500">{formatRupiah(booking.totalHarga)}</p>
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
