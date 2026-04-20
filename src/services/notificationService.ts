import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot,
  serverTimestamp, writeBatch, getDocs, limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type NotifType =
  | 'booking_dibuat'          | 'booking_masuk'
  | 'booking_dibatalkan'      | 'booking_batal_konfirmasi'
  | 'booking_aktif'           | 'booking_selesai'
  | 'booking_hangus'          | 'pembayaran_lunas'
  | 'pembayaran_masuk'        | 'refund_diproses'
  | 'pengingat_checkin'       | 'checkin_dikonfirmasi'
  | 'pengingat_checkout'      | 'checkout_penyewa'
  | 'penyewa_checkin'         | 'penyewa_tidak_datang'
  | 'masa_sewa_hampir_habis'  | 'dana_cair'
  | 'dana_hangus_masuk'       | 'withdraw_disetujui'
  | 'withdraw_ditolak'        | 'listing_disetujui'
  | 'listing_ditolak'         | 'listing_baru'
  | 'withdraw_baru'           | 'dispute_masuk'
  | 'pemilik_baru'            | 'promo'
  | 'sistem'

export interface Notifikasi {
  id:        string
  userId:    string
  type:      NotifType
  title:     string
  body:      string
  data?:     Record<string, string>
  isRead:    boolean
  createdAt: Date
}

interface NotifPayload {
  title: string
  body:  string
  data:  Record<string, string>
}

// ─────────────────────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────────────────────
export const sendNotification = async (
  userId: string,
  type:   NotifType,
  title:  string,
  body:   string,
  data?:  Record<string, string>
): Promise<void> => {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    body,
    data:      data ?? {},
    isRead:    false,
    createdAt: serverTimestamp(),
  })
}

// ─────────────────────────────────────────────────────────────
// READ / LISTENERS
// ─────────────────────────────────────────────────────────────
export const listenNotifications = (
  userId:   string,
  callback: (notifs: Notifikasi[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({
      id:        d.id,
      ...d.data(),
      createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
    })) as Notifikasi[])
  })
}

export const listenUnreadCount = (
  userId:   string,
  callback: (count: number) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId',  '==', userId),
    where('isRead',  '==', false)
  )
  return onSnapshot(q, snap => callback(snap.size))
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────
export const markAsRead = async (notifId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notifId), { isRead: true })
}

export const markAllAsRead = async (userId: string): Promise<void> => {
  const q    = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  )
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { isRead: true }))
  await batch.commit()
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
export const deleteNotification = async (notifId: string): Promise<void> => {
  await deleteDoc(doc(db, 'notifications', notifId))
}

