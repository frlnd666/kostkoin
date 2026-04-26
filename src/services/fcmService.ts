
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, deleteField, updateDoc } from 'firebase/firestore'
import { app, db } from '../config/firebase'

const VAPID_KEY = 'BKRMa64tAGlnheXKhsTLJXV2sZP9FCtfGqf2VdJByyL0iTi0uuwIIqgLeS7XAgEwYJurazs__7REV6Z4XSd3ufs'

export const requestNotifPermission = async (userId: string): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) return false

    // Simpan token FCM ke Firestore user
    await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true })
    return true
  } catch (err) {
    console.error('FCM error:', err)
    return false
  }
}

// Tangani notif saat app di foreground (terbuka)
export const listenForegroundNotif = (
  onReceive: (title: string, body: string) => void
) => {
  const messaging = getMessaging(app)
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'KostKoin'
    const body  = payload.notification?.body  ?? ''
    onReceive(title, body)
  })
}

export const removeFcmToken = async (userId: string): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { fcmToken: deleteField() })
}
