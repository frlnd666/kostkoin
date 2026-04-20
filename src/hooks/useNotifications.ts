import { useEffect, useState } from 'react'
import { useAuthStore }        from '../store/authStore'
import {
  listenNotifications,
  type Notifikasi,
} from '../services/notificationService'

export const useNotifications = () => {
  const { user }              = useAuthStore()
  const [notifs, setNotifs]   = useState<Notifikasi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setNotifs([])
      setLoading(false)
      return
    }

    const unsub = listenNotifications(user.uid, data => {
      setNotifs(data)
      setLoading(false)
    })

    return () => unsub()
  }, [user?.uid])

  const unreadCount = notifs.filter(n => !n.isRead).length

  return { notifs, unreadCount, loading }
}
