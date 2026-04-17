import { memo, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Search, User, LayoutDashboard, FileText,
  LogOut, Bell, Check, Trash2, X
} from 'lucide-react'
import { useAuthStore }       from '../../store/authStore'
import { logoutUser }         from '../../services/authService'
import { APP_NAME }           from '../../constants'
import { useNotifications }   from '../../hooks/useNotifications'
import {
  markAsRead, markAllAsRead, deleteNotification
} from '../../services/notificationService'
import type { Notifikasi }    from '../../services/notificationService'

// ── Helper: format waktu relatif (tanpa date-fns) ──────────────
const timeAgo = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)   return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

// ── NotifDropdown ──────────────────────────────────────────────
const NotifDropdown = memo(({ onClose }: { onClose: () => void }) => {
  const navigate                        = useNavigate()
  const { user }                        = useAuthStore()
  const { notifs, unreadCount, loading } = useNotifications()

  const handleClick = async (notif: Notifikasi) => {
    if (!notif.isRead) await markAsRead(notif.id)
    if (notif.data?.bookingId)  navigate(`/booking/detail/${notif.data.bookingId}`)
    else if (notif.data?.listingId)  navigate(`/listing/${notif.data.listingId}`)
    else if (notif.data?.withdrawId) navigate('/pemilik/wallet')
    onClose()
  }

  const handleMarkAll = async () => {
    if (user?.uid) await markAllAsRead(user.uid)
  }

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-80 max-h-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800">Notifikasi</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold hover:text-amber-600 transition-colors"
            >
              <Check size={11} /> Baca semua
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse flex gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-full" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell size={28} className="text-slate-200 mb-2" />
            <p className="text-sm font-medium text-slate-400">Belum ada notifikasi</p>
            <p className="text-xs text-slate-300 mt-1">Notifikasi booking & info akan muncul di sini</p>
          </div>
        ) : (
          notifs.slice(0, 25).map(notif => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${
                !notif.isRead ? 'bg-amber-50/60' : ''
              }`}
            >
              {/* Dot unread */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                !notif.isRead ? 'bg-amber-400' : 'bg-transparent'
              }`} />

              {/* Konten */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-snug mb-0.5 truncate ${
                  !notif.isRead
                    ? 'font-semibold text-slate-800'
                    : 'font-medium text-slate-600'
                }`}>
                  {notif.title}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-1">
                  {notif.body}
                </p>
                <p className="text-[10px] text-slate-300">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              {/* Hapus */}
              <button
                onClick={e => { e.stopPropagation(); deleteNotification(notif.id) }}
                className="text-slate-200 hover:text-red-400 transition-colors flex-shrink-0 p-0.5"
                title="Hapus"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifs.length > 0 && (
        <button
          onClick={() => { navigate('/notifikasi'); onClose() }}
          className="w-full py-2.5 text-xs font-semibold text-amber-500 hover:bg-amber-50 transition-colors border-t border-slate-100"
        >
          Lihat semua notifikasi →
        </button>
      )}
    </div>
  )
})
NotifDropdown.displayName = 'NotifDropdown'

// ── Navbar Utama ───────────────────────────────────────────────
const Navbar = memo(() => {
  const location             = useLocation()
  const { user, logout }     = useAuthStore()
  const { unreadCount }      = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef             = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logoutUser()
    logout()
  }

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navItems = [
    { label: 'Beranda', href: '/',        icon: Home },
    { label: 'Cari',    href: '/listing', icon: Search },

    // Penyewa
    ...(user?.role === 'penyewa' ? [
      { label: 'Riwayat', href: '/riwayat', icon: FileText },
    ] : []),

    // Pemilik
    ...(user?.role === 'pemilik' ? [
      { label: 'Kelola', href: '/pemilik/dashboard', icon: LayoutDashboard },
    ] : []),

    // Admin
    ...(user?.role === 'admin' ? [
      { label: 'Admin', href: '/admin/dashboard', icon: LayoutDashboard },
    ] : []),

    // Akun
    {
      label: user ? user.nama.split(' ')[0] : 'Akun',
      href:  user ? '/profil' : '/login',
      icon:  User,
    },
  ]

  // Sembunyikan navbar di halaman auth
  const hideOn = ['/login', '/register']
  if (hideOn.includes(location.pathname)) return null

  const getIsActive = (href: string): boolean => {
    if (href === '/')        return location.pathname === '/'
    if (href === '/riwayat') return location.pathname === '/riwayat'
    if (href === '/listing') return location.pathname.startsWith('/listing')
    if (href === '/profil')  return location.pathname === '/profil'
    if (href === '/login')   return location.pathname === '/login'
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-extrabold text-xs">K</span>
            </div>
            <span className="text-lg font-extrabold text-slate-900">{APP_NAME}</span>
            <span className="text-xs text-slate-400 font-normal hidden sm:block">· Banten</span>
          </Link>

          {/* Kanan: Bell + User */}
          <div className="flex items-center gap-2">

            {/* 🔔 Notif Bell — tampil kalau sudah login */}
            {user && (
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  aria-label="Notifikasi"
                >
                  <Bell size={20} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <NotifDropdown onClose={() => setNotifOpen(false)} />
                )}
              </div>
            )}

            {/* User Info + Logout (desktop) */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 text-xs font-bold">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user.nama}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Bottom Navigation (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = getIsActive(href)

            // Tambah badge notif di icon Akun untuk mobile
            const showBadge = href === '/profil' && unreadCount > 0

            return (
              <Link
                key={href}
                to={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] ${
                  isActive
                    ? 'text-amber-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'scale-110 transition-transform' : ''}
                  />
                  {/* Badge notif di icon Akun (mobile) */}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 border border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium leading-none">{label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  )
})

Navbar.displayName = 'Navbar'
export default Navbar
