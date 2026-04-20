import { memo, useEffect, useState }        from 'react'
import { useNavigate }                      from 'react-router-dom'
import { CalendarDays, ChevronRight, Home } from 'lucide-react'
import { useAuthStore }                     from '../../store/authStore'
import {
  listenBookingsByPemilik,
  labelStatus, colorStatus,
  formatTanggalPendek,
} from '../../services/bookingService'
import type { Booking, BookingStatus } from '../../types/booking'
import { formatRupiah }               from '../../utils/format'

const STATUS_TABS: { label: string; value: BookingStatus | 'semua' }[] = [
  { label: 'Semua',    value: 'semua'               },
  { label: 'Baru',     value: 'menunggu_pembayaran' },
  { label: 'Dibayar',  value: 'sudah_dibayar'       },
  { label: 'Aktif',    value: 'aktif'               },
  { label: 'Selesai',  value: 'selesai'             },
]

const RiwayatBookingPemilik = memo(() => {
  const navigate               = useNavigate()
  const { user }               = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState<BookingStatus | 'semua'>('semua')

  useEffect(() => {
    if (!user?.uid) return
    const unsub = listenBookingsByPemilik(user.uid, data => {
      setBookings(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  const filtered = tab === 'semua'
    ? bookings
    : bookings.filter(b => b.status === tab)

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Riwayat Booking Masuk</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              tab === t.value
                ? 'bg-amber-400 border-amber-400 text-slate-900'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <Home size={24} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-500 text-sm">Belum ada booking masuk</p>
          <p className="text-xs text-slate-300 mt-1">Booking penyewa akan muncul di sini</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(b => (
            <button
              key={b.id}
              onClick={() => navigate(`/booking/detail/${b.id}`)}
              className="w-full text-left bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate mb-0.5">{b.listingNama}</p>
                <p className="text-xs text-blue-500 font-medium mb-2">{b.penyewaNama}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <CalendarDays size={11} />
                  <span>{formatTanggalPendek(b.tanggalMulai)}</span>
                  <span className="text-slate-300">→</span>
                  <span>{formatTanggalPendek(b.tanggalSelesai)}</span>
                </div>
                <p className="text-xs font-semibold text-amber-500">{formatRupiah(b.totalHarga)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${colorStatus(b.status)}`}>
                  {labelStatus(b.status)}
                </span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
})

RiwayatBookingPemilik.displayName = 'RiwayatBookingPemilik'
export default RiwayatBookingPemilik
