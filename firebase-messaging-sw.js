importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            "AIzaSyBE2_i-vCf7cTOJbeu3Jy-R5-ycOAUua8c",
  authDomain:        "kostkoin.firebaseapp.com",
  projectId:         "kostkoin",
  storageBucket:     "kostkoin.firebasestorage.app",
  messagingSenderId: "475360300341",
  appId:             "1:475360300341:web:b7fec8dfe0a611c5b5d07c",
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
