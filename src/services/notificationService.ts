// src/services/notificationService.ts

import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  serverTimestamp, writeBatch, getDocs, Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ── Types ──────────────────────────────────────────────────────
export type NotifType =
  | 'booking_dibuat' | 'booking_masuk' | 'booking_dibatalkan'
  | 'booking_batal_konfirmasi' | 'booking_aktif' | 'booking_selesai'
  | 'booking_hangus' | 'pembayaran_lunas' | 'pembayaran_masuk'
  | 'refund_diproses' | 'pengingat_checkin' | 'checkin_dikonfirmasi'
  | 'pengingat_checkout' | 'checkout_penyewa' | 'penyewa_checkin'
  | 'penyewa_tidak_datang' | 'masa_sewa_hampir_habis' | 'dana_cair'
  | 'dana_hangus_masuk' | 'withdraw_disetujui' | 'withdraw_ditolak'
  | 'listing_disetujui' | 'listing_ditolak' | 'listing_baru'
  | 'withdraw_baru' | 'dispute_masuk' | 'pemilik_baru' | 'promo' | 'sistem'

export interface Notifikasi {
  id:        string
  userId:    string
  type:      NotifType
  title:     string
  body:      string
  isRead:    boolean
  data?:     Record<string, string>
  createdAt: Date
}

const COL = 'notifications'

// ── CRUD ───────────────────────────────────────────────────────
export const sendNotification = async (
  userId: string,
  type:   NotifType,
  title:  string,
  body:   string,
  data:   Record<string, string> = {}
): Promise<void> => {
  await addDoc(collection(db, COL), {
    userId, type, title, body, data,
    isRead:    false,
    createdAt: serverTimestamp(),
  })
}

export const markAsRead = async (notifId: string): Promise<void> => {
  await updateDoc(doc(db, COL, notifId), { isRead: true })
}

export const markAllAsRead = async (userId: string): Promise<void> => {
  const snap = await getDocs(query(
    collection(db, COL),
    where('userId', '==', userId),
    where('isRead', '==', false)
  ))
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { isRead: true }))
  await batch.commit()
}

export const deleteNotification = async (notifId: string): Promise<void> => {
  await deleteDoc(doc(db, COL, notifId))
}

export const deleteReadNotifications = async (userId: string): Promise<void> => {
  const snap = await getDocs(query(
    collection(db, COL),
    where('userId', '==', userId),
    where('isRead', '==', true)
  ))
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

// ── Realtime listener ──────────────────────────────────────────
export const listenNotifications = (
  userId:   string,
  callback: (notifs: Notifikasi[]) => void
) =>
  onSnapshot(
    query(
      collection(db, COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ),
    snap => callback(
      snap.docs.map(d => {
        const data = d.data()
        return {
          id:        d.id,
          userId:    data.userId,
          type:      data.type,
          title:     data.title,
          body:      data.body,
          isRead:    data.isRead,
          data:      data.data ?? {},
          // Konversi Timestamp → Date dengan aman
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
        } as Notifikasi
      })
    )
  )

// ── Notif Templates ────────────────────────────────────────────
export const notifTemplates = {
  bookingDibuat: (listingNama: string, bookingId: string) => ({
    title: '🎉 Booking Berhasil Dibuat',
    body:  `Booking kamu untuk ${listingNama} berhasil dibuat. Segera lakukan pembayaran.`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  bookingMasuk: (penyewaNama: string, listingNama: string, bookingId: string) => ({
    title: '🔔 Booking Baru Masuk',
    body:  `${penyewaNama} ingin menyewa ${listingNama}. Cek detailnya.`,
    data:  { bookingId, screen: 'booking_masuk' },
  }),
  pembayaranLunas: (listingNama: string, bookingId: string) => ({
    title: '✅ Pembayaran Berhasil',
    body:  `Pembayaran untuk ${listingNama} telah berhasil dikonfirmasi.`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  pembayaranMasuk: (penyewaNama: string, listingNama: string, bookingId: string) => ({
    title: '💰 Pembayaran Diterima',
    body:  `${penyewaNama} telah melakukan pembayaran untuk ${listingNama}.`,
    data:  { bookingId, screen: 'booking_masuk' },
  }),
  checkinDikonfirmasi: (listingNama: string, bookingId: string) => ({
    title: '🏠 Check-in Dikonfirmasi',
    body:  `Check-in kamu di ${listingNama} telah dikonfirmasi oleh pemilik.`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  bookingAktif: (listingNama: string, bookingId: string) => ({
    title: '🏠 Booking Aktif',
    body:  `Booking kamu di ${listingNama} sekarang aktif. Selamat menempati!`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  bookingSelesai: (listingNama: string, bookingId: string) => ({
    title: '🌟 Booking Selesai',
    body:  `Masa sewa kamu di ${listingNama} telah berakhir. Terima kasih!`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  bookingDibatalkan: (listingNama: string, alasan: string, bookingId: string) => ({
    title: '❌ Booking Dibatalkan',
    body:  `Booking ${listingNama} dibatalkan. Alasan: ${alasan}`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  bookingHangus: (listingNama: string, bookingId: string) => ({
    title: '⏰ Booking Hangus',
    body:  `Booking kamu di ${listingNama} hangus karena tidak ada konfirmasi check-in dalam 24 jam.`,
    data:  { bookingId, screen: 'detail_booking' },
  }),
  danaHangus: (kompensasi: number, bookingId: string) => ({
    title: '💸 Dana Kompensasi Masuk',
    body:  `Kamu mendapatkan kompensasi Rp ${kompensasi.toLocaleString('id-ID')} dari booking yang hangus.`,
    data:  { bookingId, screen: 'wallet' },
  }),
}
