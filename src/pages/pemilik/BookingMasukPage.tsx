import { memo, useEffect, useState } from 'react'
import { useNavigate }               from 'react-router-dom'
import {
  CheckCircle2, XCircle, Clock, ChevronRight,
  Search, User, CalendarDays, AlertCircle
} from 'lucide-react'
import { useAuthStore }        from '../../store/authStore'
import {
  listenBookingsByPemilik,
  konfirmasiCheckin,
  batalkanBooking,
  labelStatus, colorStatus,
  labelTipe, satuanTipe,
  formatTanggalPendek,
} from '../../services/bookingService'
import { formatRupiah }        from '../../utils/format'
import type { Booking, BookingStatus } from '../../types/booking'
import Spinner                 from '../../components/ui/Spinner'

// ── Filter tabs ───────────────────────────────────────────────
const TABS: { label: string; status: BookingStatus | 'semua' }[] = [
  { label: 'Semua',       status: 'semua' },
  { label: 'Perlu Aksi',  status: 'sudah_dibayar' },
  { label: 'Aktif',       status: 'aktif' },
  { label: 'Menunggu',    status: 'menunggu_pembayaran' },
  { label: 'Selesai',     status: 'selesai' },
  { label: 'Dibatalkan',  status: 'dibatalkan' },
]

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="space-y-1">
          <div className="h-3.5 w-28 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="h-px bg-slate-100 my-3" />
    <div className="grid grid-cols-3 gap-2">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
    </div>
  </div>
)

// ── Avatar Inisial ────────────────────────────────────────────
const Avatar = ({ nama }: { nama: string }) => {
  const inisial = nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
      {inisial}
    </div>
  )
}

