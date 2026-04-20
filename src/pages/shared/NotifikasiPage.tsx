import { memo, useEffect, useState }  from 'react'
import { useNavigate }                from 'react-router-dom'
import { BellOff, Trash2, CheckCheck } from 'lucide-react'
import { playNotifSound } from '../../utils/notifSound'
import { useAuthStore }               from '../../store/authStore'
import {
  listenNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  type Notifikasi,
  type NotifType,
} from '../../services/notificationService'

const notifIcon = (type: NotifType): string => {
  const map: Partial<Record<NotifType, string>> = {
    booking_dibuat:           '🎉',
    booking_masuk:            '🔔',
    booking_dibatalkan:       '❌',
    booking_batal_konfirmasi: '✅',
    booking_aktif:            '🏠',
    booking_selesai:          '🌟',
    booking_hangus:           '⏰',
    pembayaran_lunas:         '✅',
    pembayaran_masuk:         '💰',
    refund_diproses:          '🔄',
    pengingat_checkin:        '⏰',
    checkin_dikonfirmasi:     '🏠',
    pengingat_checkout:       '📅',
    checkout_penyewa:         '📦',
    penyewa_checkin:          '👤',
    penyewa_tidak_datang:     '⚠️',
    masa_sewa_hampir_habis:   '⏳',
    dana_cair:                '💰',
    dana_hangus_masuk:        '💸',
    withdraw_disetujui:       '✅',
    withdraw_ditolak:         '❌',
    listing_disetujui:        '✅',
    listing_ditolak:          '❌',
    listing_baru:             '📋',
    withdraw_baru:            '💳',
    dispute_masuk:            '⚠️',
    pemilik_baru:             '👤',
    promo:                    '🎁',
    sistem:                   'ℹ️',
  }
  return map[type] ?? '🔔'
}

const resolveScreen = (notif: Notifikasi): string | null => {
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

const waktuRelatif = (date: Date): string => {
  const diff  = Date.now() - date.getTime()
  const menit = Math.floor(diff / 60000)
  const jam   = Math.floor(diff / 3600000)
  const hari  = Math.floor(diff / 86400000)
  if (menit < 1)  return 'Baru saja'
  if (menit < 60) return `${menit} menit lalu`
  if (jam   < 24) return `${jam} jam lalu`
  if (hari  < 7)  return `${hari} hari lalu`
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

const NotifikasiPage = memo(() => {
  const navigate              = useNavigate()
  const { user }              = useAuthStore()
  const [notifs, setNotifs]   = useState<Notifikasi[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'semua' | 'belum_dibaca'>('semua')

  useEffect(() => {
  if (!user?.uid) return
  let initialized = false
  let prevCount   = 0

  const unsub = listenNotifications(user.uid, data => {
    if (initialized && data.length > prevCount) {
      // Ada notif baru masuk → bunyi
      const newUnread = data.filter(n => !n.isRead).length
      if (newUnread > notifs.filter(n => !n.isRead).length) {
        playNotifSound()
      }
    }
    prevCount   = data.length
    initialized = true
    setNotifs(data)
    setLoading(false)
  })
  return () => unsub()
}, [user?.uid])

  const handleClick = async (notif: Notifikasi) => {
    if (!notif.isRead) await markAsRead(notif.id)
    const path = resolveScreen(notif)
    if (path) navigate(path)
  }

  const handleDelete = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation()
    await deleteNotification(notifId)
  }

  const displayed = tab === 'semua' ? notifs : notifs.filter(n => !n.isRead)
  const unread    = notifs.filter(n => !n.isRead).length

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">Notifikasi</h1>
          {unread > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => user?.uid && markAllAsRead(user.uid)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <CheckCheck size={13} /> Baca semua
            </button>
          )}
          {notifs.some(n => n.isRead) && (
            <button
              onClick={() => user?.uid && deleteReadNotifications(user.uid)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} /> Hapus dibaca
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { label: 'Semua',        value: 'semua'        as const },
          { label: 'Belum Dibaca', value: 'belum_dibaca' as const },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              tab === t.value
                ? 'bg-amber-400 border-amber-400 text-slate-900'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {t.label}
            {t.value === 'belum_dibaca' && unread > 0 && (
              <span className="ml-1.5 bg-slate-900/10 px-1 rounded-full">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-2.5 bg-slate-100 rounded w-full" />
                <div className="h-2.5 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <BellOff size={28} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-400 text-sm">
            {tab === 'belum_dibaca' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(notif => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left rounded-2xl p-4 border transition-all hover:shadow-sm flex gap-3 group ${
                notif.isRead
                  ? 'bg-white border-slate-100'
                  : 'bg-amber-50/60 border-amber-100'
              }`}
            >
              {/* Ikon */}
              <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                {notifIcon(notif.type)}
              </span>

              {/* Konten */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug mb-1 line-clamp-1 ${
                  notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
                }`}>
                  {notif.title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-1.5">
                  {notif.body}
                </p>
                <p className="text-[11px] text-slate-300">{waktuRelatif(notif.createdAt)}</p>
              </div>

              {/* Kanan: dot unread + hapus */}
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                )}
                <button
                  onClick={e => handleDelete(e, notif.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                  aria-label="Hapus notifikasi"
                >
                  <Trash2 size={12} className="text-slate-300 hover:text-red-400" />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
})

NotifikasiPage.displayName = 'NotifikasiPage'
export default NotifikasiPage
