import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const sendPushOnNotif = onDocumentCreated(
  'notifications/{userId}/items/{notifId}',
  async (event) => {
    const notif  = event.data?.data()
    const userId = event.params.userId
    if (!notif) return

    const userSnap = await admin.firestore().doc(`users/${userId}`).get()
    const fcmToken = userSnap.data()?.fcmToken
    if (!fcmToken) return

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: notif.title,
        body:  notif.body,
      },
      data: notif.data ?? {},
      android: {
        notification: {
          sound:       'default',
          priority:    'high',
          channelId:   'kostkoin_notif',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      webpush: {
        notification: {
          icon:    '/icon-192.png',
          badge:   '/icon-72.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: notif.data?.screen
            ? `https://kostkoin.vercel.app/${notif.data.screen}`
            : 'https://kostkoin.vercel.app/',
        },
      },
    })
  }
)