// ── Booking Card Pemilik ──────────────────────────────────────
const BookingCard = memo(({ booking, onDetail }: {
  booking: Booking
  onDetail: () => void
}) => {
  const perluAksi = booking.status === 'sudah_dibayar'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all ${
      perluAksi ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-100'
    }`}>
      {perluAksi && (
        <div className="bg-amber-400 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-t-2xl flex items-center gap-1.5">
          <AlertCircle size={10} /> Perlu konfirmasi check-in
        </div>
      )}

      <div className="p-4">
        {/* Penyewa info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar nama={booking.penyewaNama} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{booking.penyewaNama}</p>
              <p className="text-xs text-slate-400 truncate">{booking.penyewaEmail}</p>
            </div>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ml-2 ${colorStatus(booking.status)}`}>
            {labelStatus(booking.status)}
          </span>
        </div>

        <div className="h-px bg-slate-100 mb-3" />

        {/* Listing nama */}
        <p className="text-xs font-semibold text-slate-600 mb-2 truncate">
          🏠 {booking.listingNama}
        </p>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Tipe</p>
            <p className="text-xs font-bold text-slate-700">{labelTipe(booking.tipeKamar)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Durasi</p>
            <p className="text-xs font-bold text-slate-700">{booking.durasi} {satuanTipe(booking.tipeKamar)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Check-in</p>
            <p className="text-xs font-bold text-slate-700">{formatTanggalPendek(booking.tanggalMulai)}</p>
          </div>
        </div>

        {/* Total + tombol detail */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400">Total</p>
            <p className="text-sm font-extrabold text-amber-500">{formatRupiah(booking.totalHarga)}</p>
          </div>
          <button
            onClick={onDetail}
            className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
          >
            Detail <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
})
BookingCard.displayName = 'BookingCard'

// ── Modal Detail + Aksi ───────────────────────────────────────
const BookingDetailModal = memo(({ booking, onClose, onKonfirmasi, onTolak }: {
  booking: Booking
  onClose:     () => void
  onKonfirmasi: () => void
  onTolak:     (alasan: string) => void
}) => {
  const [tolakMode, setTolakMode] = useState(false)
  const [alasan, setAlasan]       = useState('')
  const [loading, setLoading]     = useState(false)

  const handleKonfirmasi = async () => {
    setLoading(true)
    await onKonfirmasi()
    setLoading(false)
  }

  const handleTolak = async () => {
    setLoading(true)
    await onTolak(alasan || 'Ditolak oleh pemilik')
    setLoading(false)
  }

  const bolehKonfirmasi = booking.status === 'sudah_dibayar'
  const bolehTolak      = booking.status === 'sudah_dibayar' || booking.status === 'menunggu_pembayaran'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden">

        {/* Header modal */}
        <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Detail Booking</h3>
            <p className="text-xs text-slate-400 mt-0.5">{booking.listingNama}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 text-sm transition-colors">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">

          {/* Penyewa */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
            <Avatar nama={booking.penyewaNama} />
            <div>
              <p className="font-bold text-slate-900 text-sm">{booking.penyewaNama}</p>
              <p className="text-xs text-slate-400">{booking.penyewaEmail}</p>
              {booking.penyewaNoHp && (
                <p className="text-xs text-slate-400">{booking.penyewaNoHp}</p>
              )}
            </div>
          </div>

          {/* Info sewa */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3.5 space-y-2">
            {[
              { label: 'Tipe Sewa',    value: labelTipe(booking.tipeKamar) },
              { label: 'Check-in',     value: formatTanggalPendek(booking.tanggalMulai) },
              { label: 'Check-out',    value: formatTanggalPendek(booking.tanggalSelesai) },
              { label: 'Durasi',       value: `${booking.durasi} ${satuanTipe(booking.tipeKamar)}` },
              { label: 'Harga/Satuan', value: formatRupiah(booking.hargaSatuan) },
              { label: 'Total',        value: formatRupiah(booking.totalHarga), bold: true },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className={row.bold
                  ? 'font-extrabold text-amber-500'
                  : 'font-medium text-slate-700'}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Catatan penyewa */}
          {booking.catatanPenyewa && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
                Catatan Penyewa
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{booking.catatanPenyewa}</p>
            </div>
          )}

          {/* Mode tolak */}
          {tolakMode && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
              <p className="text-xs font-semibold text-red-500 mb-2">Alasan Penolakan</p>
              <textarea
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                placeholder="Misal: Kamar sudah terisi, tanggal tidak tersedia..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs text-slate-700 resize-none focus:outline-none focus:border-red-400 transition-all"
              />
            </div>
          )}

          {/* Tombol aksi */}
          {!tolakMode ? (
            <div className="flex gap-2 pt-1">
              {bolehTolak && (
                <button
                  onClick={() => setTolakMode(true)}
                  className="flex-1 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={15} /> Tolak
                </button>
              )}
              {bolehKonfirmasi && (
                <button
                  onClick={handleKonfirmasi}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle2 size={15} /> Konfirmasi Check-in</>
                  }
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setTolakMode(false); setAlasan('') }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleTolak}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-bold transition-colors"
              >
                {loading ? 'Memproses...' : 'Ya, Tolak Booking'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
})
BookingDetailModal.displayName = 'BookingDetailModal'

// ─────────────────────────────────────────────────────────────
const BookingMasukPage = memo(() => {
  const navigate             = useNavigate()
  const { user }             = useAuthStore()
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)
  const [tabAktif, setTab]          = useState<BookingStatus | 'semua'>('semua')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Booking | null>(null)
  const [actionError, setActErr]    = useState('')

  useEffect(() => {
    if (!user?.uid) return
    const unsub = listenBookingsByPemilik(user.uid, data => {
      setBookings(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  // Filter
  const filtered = bookings.filter(b => {
    const matchTab    = tabAktif === 'semua' || b.status === tabAktif
    const matchSearch = search === '' ||
      b.penyewaNama.toLowerCase().includes(search.toLowerCase()) ||
      b.listingNama.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const countTab = (status: BookingStatus | 'semua') =>
    status === 'semua'
      ? bookings.length
      : bookings.filter(b => b.status === status).length

  // Highlight: jumlah yang perlu aksi
  const perluAksiCount = bookings.filter(b => b.status === 'sudah_dibayar').length

  const handleKonfirmasi = async () => {
    if (!selected) return
    try {
      await konfirmasiCheckin(selected.id, selected)
      setSelected(null)
    } catch {
      setActErr('Gagal mengkonfirmasi. Coba lagi.')
    }
  }

  const handleTolak = async (alasan: string) => {
    if (!selected || !user) return
    try {
      await batalkanBooking(selected.id, selected, alasan, 'pemilik')
      setSelected(null)
    } catch {
      setActErr('Gagal menolak booking. Coba lagi.')
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Booking Masuk</h1>
          <p className="text-xs text-slate-400 mt-0.5">Kelola booking penyewa kamu</p>
        </div>
        {perluAksiCount > 0 && (
          <div className="bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">
            {perluAksiCount} perlu dikonfirmasi
          </div>
        )}
      </div>

      {/* Error aksi */}
      {actionError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
          <AlertCircle size={15} className="flex-shrink-0" /> {actionError}
          <button onClick={() => setActErr('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          placeholder="Cari nama penyewa atau kost..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TABS.map(tab => {
          const count  = countTab(tab.status)
          const active = tabAktif === tab.status
          const isPerluAksi = tab.status === 'sudah_dibayar' && count > 0
          return (
            <button
              key={tab.status}
              onClick={() => setTab(tab.status)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? 'bg-amber-400 border-amber-400 text-slate-900'
                  : isPerluAksi
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-amber-500/30 text-amber-900'
                  : isPerluAksi ? 'bg-amber-200 text-amber-800'
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Daftar */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <User size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500 text-sm">
              {search ? 'Tidak ada hasil' : 'Belum ada booking'}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              {search
                ? `Tidak ditemukan untuk "${search}"`
                : 'Booking dari penyewa akan muncul di sini'
              }
            </p>
          </div>
        ) : (
          filtered.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onDetail={() => { setSelected(booking); setActErr('') }}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onKonfirmasi={handleKonfirmasi}
          onTolak={handleTolak}
        />
      )}

    </main>
  )
})

BookingMasukPage.displayName = 'BookingMasukPage'
export default BookingMasukPage
