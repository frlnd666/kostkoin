import { useEffect, useState } from 'react'
import { listenNotifications, type Notifikasi } from '../services/notificationService'
import { useAuthStore } from '../store/authStore'

export const useNotifications = () => {
  const { user }                          = useAuthStore()
  const [notifs, setNotifs]               = useState<Notifikasi[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }

    const unsub = listenNotifications(user.uid, data => {
      setNotifs(data)
      setLoading(false)
    })

    return () => unsub()
  }, [user?.uid])

  const unreadCount = notifs.filter(n => !n.isRead).length
  const unread      = notifs.filter(n => !n.isRead)
  const read        = notifs.filter(n => n.isRead)

  return { notifs, unread, read, unreadCount, loading }
}
