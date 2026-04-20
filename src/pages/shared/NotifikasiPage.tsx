import { memo, useEffect, useState, useMemo } from 'react'
import { useNavigate }                         from 'react-router-dom'
import {
  BellOff, Trash2, CheckCheck,
  ChevronRight, RefreshCw
} from 'lucide-react'
import { useAuthStore }           from '../store/authStore'
import {
  listenNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  type Notifikasi, type NotifType,
} from '../services/notificationService'

// ─────────────────────────────────────────────────────────────
// CONFIG: ikon & warna per tipe notif
// ─────────────────────────────────────────────────────────────
const notifConfig = (type: NotifType): { icon: string; bg: string; dot: string } => {
  const map: Partial<Record<NotifType, { icon: string; bg: string; dot: string }>> = {
    // Booking
    booking_dibuat:           { icon: '🎉', bg: 'bg-amber-50',   dot: 'bg-amber-400'  },
    booking_masuk:            { icon: '🔔', bg: 'bg-amber-50',   dot: 'bg-amber-400'  },
    booking_dibatalkan:       { icon: '❌', bg: 'bg-red-50',     dot: 'bg-red-400'    },
    booking_batal_konfirmasi: { icon: '✅', bg: 'bg-slate-50',   dot: 'bg-slate-400'  },
    booking_aktif:            { icon: '🏠', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    booking_selesai:          { icon: '🌟', bg: 'bg-indigo-50',  dot: 'bg-indigo-400' },
    booking_hangus:           { icon: '⏰', bg: 'bg-orange-50',  dot: 'bg-orange-400' },
    // Pembayaran
    pembayaran_lunas:         { icon: '✅', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    pembayaran_masuk:         { icon: '💰', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    refund_diproses:          { icon: '🔄', bg: 'bg-blue-50',    dot: 'bg-blue-400'   },
    // Check-in
    pengingat_checkin:        { icon: '⏰', bg: 'bg-amber-50',   dot: 'bg-amber-400'  },
    checkin_dikonfirmasi:     { icon: '🏠', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    pengingat_checkout:       { icon: '📅', bg: 'bg-blue-50',    dot: 'bg-blue-400'   },
    checkout_penyewa:         { icon: '📦', bg: 'bg-slate-50',   dot: 'bg-slate-400'  },
    penyewa_checkin:          { icon: '👤', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    penyewa_tidak_datang:     { icon: '⚠️', bg: 'bg-orange-50',  dot: 'bg-orange-400' },
    masa_sewa_hampir_habis:   { icon: '⏳', bg: 'bg-amber-50',   dot: 'bg-amber-400'  },
    // Dana
    dana_cair:                { icon: '💰', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    dana_hangus_masuk:        { icon: '💸', bg: 'bg-orange-50',  dot: 'bg-orange-400' },
    withdraw_disetujui:       { icon: '✅', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    withdraw_ditolak:         { icon: '❌', bg: 'bg-red-50',     dot: 'bg-red-400'    },
    // Listing
    listing_disetujui:        { icon: '✅', bg: 'bg-green-50',   dot: 'bg-green-400'  },
    listing_ditolak:          { icon: '❌', bg: 'bg-red-50',     dot: 'bg-red-400'    },
    listing_baru:             { icon: '📋', bg: 'bg-blue-50',    dot: 'bg-blue-400'   },
    // Admin
    withdraw_baru:            { icon: '💳', bg: 'bg-blue-50',    dot: 'bg-blue-400'   },
    dispute_masuk:            { icon: '⚠️', bg: 'bg-red-50',     dot: 'bg-red-400'    },
    pemilik_baru:             { icon: '👤', bg: 'bg-indigo-50',  dot: 'bg-indigo-400' },
    // Umum
    promo:                    { icon: '🎁', bg: 'bg-amber-50',   dot: 'bg-amber-400'  },
    sistem:                   { icon: 'ℹ️', bg: 'bg-slate-50',   dot: 'bg-slate-400'  },
  }
  return map[type] ?? { icon: '🔔', bg: 'bg-slate-50', dot: 'bg-slate-400' }
}

// ─────────────────────────────────────────────────────────────
// HELPER: navigasi berdasarkan screen di data
// ─────────────────────────────────────────────────────────────
const resolveNavigation = (notif: Notifikasi): string | null => {
  const screen    = notif.data?.screen
  const bookingId = notif.data?.bookingId
  const listingId = notif.data?.listingId

  const map: Record<string, string> = {
    payment:        bookingId ? `/payment/${bookingId}`        : '/riwayat',
    detail_booking: bookingId ? `/booking/detail/${bookingId}` : '/riwayat',
    riwayat:        '/riwayat',
    booking_masuk:  '/pemilik/booking',
    wallet:         '/pemilik/wallet',
    listing_detail: listingId ? `/listing/${listingId}`        : '/listing',
    admin_listing:  '/admin/listing',
    admin_withdraw: '/admin/withdraw',
    admin_dispute:  '/admin/dispute',
    admin_user:     '/admin/users',
    review:         bookingId ? `/booking/detail/${bookingId}` : '/riwayat',
    promo:          '/promo',
    home:           '/',
  }
  return screen ? (map[screen] ?? null) : null
}

// ─────────────────────────────────────────────────────────────
// HELPER: format waktu relatif
// ─────────────────────────────────────────────────────────────
const formatWaktuRelatif = (date: Date): string => {
  const diff  = Date.now() - date.getTime()
  const menit = Math.floor(diff / 60000)
  const jam   = Math.floor(diff / 3600000)
  const hari  = Math.floor(diff / 86400000)

  if (menit < 1)  return 'Baru saja'
  if (menit < 60) return `${menit} menit lalu`
  if (jam   < 24) return `${jam} jam lalu`
  if (hari  < 7)  return `${hari} hari lalu`
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────
type FilterTab = 'semua' | 'belum_dibaca' | 'booking' | 'pembayaran' | 'lainnya'

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'Semua',       value: 'semua'        },
  { label: 'Belum Dibaca',value: 'belum_dibaca' },
  { label: 'Booking',     value: 'booking'      },
  { label: 'Pembayaran',  value: 'pembayaran'   },
  { label: 'Lainnya',     value: 'lainnya'      },
]

const BOOKING_TYPES  = new Set<NotifType>([
  'booking_dibuat','booking_masuk','booking_dibatalkan',
  'booking_batal_konfirmasi','booking_aktif','booking_selesai',
  'booking_hangus','pengingat_checkin','checkin_dikonfirmasi',
  'pengingat_checkout','checkout_penyewa','penyewa_checkin',
  'penyewa_tidak_datang','masa_sewa_hampir_habis',
])
const PEMBAYARAN_TYPES = new Set<NotifType>([
  'pembayaran_lunas','pembayaran_masuk','refund_diproses',
  'dana_cair','dana_hangus_masuk','withdraw_disetujui','withdraw_ditolak',
])

const filterNotifs = (notifs: Notifikasi[], tab: FilterTab) => {
  if (tab === 'semua')        return notifs
  if (tab === 'belum_dibaca') return notifs.filter(n => !n.isRead)
  if (tab === 'booking')      return notifs.filter(n => BOOKING_TYPES.has(n.type))
  if (tab === 'pembayaran')   return notifs.filter(n => PEMBAYARAN_TYPES.has(n.type))
  return notifs.filter(n => !BOOKING_TYPES.has(n.type) && !PEMBAYARAN_TYPES.has(n.type))
}

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
const NotifSkeleton = () => (
  <div className="flex gap-3 px-4 py-3.5 animate-pulse">
    <div className="w-10 h-10 rounded-2xl bg-slate-200 flex-shrink-0" />
    <div className="flex-1 space-y-2 pt-0.5">
      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
      <div className="h-2.5 bg-slate-100 rounded w-1/4 mt-1" />
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// NOTIF ITEM
// ─────────────────────────────────────────────────────────────
const NotifItem = memo(({ notif, onRead, onDelete, onClick }: {
  notif:    Notifikasi
  onRead:   () => void
  onDelete: () => void
  onClick:  () => void
}) => {
  const cfg        = notifConfig(notif.type)
  const hasLink    = !!resolveNavigation(notif)

  return (
    <div className={`relative flex gap-3 px-4 py-3.5 transition-colors group ${
      notif.isRead ? 'bg-white' : 'bg-amber-50/60'
    } hover:bg-slate-50 border-b border-slate-100 last:border-0`}>

      {/* Dot belum dibaca */}
      {!notif.isRead && (
        <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      )}

      {/* Ikon */}
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${cfg.bg} transition-transform hover:scale-105`}
      >
        {cfg.icon}
      </button>

      {/* Konten */}
      <button onClick={onClick} className="flex-1 text-left min-w-0">
        <p className={`text-sm leading-snug mb-0.5 ${
          notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
        }`}>
          {notif.title}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {notif.body}
        </p>
        <p className="text-[10px] text-slate-300 mt-1.5 font-medium">
          {formatWaktuRelatif(notif.createdAt)}
        </p>
      </button>

      {/* Aksi kanan */}
      <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
        {hasLink && (
          <ChevronRight
            size={14}
            className="text-slate-200 group-hover:text-amber-400 transition-colors mt-1"
          />
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notif.isRead && (
            <button
              onClick={e => { e.stopPropagation(); onRead() }}
              title="Tandai sudah dibaca"
              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-400 transition-colors"
            >
              <CheckCheck size={13} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            title="Hapus notifikasi"
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
})
NotifItem.displayName = 'NotifItem'

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const NotifikasiPage = memo(() => {
  const navigate            = useNavigate()
  const { user }            = useAuthStore()
  const [notifs, setNotifs] = useState<Notifikasi[]>([])
  const [loading, setLoad]  = useState(true)
  const [tab, setTab]       = useState<FilterTab>('semua')
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = listenNotifications(user.uid, data => {
      setNotifs(data)
      setLoad(false)
    })
    return () => unsub()
  }, [user?.uid])

  const filtered   = useMemo(() => filterNotifs(notifs, tab), [notifs, tab])
  const unreadCount = useMemo(() => notifs.filter(n => !n.isRead).length, [notifs])

  const handleRead   = (id: string) => markAsRead(id)
  const handleDelete = (id: string) => deleteNotification(id)

  const handleClickNotif = async (notif: Notifikasi) => {
    if (!notif.isRead) await markAsRead(notif.id)
    const path = resolveNavigation(notif)
    if (path) navigate(path)
  }

  const handleMarkAllRead = async () => {
    if (!user?.uid) return
    await markAllAsRead(user.uid)
  }

  const handleBersihkan = async () => {
    if (!user?.uid) return
    setCleaning(true)
    await deleteReadNotifications(user.uid)
    setCleaning(false)
  }

  const countTab = (t: FilterTab) => filterNotifs(notifs, t).length

  return (
    <main className="max-w-lg mx-auto">

      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-4">

        {/* Judul + aksi */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">Notifikasi</h1>
            {unreadCount > 0 && (
              <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <CheckCheck size={13} />
                Baca Semua
              </button>
            )}
            <button
              onClick={handleBersihkan}
              disabled={cleaning}
              title="Hapus notif yang sudah dibaca"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors disabled:opacity-50"
            >
              {cleaning
                ? <RefreshCw size={13} className="animate-spin" />
                : <Trash2 size={13} />
              }
              Bersihkan
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {TABS.map(t => {
            const count  = countTab(t.value)
            const active = tab === t.value
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-amber-400 border-amber-400 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {t.label}
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
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mx-4 my-4">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1,2,3,4,5].map(i => <NotifSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <BellOff size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500 text-sm">
              {tab === 'belum_dibaca' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              {tab === 'belum_dibaca'
                ? 'Kamu sudah membaca semua notifikasi 👍'
                : 'Notifikasi akan muncul di sini'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(notif => (
              <NotifItem
                key={notif.id}
                notif={notif}
                onRead={()   => handleRead(notif.id)}
                onDelete={() => handleDelete(notif.id)}
                onClick={()  => handleClickNotif(notif)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info total */}
      {!loading && notifs.length > 0 && (
        <p className="text-center text-xs text-slate-300 pb-6">
          {notifs.length} notifikasi tersimpan · {unreadCount} belum dibaca
        </p>
      )}

    </main>
  )
})

NotifikasiPage.displayName = 'NotifikasiPage'
export default NotifikasiPage
