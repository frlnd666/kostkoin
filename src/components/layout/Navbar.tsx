import { memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, User, LayoutDashboard, FileText, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { logoutUser }   from '../../services/authService'
import { APP_NAME }     from '../../constants'

const Navbar = memo(() => {
  const location      = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logoutUser()
    logout()
  }

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

    // Akun (semua user)
    {
      label: user ? user.nama.split(' ')[0] : 'Akun',
      href:  user ? '/profil' : '/login',
      icon:  User,
    },
  ]

  // Sembunyikan navbar di halaman auth
  const hideOn = ['/login', '/register']
  if (hideOn.includes(location.pathname)) return null

  // Logika isActive yang benar per route
  const getIsActive = (href: string): boolean => {
    if (href === '/') return location.pathname === '/'
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
      </header>

      {/* ── Bottom Navigation (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = getIsActive(href)

            return (
              <Link
                key={href}
                to={href}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] ${
                  isActive
                    ? 'text-amber-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'scale-110 transition-transform' : ''}
                />
                <span className="text-xs font-medium leading-none">{label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer agar konten tidak tertutup bottom nav */}
      <div className="h-16" />
    </>
  )
})

Navbar.displayName = 'Navbar'
export default Navbar
