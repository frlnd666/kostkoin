import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot,
  serverTimestamp, writeBatch, getDocs
} from 'firebase/firestore'
import { db } from './firebase'

// ── Types ────────────────────────────────────────────────────
export type NotifType =
  | 'booking_dibuat'       | 'pembayaran_lunas'
  | 'pengingat_checkin'    | 'checkin_dikonfirmasi'
  | 'masa_sewa_hampir_habis'
  | 'booking_selesai'      | 'booking_hangus'
  | 'refund_diproses'      | 'promo'
  | 'booking_masuk'        | 'penyewa_checkin'
  | 'pengingat_checkout'   | 'dana_cair'
  | 'dana_hangus_masuk'    | 'withdraw_disetujui'
  | 'withdraw_ditolak'     | 'listing_disetujui'
  | 'listing_ditolak'      | 'listing_baru'
  | 'withdraw_baru'        | 'dispute_masuk'
  | 'penyewa_tidak_datang' | 'pemilik_baru'

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

// ── Kirim Notifikasi ─────────────────────────────────────────
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

// ── Tandai Satu Sudah Dibaca ─────────────────────────────────
export const markAsRead = async (notifId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notifId), { isRead: true })
}

// ── Tandai Semua Sudah Dibaca ────────────────────────────────
export const markAllAsRead = async (userId: string): Promise<void> => {
  const q     = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  )
  const snap  = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { isRead: true }))
  await batch.commit()
}

// ── Hapus Notifikasi ─────────────────────────────────────────
export const deleteNotification = async (notifId: string): Promise<void> => {
  await deleteDoc(doc(db, 'notifications', notifId))
}

// ── Realtime Listener ────────────────────────────────────────
export const listenNotifications = (
  userId:   string,
  callback: (notifs: Notifikasi[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, snap => {
    const data = snap.docs.map(d => ({
      id:        d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() ?? new Date(),
    })) as Notifikasi[]
    callback(data)
  })
}

// ── Helper Templates ─────────────────────────────────────────
export const notifTemplates = {
  // Penyewa
  bookingDibuat:    (listingNama: string, bookingId: string) => ({
    title: '🎉 Booking Berhasil!',
    body:  `Booking kamu untuk ${listingNama} telah dibuat. Segera lakukan pembayaran.`,
    data:  { bookingId }
  }),
  pembayaranLunas:  (listingNama: string, bookingId: string) => ({
    title: '✅ Pembayaran Dikonfirmasi',
    body:  `Pembayaran untuk ${listingNama} berhasil. Sampai jumpa saat check-in!`,
    data:  { bookingId }
  }),
  pengingatCheckin: (listingNama: string, bookingId: string) => ({
    title: '⏰ Pengingat Check-in Besok',
    body:  `Jangan lupa check-in besok di ${listingNama}. Konfirmasi kedatangan kamu ya!`,
    data:  { bookingId }
  }),
  checkinDikonfirmasi: (listingNama: string, bookingId: string) => ({
    title: '🏠 Check-in Dikonfirmasi',
    body:  `Pemilik telah mengkonfirmasi kedatangan kamu di ${listingNama}. Selamat menikmati!`,
    data:  { bookingId }
  }),
  bookingHangus: (listingNama: string, bookingId: string) => ({
    title: '❌ Booking Hangus',
    body:  `Booking kamu untuk ${listingNama} hangus karena melewati batas waktu check-in.`,
    data:  { bookingId }
  }),
  bookingSelesai: (listingNama: string, bookingId: string) => ({
    title: '🌟 Masa Sewa Selesai',
    body:  `Terima kasih telah menginap di ${listingNama}. Semoga pengalamannya menyenangkan!`,
    data:  { bookingId }
  }),

  // Pemilik
  bookingMasuk: (penyewaNama: string, listingNama: string, bookingId: string) => ({
    title: '🔔 Booking Baru Masuk!',
    body:  `${penyewaNama} baru saja memesan kamar di ${listingNama}. Cek detailnya!`,
    data:  { bookingId }
  }),
  danaCair: (jumlah: number, bookingId: string) => ({
    title: '💰 Dana Berhasil Cair!',
    body:  `Rp ${jumlah.toLocaleString('id')} telah masuk ke saldo wallet kamu.`,
    data:  { bookingId }
  }),
  danaHangus: (jumlah: number, bookingId: string) => ({
    title: '💸 Kompensasi Hangus Masuk',
    body:  `Rp ${jumlah.toLocaleString('id')} kompensasi hangus telah masuk ke saldo kamu.`,
    data:  { bookingId }
  }),
  withdrawDisetujui: (jumlah: number, withdrawId: string) => ({
    title: '✅ Penarikan Disetujui',
    body:  `Penarikan dana Rp ${jumlah.toLocaleString('id')} telah disetujui dan sedang diproses.`,
    data:  { withdrawId }
  }),
  withdrawDitolak: (jumlah: number, alasan: string, withdrawId: string) => ({
    title: '❌ Penarikan Ditolak',
    body:  `Penarikan Rp ${jumlah.toLocaleString('id')} ditolak. Alasan: ${alasan}`,
    data:  { withdrawId }
  }),
  listingDisetujui: (listingNama: string, listingId: string) => ({
    title: '✅ Listing Disetujui!',
    body:  `${listingNama} telah disetujui dan sekarang tampil di halaman pencarian.`,
    data:  { listingId }
  }),
  listingDitolak: (listingNama: string, alasan: string, listingId: string) => ({
    title: '❌ Listing Ditolak',
    body:  `${listingNama} ditolak. Alasan: ${alasan}`,
    data:  { listingId }
  }),

  // Admin
  listingBaru: (listingNama: string, pemilikNama: string, listingId: string) => ({
    title: '📋 Listing Baru Menunggu Review',
    body:  `${pemilikNama} mengajukan listing baru: ${listingNama}`,
    data:  { listingId }
  }),
  withdrawBaru: (pemilikNama: string, jumlah: number, withdrawId: string) => ({
    title: '💳 Permintaan Penarikan Baru',
    body:  `${pemilikNama} mengajukan penarikan Rp ${jumlah.toLocaleString('id')}`,
    data:  { withdrawId }
  }),
  pemilikBaru: (pemilikNama: string, userId: string) => ({
    title: '👤 Pemilik Baru Terdaftar',
    body:  `${pemilikNama} baru saja mendaftar sebagai pemilik kost.`,
    data:  { userId }
  }),
                                                      }