export const deleteAllNotifications = async (userId: string): Promise<void> => {
  const q    = query(collection(db, 'notifications'), where('userId', '==', userId))
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export const deleteReadNotifications = async (userId: string): Promise<void> => {
  const q    = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', true)
  )
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────
export const notifTemplates = {
  bookingDibuat: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '🎉 Booking Berhasil Dibuat!',
    body:  `Booking kamu untuk ${listingNama} telah dibuat. Segera lakukan pembayaran dalam 24 jam.`,
    data:  { bookingId, listingNama, screen: 'payment' },
  }),
  bookingMasuk: (penyewaNama: string, listingNama: string, bookingId: string): NotifPayload => ({
    title: '🔔 Booking Baru Masuk!',
    body:  `${penyewaNama} baru saja memesan kamar di ${listingNama}. Cek detailnya sekarang!`,
    data:  { bookingId, listingNama, penyewaNama, screen: 'booking_masuk' },
  }),
  bookingDibatalkan: (listingNama: string, alasan: string, bookingId: string): NotifPayload => ({
    title: '❌ Booking Dibatalkan',
    body:  `Booking ${listingNama} telah dibatalkan. Alasan: ${alasan}`,
    data:  { bookingId, listingNama, alasan, screen: 'riwayat' },
  }),
  bookingBatalKonfirmasi: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '✅ Pembatalan Berhasil',
    body:  `Booking kamu untuk ${listingNama} telah berhasil dibatalkan.`,
    data:  { bookingId, listingNama, screen: 'riwayat' },
  }),
  bookingAktif: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '🏠 Selamat Datang!',
    body:  `Kamu sudah resmi menempati ${listingNama}. Semoga betah ya!`,
    data:  { bookingId, listingNama, screen: 'detail_booking' },
  }),
  bookingSelesai: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '🌟 Masa Sewa Selesai',
    body:  `Terima kasih telah menginap di ${listingNama}. Bagaimana pengalamannya?`,
    data:  { bookingId, listingNama, screen: 'review' },
  }),
  bookingHangus: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '⏰ Booking Hangus',
    body:  `Booking kamu untuk ${listingNama} hangus karena melewati batas waktu.`,
    data:  { bookingId, listingNama, screen: 'riwayat' },
  }),
  pembayaranLunas: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '✅ Pembayaran Berhasil!',
    body:  `Pembayaran untuk ${listingNama} dikonfirmasi. Tunggu konfirmasi check-in dari pemilik ya.`,
    data:  { bookingId, listingNama, screen: 'detail_booking' },
  }),
  pembayaranMasuk: (penyewaNama: string, listingNama: string, bookingId: string): NotifPayload => ({
    title: '💰 Pembayaran Diterima!',
    body:  `${penyewaNama} sudah melakukan pembayaran untuk ${listingNama}. Silakan konfirmasi check-in.`,
    data:  { bookingId, listingNama, penyewaNama, screen: 'booking_masuk' },
  }),
  refundDiproses: (jumlah: number, bookingId: string): NotifPayload => ({
    title: '🔄 Refund Sedang Diproses',
    body:  `Refund sebesar Rp ${jumlah.toLocaleString('id')} sedang diproses. Estimasi 3-5 hari kerja.`,
    data:  { bookingId, jumlah: String(jumlah), screen: 'riwayat' },
  }),
  pengingatCheckin: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '⏰ Pengingat Check-in Besok!',
    body:  `Jangan lupa check-in besok di ${listingNama}. Pastikan kamu hadir ya!`,
    data:  { bookingId, listingNama, screen: 'detail_booking' },
  }),
  checkinDikonfirmasi: (listingNama: string, bookingId: string): NotifPayload => ({
    title: '🏠 Check-in Dikonfirmasi!',
    body:  `Pemilik telah mengkonfirmasi kedatangan kamu di ${listingNama}. Selamat menikmati!`,
    data:  { bookingId, listingNama, screen: 'detail_booking' },
  }),
  pengingatCheckout: (listingNama: string, hari: number, bookingId: string): NotifPayload => ({
    title: '📅 Pengingat Checkout',
    body:  `Masa sewamu di ${listingNama} akan berakhir dalam ${hari} hari. Perpanjang sekarang?`,
    data:  { bookingId, listingNama, hari: String(hari), screen: 'detail_booking' },
  }),
  checkoutPenyewa: (penyewaNama: string, listingNama: string, bookingId: string): NotifPayload => ({
    title: '📦 Penyewa Checkout',
    body:  `${penyewaNama} telah checkout dari ${listingNama}. Kamar siap untuk disewakan kembali.`,
    data:  { bookingId, listingNama, penyewaNama, screen: 'booking_masuk' },
  }),
  penyewaTidakDatang: (penyewaNama: string, listingNama: string, bookingId: string): NotifPayload => ({
    title: '⚠️ Penyewa Tidak Datang',
    body:  `${penyewaNama} tidak check-in tepat waktu di ${listingNama}.`,
    data:  { bookingId, listingNama, penyewaNama, screen: 'booking_masuk' },
  }),
  masaSewaHampirHabis: (listingNama: string, hari: number, bookingId: string): NotifPayload => ({
    title: '⏳ Masa Sewa Hampir Habis',
    body:  `Sewa kamu di ${listingNama} tinggal ${hari} hari lagi. Yuk perpanjang sekarang!`,
    data:  { bookingId, listingNama, hari: String(hari), screen: 'detail_booking' },
  }),
  danaCair: (jumlah: number, listingNama: string, bookingId: string): NotifPayload => ({
    title: '💰 Dana Berhasil Cair!',
    body:  `Rp ${jumlah.toLocaleString('id')} dari sewa ${listingNama} telah masuk ke wallet kamu.`,
    data:  { bookingId, listingNama, jumlah: String(jumlah), screen: 'wallet' },
  }),
  danaHangus: (jumlah: number, bookingId: string): NotifPayload => ({
    title: '💸 Kompensasi Hangus Masuk',
    body:  `Rp ${jumlah.toLocaleString('id')} kompensasi dari booking yang hangus telah masuk ke saldo kamu.`,
    data:  { bookingId, jumlah: String(jumlah), screen: 'wallet' },
  }),
  withdrawDisetujui: (jumlah: number, withdrawId: string): NotifPayload => ({
    title: '✅ Penarikan Disetujui',
    body:  `Penarikan dana Rp ${jumlah.toLocaleString('id')} telah disetujui dan sedang diproses.`,
    data:  { withdrawId, jumlah: String(jumlah), screen: 'wallet' },
  }),
  withdrawDitolak: (jumlah: number, alasan: string, withdrawId: string): NotifPayload => ({
    title: '❌ Penarikan Ditolak',
    body:  `Penarikan Rp ${jumlah.toLocaleString('id')} ditolak. Alasan: ${alasan}`,
    data:  { withdrawId, jumlah: String(jumlah), alasan, screen: 'wallet' },
  }),
  listingDisetujui: (listingNama: string, listingId: string): NotifPayload => ({
    title: '✅ Listing Disetujui!',
    body:  `${listingNama} telah disetujui dan sekarang tampil di halaman pencarian KostKoin.`,
    data:  { listingId, listingNama, screen: 'listing_detail' },
  }),
  listingDitolak: (listingNama: string, alasan: string, listingId: string): NotifPayload => ({
    title: '❌ Listing Ditolak',
    body:  `${listingNama} ditolak admin. Alasan: ${alasan}. Silakan perbaiki dan ajukan ulang.`,
    data:  { listingId, listingNama, alasan, screen: 'listing_detail' },
  }),
  listingBaru: (listingNama: string, pemilikNama: string, listingId: string): NotifPayload => ({
    title: '📋 Listing Baru Menunggu Review',
    body:  `${pemilikNama} mengajukan listing baru: "${listingNama}". Segera review!`,
    data:  { listingId, listingNama, pemilikNama, screen: 'admin_listing' },
  }),
  withdrawBaru: (pemilikNama: string, jumlah: number, withdrawId: string): NotifPayload => ({
    title: '💳 Permintaan Penarikan Baru',
    body:  `${pemilikNama} mengajukan penarikan Rp ${jumlah.toLocaleString('id')}. Segera proses!`,
    data:  { withdrawId, pemilikNama, jumlah: String(jumlah), screen: 'admin_withdraw' },
  }),
  disputeMasuk: (penyewaNama: string, listingNama: string, disputeId: string): NotifPayload => ({
    title: '⚠️ Komplain Baru Masuk',
    body:  `${penyewaNama} mengajukan komplain terkait ${listingNama}. Segera ditangani!`,
    data:  { disputeId, penyewaNama, listingNama, screen: 'admin_dispute' },
  }),
  pemilikBaru: (pemilikNama: string, userId: string): NotifPayload => ({
    title: '👤 Pemilik Baru Terdaftar',
    body:  `${pemilikNama} baru saja mendaftar sebagai pemilik kost.`,
    data:  { userId, pemilikNama, screen: 'admin_user' },
  }),
  promo: (judul: string, pesan: string): NotifPayload => ({
    title: `🎁 ${judul}`,
    body:  pesan,
    data:  { screen: 'promo' },
  }),
  sistem: (judul: string, pesan: string): NotifPayload => ({
    title: `ℹ️ ${judul}`,
    body:  pesan,
    data:  { screen: 'home' },
  }),
}
