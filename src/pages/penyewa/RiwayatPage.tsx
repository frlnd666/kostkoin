import { memo, useEffect, useState } from 'react'
import { useNavigate }               from 'react-router-dom'
import { FileText, ChevronRight, Search, Filter } from 'lucide-react'
import { useAuthStore }       from '../../store/authStore'
import {
  listenBookingsByPenyewa,
  labelStatus, colorStatus,
  labelTipe, satuanTipe,
  formatTanggalPendek,
} from '../../services/bookingService'
import { formatRupiah }       from '../../utils/format'
import type { Booking, BookingStatus } from '../../types/booking'

// ── Filter tabs ───────────────────────────────────────────────
const TABS: { label: string; status: BookingStatus | 'semua' }[] = [
  { label: 'Semua',     status: 'semua' },
  { label: 'Aktif',     status: 'aktif' },
  { label: 'Menunggu',  status: 'menunggu_pembayaran' },
  { label: 'Selesai',   status: 'selesai' },
  { label: 'Dibatalkan',status: 'dibatalkan' },
]

// ── Skeleton ──────────────────────────────────────────────────
const BookingSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="h-px bg-slate-100 mb-3" />
    <div className="grid grid-cols-3 gap-2">
      {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-lg" />)}
    </div>
  </div>
)

// ── Booking Card ──────────────────────────────────────────────
const BookingCard = memo(({ booking, onClick }: {
  booking: Booking
  onClick: () => void
}) => {
  const isAktif    = booking.status === 'aktif' || booking.status === 'dikonfirmasi'
  const isBayar    = booking.status === 'menunggu_pembayaran'
  const isSelesai  = booking.status === 'selesai'
  const isBatal    = booking.status === 'dibatalkan' || booking.status === 'hangus'

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left group"
    >
      {/* Baris atas */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm leading-snug truncate group-hover:text-amber-600 transition-colors">
            {booking.listingNama}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{booking.listingAlamat}</p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${colorStatus(booking.status)}`}>
          {labelStatus(booking.status)}
        </span>
      </div>

      <div className="h-px bg-slate-100 mb-3" />

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-slate-50 rounded-xl px-2 py-2">
          <p className="text-[10px] text-slate-400 mb-0.5">Tipe</p>
          <p className="text-xs font-bold text-slate-700">{labelTipe(booking.tipeKamar)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl px-2 py-2">
          <p className="text-[10px] text-slate-400 mb-0.5">Durasi</p>
          <p className="text-xs font-bold text-slate-700">{booking.durasi} {satuanTipe(booking.tipeKamar)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl px-2 py-2">
          <p className="text-[10px] text-slate-400 mb-0.5">Check-in</p>
          <p className="text-xs font-bold text-slate-700">{formatTanggalPendek(booking.tanggalMulai)}</p>
        </div>
      </div>

      {/* Total + aksi */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400">Total Bayar</p>
          <p className="text-sm font-extrabold text-amber-500">{formatRupiah(booking.totalHarga)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {isBayar && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              Segera Bayar
            </span>
          )}
          {isAktif && (
            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              Sedang Berjalan
            </span>
          )}
          <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
        </div>
      </div>
    </button>
  )
})
BookingCard.displayName = 'BookingCard'

// ─────────────────────────────────────────────────────────────
const RiwayatPage = memo(() => {
  const navigate             = useNavigate()
  const { user }             = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [tabAktif, setTab]      = useState<BookingStatus | 'semua'>('semua')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!user?.uid) return
    const unsub = listenBookingsByPenyewa(user.uid, data => {
      setBookings(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  // Filter
  const filtered = bookings.filter(b => {
    const matchTab    = tabAktif === 'semua' || b.status === tabAktif
    const matchSearch = search === '' ||
      b.listingNama.toLowerCase().includes(search.toLowerCase()) ||
      b.listingAlamat.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  // Hitung per tab
  const countTab = (status: BookingStatus | 'semua') =>
    status === 'semua'
      ? bookings.length
      : bookings.filter(b => b.status === status).length

  return (
    <main className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900">Riwayat Booking</h1>
        <p className="text-xs text-slate-400 mt-0.5">Semua booking kost kamu</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          placeholder="Cari nama kost atau alamat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TABS.map(tab => {
          const count  = countTab(tab.status)
          const active = tabAktif === tab.status
          return (
            <button
              key={tab.status}
              onClick={() => setTab(tab.status)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? 'bg-amber-400 border-amber-400 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-amber-500/30 text-amber-900' : 'bg-slate-100 text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1,2,3].map(i => <BookingSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <FileText size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500 text-sm">
              {search ? 'Tidak ada hasil' : 'Belum ada booking'}
            </p>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              {search
                ? `Tidak ditemukan booking untuk "${search}"`
                : tabAktif === 'semua'
                  ? 'Yuk cari kost impianmu sekarang!'
                  : `Tidak ada booking dengan status "${labelStatus(tabAktif as BookingStatus)}"`
              }
            </p>
            {!search && tabAktif === 'semua' && (
              <button
                onClick={() => navigate('/listing')}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-bold rounded-xl transition-colors"
              >
                Cari Kost
              </button>
            )}
          </div>
        ) : (
          filtered.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => {
                // Kalau masih menunggu bayar → ke payment
                if (booking.status === 'menunggu_pembayaran') {
                  navigate(`/payment/${booking.id}`)
                } else {
                  navigate(`/booking/detail/${booking.id}`)
                }
              }}
            />
          ))
        )}
      </div>

    </main>
  )
})

RiwayatPage.displayName = 'RiwayatPage'
export default RiwayatPage
