import { memo, useState } from 'react'
import { useNavigate }    from 'react-router-dom'
import { User, Mail, Phone, Shield, Home, LogOut, ChevronRight } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import Badge   from '../../components/ui/Badge'
import Modal   from '../../components/ui/Modal'
import { useAuthStore }  from '../../store/authStore'
import { logoutUser }    from '../../services/authService'
import { APP_NAME }      from '../../constants'

const ProfilPage = memo(() => {
  const navigate              = useNavigate()
  const { user, logout }      = useAuthStore()
  const [logoutModal, setLogoutModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await logoutUser()
    logout()
    navigate('/')
  }

  const roleBadge = () => {
    if (user?.role === 'admin')   return <Badge variant="danger">Admin</Badge>
    if (user?.role === 'pemilik') return <Badge variant="info">Pemilik Kost</Badge>
    return <Badge variant="success">Penyewa</Badge>
  }

  const menuItems = [
    ...(user?.role === 'pemilik' ? [
      { label: 'Dashboard Pemilik', icon: <Home size={18} />,   href: '/pemilik/dashboard' },
      { label: 'Tambah Listing',    icon: <Home size={18} />,   href: '/pemilik/tambah' },
      { label: 'Riwayat Booking',   icon: <ChevronRight size={18} />, href: '/pemilik/booking' },
    ] : []),
    ...(user?.role === 'admin' ? [
      { label: 'Admin Dashboard', icon: <Shield size={18} />, href: '/admin/dashboard' },
    ] : []),
  ]

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil Saya</h1>

      {/* Avatar & Info */}
      <Card padding="lg" className="mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-bold text-slate-900 text-lg">{user.nama}</h2>
              {roleBadge()}
            </div>
            <p className="text-slate-500 text-sm">{APP_NAME} Member</p>
          </div>
        </div>
      </Card>

      {/* Detail Info */}
      <Card padding="md" className="mb-4">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">Informasi Akun</h3>
        <div className="flex flex-col gap-3">
          {[
            { icon: <User size={16} />,   label: 'Nama',  value: user.nama },
            { icon: <Mail size={16} />,   label: 'Email', value: user.email },
            { icon: <Phone size={16} />,  label: 'No. HP', value: user.noHp },
            { icon: <Shield size={16} />, label: 'Role',  value: user.role },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-amber-400 shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-medium text-slate-900 truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Menu Items */}
      {menuItems.length > 0 && (
        <Card padding="none" className="mb-4 overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.href)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3 text-slate-700">
                <span className="text-amber-400">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
        </Card>
      )}

      {/* Logout Button */}
      <Button
        variant="danger"
        size="lg"
        fullWidth
        onClick={() => setLogoutModal(true)}
      >
        <LogOut size={18} />
        Keluar dari Akun
      </Button>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        title="Konfirmasi Logout"
      >
        <p className="text-slate-600 mb-6">
          Apakah kamu yakin ingin keluar dari akun <span className="font-semibold">{user.nama}</span>?
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" size="md" fullWidth onClick={() => setLogoutModal(false)}>
            Batal
          </Button>
          <Button variant="danger" size="md" fullWidth loading={loading} onClick={handleLogout}>
            <LogOut size={16} />
            Ya, Keluar
          </Button>
        </div>
      </Modal>
    </main>
  )
})

ProfilPage.displayName = 'ProfilPage'
export default ProfilPage
 
