importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            "ISI_DARI_FIREBASE_CONFIG",
  authDomain:        "ISI_DARI_FIREBASE_CONFIG",
  projectId:         "ISI_DARI_FIREBASE_CONFIG",
  storageBucket:     "ISI_DARI_FIREBASE_CONFIG",
  messagingSenderId: "ISI_DARI_FIREBASE_CONFIG",
  appId:             "ISI_DARI_FIREBASE_CONFIG",
})

const messaging = firebase.messaging()

// Tangani notif saat app di background / tertutup
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'KostKoin', {
    body:    body ?? '',
    icon:    icon ?? '/icon-192.png',
    badge:   '/icon-72.png',
    vibrate: [200, 100, 200],
    data:    payload.data,
  })
})

// Klik notif → buka URL yang sesuai
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.screen
    ? `https://kostkoin.vercel.app/${event.notification.data.screen}`
    : 'https://kostkoin.vercel.app/'
  event.waitUntil(clients.openWindow(url))
})
