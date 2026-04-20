import { memo, useEffect, useState } from 'react'
import { useNavigate }               from 'react-router-dom'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { useAuthStore }              from '../../store/authStore'
import {
  listenNotifications,
  markAsRead,
  markAllAsRead,
  type Notifikasi,
  type NotifType,
} from '../../services/notificationService'

// ── Config ikon per tipe ──────────────────────────────────────
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

// ── Navigasi berdasarkan screen di data ──────────────────────
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

// ── Format waktu relatif ─────────────────────────────────────
const waktuRelatif = (date: Date): string => {
  const diff  = Date.now() - date.getTime()
  const menit = Math.floor(diff / 60000)
  const jam   = Math.floor(diff / 3600000)
  const hari  = Math.floor(diff / 86400000)
  if (menit < 1)  return 'Baru saja'
  if (menit < 60) return `${menit}m lalu`
  if (jam   < 24) return `${jam}j lalu`
  if (hari  < 7)  return `${hari}h lalu`
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const NotifBell = memo(() => {
  const navigate              = useNavigate()
  const { user }              = useAuthStore()
  const [open, setOpen]       = useState(false)
  const [notifs, setNotifs]   = useState<Notifikasi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = listenNotifications(user.uid, data => {
      setNotifs(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  const unread = notifs.filter(n => !n.isRead).length

  const handleClick = async (notif: Notifikasi) => {
    if (!notif.isRead) await markAsRead(notif.id)
    const path = resolveScreen(notif)
    setOpen(false)
    if (path) navigate(path)
  }

  const handleMarkAll = async () => {
    if (!user?.uid) return
    await markAllAsRead(user.uid)
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={20} className="text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-400 text-slate-900 text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">Notifikasi</span>
                {unread > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <CheckCheck size={12} />
                    Baca semua
                  </button>
                )}
                <button
                  onClick={() => { setOpen(false); navigate('/notifikasi') }}
                  className="text-[11px] font-semibold text-amber-500 hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Lihat semua
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col gap-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 pt-0.5">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-2.5 bg-slate-100 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <BellOff size={28} className="text-slate-200 mb-2" />
                  <p className="text-sm font-medium text-slate-400">Belum ada notifikasi</p>
                </div>
              ) : (
                notifs.slice(0, 10).map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                      notif.isRead ? '' : 'bg-amber-50/50'
                    }`}
                  >
                    {/* Ikon */}
                    <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
                      {notifIcon(notif.type)}
                    </span>

                    {/* Konten */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug mb-0.5 line-clamp-1 ${
                        notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1">
                        {waktuRelatif(notif.createdAt)}
                      </p>
                    </div>

                    {/* Dot unread */}
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifs.length > 10 && (
              <div className="border-t border-slate-100 px-4 py-2.5">
                <button
                  onClick={() => { setOpen(false); navigate('/notifikasi') }}
                  className="w-full text-center text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
                >
                  Lihat {notifs.length - 10} notifikasi lainnya →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
})

NotifBell.displayName = 'NotifBell'
export default NotifBell
