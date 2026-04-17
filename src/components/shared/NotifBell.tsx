import { useState, useRef, useEffect, memo } from 'react'
import { useNavigate }    from 'react-router-dom'
import { Bell, Check, Trash2 } from 'lucide-react'
import { useNotifications }   from '../../hooks/useNotifications'
import { markAsRead, markAllAsRead, deleteNotification } from '../../services/notificationService'
import { useAuthStore }   from '../../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId }      from 'date-fns/locale'

const NotifBell = memo(() => {
  const navigate              = useNavigate()
  const { user }              = useAuthStore()
  const { notifs, unreadCount } = useNotifications()
  const [open, setOpen]       = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = async (notif: typeof notifs[0]) => {
    if (!notif.isRead) await markAsRead(notif.id)

    // Navigasi berdasarkan tipe
    if (notif.data?.bookingId)  navigate(`/booking/detail/${notif.data.bookingId}`)
    if (notif.data?.listingId)  navigate(`/listing/${notif.data.listingId}`)
    if (notif.data?.withdrawId) navigate('/pemilik/wallet')
    setOpen(false)
  }

  const handleMarkAll = async () => {
    if (!user?.uid) return
    await markAllAsRead(user.uid)
  }

  if (!user) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: 'none', border: 'none',
          cursor: 'pointer', padding: '0.4rem',
          color: 'var(--color-text)',
          display: 'flex', alignItems: 'center'
        }}
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--color-error)',
            color: '#fff',
            fontSize: '0.6rem', fontWeight: 700,
            minWidth: 16, height: 16,
            borderRadius: '9999px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid var(--color-bg)'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 320, maxHeight: 480,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--color-divider)'
          }}>
            <span style={{
              fontWeight: 700, fontSize: '0.875rem',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)'
            }}>
              Notifikasi
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 6,
                  background: 'var(--color-error)',
                  color: '#fff',
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px'
                }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.72rem', color: 'var(--color-primary)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 600
                }}
              >
                <Check size={12} /> Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem'
              }}>
                <Bell size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p>Belum ada notifikasi</p>
              </div>
            ) : (
              notifs.slice(0, 20).map(notif => (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start',
                    gap: '0.75rem', padding: '0.75rem 1rem',
                    background: notif.isRead
                      ? 'transparent'
                      : 'color-mix(in oklab, var(--color-primary) 6%, var(--color-surface))',
                    borderBottom: '1px solid var(--color-divider)',
                    cursor: 'pointer',
                    transition: 'background 180ms ease'
                  }}
                  onClick={() => handleNotifClick(notif)}
                >
                  {/* Dot unread */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: notif.isRead
                      ? 'transparent'
                      : 'var(--color-primary)',
                    flexShrink: 0, marginTop: 5
                  }} />

                  {/* Konten */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.8rem', fontWeight: notif.isRead ? 400 : 600,
                      color: 'var(--color-text)',
                      marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notif.title}
                    </p>
                    <p style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.4, marginBottom: 3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {notif.body}
                    </p>
                    <p style={{
                      fontSize: '0.65rem',
                      color: 'var(--color-text-faint)'
                    }}>
                      {formatDistanceToNow(notif.createdAt, {
                        addSuffix: true, locale: localeId
                      })}
                    </p>
                  </div>

                  {/* Tombol hapus */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      deleteNotification(notif.id)
                    }}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: 4,
                      color: 'var(--color-text-faint)',
                      flexShrink: 0
                    }}
                    title="Hapus notifikasi"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <button
              onClick={() => { navigate('/notifikasi'); setOpen(false) }}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'none',
                borderTop: '1px solid var(--color-divider)',
                border: 'none', borderTop: '1px solid var(--color-divider)',
                fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--color-primary)',
                cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}
            >
              Lihat semua notifikasi
            </button>
          )}
        </div>
      )}
    </div>
  )
})

NotifBell.displayName = 'NotifBell'
export default NotifBell
