import { memo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, Shield, Home,
  LogOut, ChevronRight, Camera, Pencil, Check, X
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge  from '../../components/ui/Badge'
import Modal  from '../../components/ui/Modal'
import { useAuthStore }               from '../../store/authStore'
import { logoutUser, updateUserName, updateUserAvatar } from '../../services/authService'
import { APP_NAME } from '../../constants'

const ProfilPage = memo(() => {
  const navigate              = useNavigate()
  const { user, logout, setUser } = useAuthStore()

  // ── State Logout ─────────────────────────────────────────
  const [logoutModal, setLogoutModal]   = useState(false)
  const [loadingLogout, setLoadingLogout] = useState(false)

  // ── State Edit Nama ──────────────────────────────────────
  const [editNama, setEditNama]       = useState(false)
  const [namaBaru, setNamaBaru]       = useState(user?.nama ?? '')
  const [loadingNama, setLoadingNama] = useState(false)
  const [errNama, setErrNama]         = useState('')

  // ── State Upload Avatar ──────────────────────────────────
  const [loadingAvatar, setLoadingAvatar] = useState(false)
  const [errAvatar, setErrAvatar]         = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ─────────────────────────────────────────────
  const handleLogout = async () => {
    setLoadingLogout(true)
    await logoutUser()
    logout()
    navigate('/')
  }

  const handleSaveNama = async () => {
    if (!namaBaru.trim()) { setErrNama('Nama tidak boleh kosong'); return }
    setLoadingNama(true); setErrNama('')
    try {
      await updateUserName(namaBaru.trim())
      if (user) setUser({ ...user, nama: namaBaru.trim() })
      setEditNama(false)
    } catch {
      setErrNama('Gagal menyimpan nama, coba lagi')
    } finally {
      setLoadingNama(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoadingAvatar(true); setErrAvatar('')
    try {
      const fotoUrl = await updateUserAvatar(file)
      if (user) setUser({ ...user, fotoUrl })
    } catch (err: any) {
      setErrAvatar(err?.message ?? 'Gagal upload foto, coba lagi')
    } finally {
      setLoadingAvatar(false)
    }
  }

  // ── Role Badge ───────────────────────────────────────────
  const roleBadge = () => {
    if (user?.role === 'admin')   return <Badge variant="danger">Admin</Badge>
    if (user?.role === 'pemilik') return <Badge variant="info">Pemilik Kost</Badge>
    return <Badge variant="success">Penyewa</Badge>
  }

  const menuItems = [
    ...(user?.role === 'pemilik' ? [
      { label: 'Dashboard Pemilik', icon: <Home size={18}/>,         href: '/pemilik/dashboard' },
      { label: 'Tambah Listing',    icon: <Home size={18}/>,         href: '/pemilik/tambah' },
      { label: 'Riwayat Booking',   icon: <ChevronRight size={18}/>, href: '/pemilik/booking' },
    ] : []),
    ...(user?.role === 'admin' ? [
      { label: 'Admin Dashboard', icon: <Shield size={18}/>, href: '/admin/dashboard' },
    ] : []),
  ]

  if (!user) { navigate('/login'); return null }

  const fotoUrl = (user as any).fotoUrl as string | undefined

  // ── Render ───────────────────────────────────────────────
  return (
    <main style={{
      maxWidth: 480, margin: '0 auto',
      padding: '2rem 1rem 5rem',
      background: 'var(--color-bg)', minHeight: '100vh'
    }}>

      {/* Judul */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.4rem, 5vw, 1.75rem)',
        fontWeight: 700, letterSpacing: '-0.025em',
        color: 'var(--color-text)', marginBottom: '1.5rem'
      }}>
        Profil Saya
      </h1>

      {/* ── Kartu Avatar & Nama ── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem', marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={user.nama}
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-border)'
                }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--color-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700,
                color: 'var(--color-text-inverse)'
              }}>
                {user.nama.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Tombol kamera */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingAvatar}
              title="Ganti foto profil"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--color-primary)',
                border: '2px solid var(--color-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: loadingAvatar ? 'wait' : 'pointer',
                color: '#fff'
              }}
            >
              {loadingAvatar
                ? <span style={{ fontSize: 7, lineHeight: 1 }}>...</span>
                : <Camera size={11}/>
              }
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Nama & Role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editNama ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  value={namaBaru}
                  onChange={e => setNamaBaru(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveNama() }}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.9rem', fontWeight: 600,
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none', width: '100%'
                  }}
                />
                {errNama && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-error)', margin: 0 }}>
                    {errNama}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleSaveNama}
                    disabled={loadingNama}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'var(--color-primary)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)',
                      padding: '0.3rem 0.75rem', fontSize: '0.75rem',
                      fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    <Check size={12}/>
                    {loadingNama ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => { setEditNama(false); setNamaBaru(user.nama); setErrNama('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'transparent', color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                      padding: '0.3rem 0.6rem', fontSize: '0.75rem',
                      cursor: 'pointer', fontFamily: 'var(--font-body)'
                    }}
                  >
                    <X size={12}/> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 6, flexWrap: 'wrap', marginBottom: 4
                }}>
                  <span style={{
                    fontWeight: 700, fontSize: '1rem',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-display)'
                  }}>
                    {user.nama}
                  </span>
                  <button
                    onClick={() => { setEditNama(true); setNamaBaru(user.nama) }}
                    title="Edit nama"
                    style={{
                      background: 'none', border: 'none', padding: 3,
                      cursor: 'pointer', color: 'var(--color-text-faint)',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <Pencil size={13}/>
                  </button>
                  {roleBadge()}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {APP_NAME} Member
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error avatar */}
        {errAvatar && (
          <p style={{
            fontSize: '0.72rem', color: 'var(--color-error)',
            marginTop: '0.6rem', marginBottom: 0
          }}>
            {errAvatar}
          </p>
        )}
      </div>

      {/* ── Informasi Akun ── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1rem 1.25rem', marginBottom: '0.75rem'
      }}>
        <p style={{
          fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)', marginBottom: '0.85rem'
        }}>
          Informasi Akun
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { icon: <User size={15}/>,   label: 'Nama',   value: user.nama   },
            { icon: <Mail size={15}/>,   label: 'Email',  value: user.email  },
            { icon: <Phone size={15}/>,  label: 'No. HP', value: user.noHp   },
            { icon: <Shield size={15}/>, label: 'Role',   value: user.role   },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ color: 'var(--color-gold)', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {item.label}
                </p>
                <p style={{
                  fontSize: '0.85rem', fontWeight: 500,
                  color: 'var(--color-text)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu Role ── */}
      {menuItems.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden', marginBottom: '0.75rem'
        }}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                background: 'none', border: 'none',
                borderBottom: i < menuItems.length - 1
                  ? '1px solid var(--color-divider)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--color-gold)' }}>{item.icon}</span>
                <span style={{
                  fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--color-text)'
                }}>
                  {item.label}
                </span>
              </div>
              <ChevronRight size={15} style={{ color: 'var(--color-text-faint)' }}/>
            </button>
          ))}
        </div>
      )}

      {/* ── Tombol Logout ── */}
      <button
        onClick={() => setLogoutModal(true)}
        style={{
          width: '100%', padding: '0.85rem',
          background: 'rgba(161,44,123,0.12)',
          border: '1px solid rgba(161,44,123,0.25)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
          fontSize: '0.875rem', fontWeight: 700,
          color: 'var(--color-error)', cursor: 'pointer',
          fontFamily: 'var(--font-body)'
        }}
      >
        <LogOut size={17}/>
        Keluar dari Akun
      </button>

      {/* ── Modal Konfirmasi Logout ── */}
      <Modal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        title="Konfirmasi Logout"
      >
        <p style={{
          color: 'var(--color-text-muted)',
          marginBottom: '1.5rem', fontSize: '0.9rem'
        }}>
          Apakah kamu yakin ingin keluar dari akun{' '}
          <strong style={{ color: 'var(--color-text)' }}>{user.nama}</strong>?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="ghost" size="md" fullWidth onClick={() => setLogoutModal(false)}>
            Batal
          </Button>
          <Button variant="danger" size="md" fullWidth loading={loadingLogout} onClick={handleLogout}>
            <LogOut size={15}/>
            Ya, Keluar
          </Button>
        </div>
      </Modal>

    </main>
  )
})

ProfilPage.displayName = 'ProfilPage'
export default ProfilPage
