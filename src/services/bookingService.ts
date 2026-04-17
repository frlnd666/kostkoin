import {
  collection, addDoc, getDoc, getDocs, doc,
  updateDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Timestamp,
  writeBatch, deleteField,
} from 'firebase/firestore'
import { db }                                from '../config/firebase'
import type { Booking, BookingStatus, TipeKamar, PembayaranInfo } from '../types/booking'
import type { Listing, TipeHarga }           from '../types/listing'
import { sendNotification, notifTemplates }  from './notificationService'

const COL = 'bookings'

// ─────────────────────────────────────────────────────────────
// TYPES INPUT
// ─────────────────────────────────────────────────────────────
export interface CreateBookingInput {
  listingId:      string
  listingNama:    string
  listingAlamat:  string
  penyewaId:      string
  penyewaNama:    string
  penyewaEmail:   string
  penyewaNoHp?:   string
  pemilikId:      string
  pemilikNama:    string
  tipeKamar:      TipeKamar
  tanggalMulai:   Date
  tanggalSelesai: Date
  durasi:         number
  hargaSatuan:    number
  totalHarga:     number
  catatanPenyewa: string
}

// ─────────────────────────────────────────────────────────────
// KALKULASI
// ─────────────────────────────────────────────────────────────
export const hitungTanggalSelesai = (
  mulai:  Date,
  tipe:   TipeKamar,
  durasi: number
): Date => {
  const selesai = new Date(mulai)
  if (tipe === 'harian')   selesai.setDate(selesai.getDate() + durasi)
  if (tipe === 'mingguan') selesai.setDate(selesai.getDate() + durasi * 7)
  if (tipe === 'bulanan')  selesai.setMonth(selesai.getMonth() + durasi)
  return selesai
}

export const hitungTotalHarga = (
  hargaSatuan: number,
  durasi:      number
): number => hargaSatuan * durasi

// ─────────────────────────────────────────────────────────────
// LABEL & COLOR
// ─────────────────────────────────────────────────────────────
export const labelTipe = (tipe: TipeKamar): string =>
  ({ harian: 'Harian', mingguan: 'Mingguan', bulanan: 'Bulanan' })[tipe] ?? tipe

export const satuanTipe = (tipe: TipeKamar): string =>
  ({ harian: 'hari', mingguan: 'minggu', bulanan: 'bulan' })[tipe] ?? tipe

export const labelStatus = (status: BookingStatus): string =>
  ({
    menunggu_pembayaran: 'Menunggu Pembayaran',
    sudah_dibayar:       'Sudah Dibayar',
    dikonfirmasi:        'Dikonfirmasi',
    aktif:               'Aktif',
    selesai:             'Selesai',
    dibatalkan:          'Dibatalkan',
    hangus:              'Hangus',
  })[status] ?? status

export const colorStatus = (status: BookingStatus): string =>
  ({
    menunggu_pembayaran: 'text-amber-600  bg-amber-50',
    sudah_dibayar:       'text-blue-600   bg-blue-50',
    dikonfirmasi:        'text-indigo-600 bg-indigo-50',
    aktif:               'text-green-600  bg-green-50',
    selesai:             'text-slate-600  bg-slate-100',
    dibatalkan:          'text-red-600    bg-red-50',
    hangus:              'text-orange-600 bg-orange-50',
  })[status] ?? 'text-slate-600 bg-slate-100'

// ─────────────────────────────────────────────────────────────
// MAPPING TipeHarga (listing) ↔ TipeKamar (booking)
// ─────────────────────────────────────────────────────────────
export const tipeHargaToTipeKamar = (t: TipeHarga): TipeKamar =>
  ({
    perhari:   'harian',
    perminggu: 'mingguan',
    perbulan:  'bulanan',
  } as Record<TipeHarga, TipeKamar>)[t] ?? 'bulanan'

export const tipeKamarToTipeHarga = (t: TipeKamar): TipeHarga =>
  ({
    harian:   'perhari',
    mingguan: 'perminggu',
    bulanan:  'perbulan',
  } as Record<TipeKamar, TipeHarga>)[t] ?? 'perbulan'

export const getHargaSatuan = (listing: Listing, tipe: TipeKamar): number => {
  if (tipe === 'harian')   return listing.hargaPerHari   ?? listing.harga
  if (tipe === 'mingguan') return listing.hargaPerMinggu ?? listing.harga * 4
  if (tipe === 'bulanan')  return listing.hargaPerBulan  ?? listing.harga
  return listing.harga
}

export const getTipeKamarTersedia = (listing: Listing): TipeKamar[] => {
  const tipes: TipeKamar[] = []
  if (listing.hargaPerHari   || listing.tipeHarga === 'perhari')   tipes.push('harian')
  if (listing.hargaPerMinggu || listing.tipeHarga === 'perminggu') tipes.push('mingguan')
  if (listing.hargaPerBulan  || listing.tipeHarga === 'perbulan')  tipes.push('bulanan')
  if (tipes.length === 0) tipes.push(tipeHargaToTipeKamar(listing.tipeHarga))
  return tipes
}

// ─────────────────────────────────────────────────────────────
// FORMAT TANGGAL
// ─────────────────────────────────────────────────────────────
export const formatTanggal = (ts: Timestamp | Date | null | undefined): string => {
  if (!ts) return '-'
  const d = ts instanceof Timestamp ? ts.toDate() : ts
  return d.toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

export const formatTanggalPendek = (ts: Timestamp | Date | null | undefined): string => {
  if (!ts) return '-'
  const d = ts instanceof Timestamp ? ts.toDate() : ts
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────
// GENERATE ORDER ID (untuk Midtrans)
// ─────────────────────────────────────────────────────────────
const generateOrderId = (bookingId: string): string =>
  `KK-${bookingId.slice(0, 8).toUpperCase()}-${Date.now()}`

// ─────────────────────────────────────────────────────────────
// CREATE BOOKING
// ─────────────────────────────────────────────────────────────
export const createBooking = async (
  input: CreateBookingInput
): Promise<string> => {
  // Sementara simpan dulu tanpa orderId
  const ref = await addDoc(collection(db, COL), {
    listingId:      input.listingId,
    listingNama:    input.listingNama,
    listingAlamat:  input.listingAlamat,
    penyewaId:      input.penyewaId,
    penyewaNama:    input.penyewaNama,
    penyewaEmail:   input.penyewaEmail,
    penyewaNoHp:    input.penyewaNoHp ?? '',
    pemilikId:      input.pemilikId,
    pemilikNama:    input.pemilikNama,
    tipeKamar:      input.tipeKamar,
    tanggalMulai:   Timestamp.fromDate(input.tanggalMulai),
    tanggalSelesai: Timestamp.fromDate(input.tanggalSelesai),
    durasi:         input.durasi,
    hargaSatuan:    input.hargaSatuan,
    totalHarga:     input.totalHarga,
    catatanPenyewa: input.catatanPenyewa,
    status:         'menunggu_pembayaran' as BookingStatus,
    pembayaran:     null,
    alasanBatal:    '',
    dibatalkanOleh: '',
    createdAt:      serverTimestamp(),
    updatedAt:      serverTimestamp(),
  })

  const bookingId = ref.id

  // Simpan orderId untuk Midtrans setelah dapat bookingId
  const orderId = generateOrderId(bookingId)
  await updateDoc(doc(db, COL, bookingId), { orderId })

  // Notif penyewa: booking berhasil dibuat
  const tmplPenyewa = notifTemplates.bookingDibuat(input.listingNama, bookingId)
  await sendNotification(
    input.penyewaId, 'booking_dibuat',
    tmplPenyewa.title, tmplPenyewa.body, tmplPenyewa.data
  )

  // Notif pemilik: ada booking masuk
  const tmplPemilik = notifTemplates.bookingMasuk(
    input.penyewaNama, input.listingNama, bookingId
  )
  await sendNotification(
    input.pemilikId, 'booking_masuk',
    tmplPemilik.title, tmplPemilik.body, tmplPemilik.data
  )

  return bookingId
}

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────
export const getBookingById = async (id: string): Promise<Booking | null> => {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Booking
}

export const getBookingsByPenyewa = async (penyewaId: string): Promise<Booking[]> => {
  const snap = await getDocs(query(
    collection(db, COL),
    where('penyewaId', '==', penyewaId),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
}

export const getBookingsByPemilik = async (pemilikId: string): Promise<Booking[]> => {
  const snap = await getDocs(query(
    collection(db, COL),
    where('pemilikId', '==', pemilikId),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
}

// ─────────────────────────────────────────────────────────────
// REALTIME LISTENERS
// ─────────────────────────────────────────────────────────────
export const listenBookingsByPenyewa = (
  penyewaId: string,
  callback:  (bookings: Booking[]) => void
) =>
  onSnapshot(
    query(
      collection(db, COL),
      where('penyewaId', '==', penyewaId),
      orderBy('createdAt', 'desc')
    ),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)))
  )

export const listenBookingsByPemilik = (
  pemilikId: string,
  callback:  (bookings: Booking[]) => void
) =>
  onSnapshot(
    query(
      collection(db, COL),
      where('pemilikId', '==', pemilikId),
      orderBy('createdAt', 'desc')
    ),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)))
  )

export const listenBookingById = (
  bookingId: string,
  callback:  (booking: Booking | null) => void
) =>
  onSnapshot(doc(db, COL, bookingId), snap => {
    if (!snap.exists()) { callback(null); return }
    callback({ id: snap.id, ...snap.data() } as Booking)
  })

// ─────────────────────────────────────────────────────────────
// UPDATE STATUS (generic)
// ─────────────────────────────────────────────────────────────
export const updateBookingStatus = async (
  id:     string,
  status: BookingStatus,
  extra?: Partial<Omit<Booking, 'id'>>
): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    status,
    ...extra,
    updatedAt: serverTimestamp(),
  })
}

// ─────────────────────────────────────────────────────────────
// AKSI SPESIFIK
// ─────────────────────────────────────────────────────────────

/**
 * Penyewa selesai bayar via Midtrans → update status + catat info pembayaran
 * Dipanggil dari onSuccess callback Midtrans Snap
 */
export const konfirmasiPembayaran = async (
  bookingId: string,
  booking:   Booking,
  pembayaran: PembayaranInfo
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:    'sudah_dibayar' as BookingStatus,
    pembayaran,
    updatedAt: serverTimestamp(),
  })

  // Notif penyewa: pembayaran berhasil, tunggu konfirmasi pemilik
  const tmplPenyewa = notifTemplates.pembayaranLunas(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'pembayaran_lunas',
    tmplPenyewa.title, tmplPenyewa.body, tmplPenyewa.data
  )

  // Notif pemilik: ada pembayaran masuk, perlu konfirmasi check-in
  const tmplPemilik = notifTemplates.pembayaranMasuk(
    booking.penyewaNama, booking.listingNama, bookingId
  )
  await sendNotification(
    booking.pemilikId, 'pembayaran_masuk',
    tmplPemilik.title, tmplPemilik.body, tmplPemilik.data
  )
}

/**
 * Pemilik konfirmasi check-in → status: dikonfirmasi → aktif
 * Dipanggil dari BookingMasukPage
 */
export const konfirmasiCheckin = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:        'dikonfirmasi' as BookingStatus,
    dikonfirmasiAt: serverTimestamp(),
    updatedAt:     serverTimestamp(),
  })

  // Notif penyewa: check-in dikonfirmasi
  const tmpl = notifTemplates.checkinDikonfirmasi(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'checkin_dikonfirmasi',
    tmpl.title, tmpl.body, tmpl.data
  )
}

/**
 * Sistem / pemilik set booking jadi aktif (saat penyewa sudah check-in fisik)
 */
export const aktivasiBooking = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:    'aktif' as BookingStatus,
    aktifAt:   serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const tmpl = notifTemplates.bookingAktif?.(booking.listingNama, bookingId) ?? {
    title: '🏠 Kamu sudah Check-in!',
    body:  `Selamat menempati ${booking.listingNama}. Semoga betah!`,
    data:  { bookingId, listingNama: booking.listingNama },
  }
  await sendNotification(
    booking.penyewaId, 'booking_aktif',
    tmpl.title, tmpl.body, tmpl.data
  )
}

/**
 * Sistem selesaikan booking saat tanggal checkout tercapai
 */
export const selesaikanBooking = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:    'selesai' as BookingStatus,
    selesaiAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Notif penyewa: booking selesai, minta review
  const tmpl = notifTemplates.bookingSelesai(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'booking_selesai',
    tmpl.title, tmpl.body, tmpl.data
  )

  // Notif pemilik: checkout terjadi
  await sendNotification(
    booking.pemilikId, 'checkout_penyewa',
    '📦 Penyewa Checkout',
    `${booking.penyewaNama} telah checkout dari ${booking.listingNama}.`,
    { bookingId, listingNama: booking.listingNama }
  )
}

/**
 * Pembatalan oleh penyewa atau pemilik
 * - Status sudah_dibayar → refund policy berlaku
 * - Status menunggu_pembayaran → bebas batal
 */
export const batalkanBooking = async (
  bookingId:    string,
  booking:      Booking,
  alasanBatal:  string,
  dibatalkanOleh: 'penyewa' | 'pemilik'
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:         'dibatalkan' as BookingStatus,
    alasanBatal,
    dibatalkanOleh,
    dibatalkanAt:   serverTimestamp(),
    updatedAt:      serverTimestamp(),
  })

  // Notif ke pihak yang tidak membatalkan
  const targetId   = dibatalkanOleh === 'penyewa' ? booking.pemilikId : booking.penyewaId
  const targetNama = dibatalkanOleh === 'penyewa' ? booking.pemilikNama : booking.penyewaNama
  const tmpl       = notifTemplates.bookingDibatalkan(booking.listingNama, alasanBatal, bookingId)
  await sendNotification(
    targetId, 'booking_dibatalkan',
    tmpl.title, tmpl.body, tmpl.data
  )

  // Notif ke yang membatalkan sebagai konfirmasi
  const pelakuId = dibatalkanOleh === 'penyewa' ? booking.penyewaId : booking.pemilikId
  await sendNotification(
    pelakuId, 'booking_batal_konfirmasi',
    '✅ Booking Berhasil Dibatalkan',
    `Booking ${booking.listingNama} telah dibatalkan.`,
    { bookingId, listingNama: booking.listingNama }
  )
}

/**
 * Sistem hanguskan booking jika lewat batas bayar (24 jam) tanpa pembayaran
 * atau tidak datang lebih dari 24 jam setelah tanggal mulai
 * Dipanggil dari Cloud Functions / cron job
 */
export const hanguskanBooking = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  const batch = writeBatch(db)
  batch.update(doc(db, COL, bookingId), {
    status:    'hangus' as BookingStatus,
    hangusAt:  serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  // Notif penyewa: booking hangus
  const tmplPenyewa = notifTemplates.bookingHangus(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'booking_hangus',
    tmplPenyewa.title, tmplPenyewa.body, tmplPenyewa.data
  )

  // Notif pemilik: booking hangus + info kompensasi 40%
  const kompensasi  = Math.floor(booking.totalHarga * 0.4)
  const tmplPemilik = notifTemplates.danaHangus(kompensasi, bookingId)
  await sendNotification(
    booking.pemilikId, 'dana_hangus_masuk',
    tmplPemilik.title, tmplPemilik.body, tmplPemilik.data
  )
}

// ─────────────────────────────────────────────────────────────
// QUERY UTILITY (untuk admin / dashboard)
// ─────────────────────────────────────────────────────────────

/** Semua booking dengan status tertentu — untuk admin atau cron job */
export const getBookingsByStatus = async (
  status: BookingStatus
): Promise<Booking[]> => {
  const snap = await getDocs(query(
    collection(db, COL),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
}

/** Cek booking aktif pada listing tertentu (untuk cek ketersediaan) */
export const getBookingAktifByListing = async (
  listingId: string
): Promise<Booking[]> => {
  const snap = await getDocs(query(
    collection(db, COL),
    where('listingId', '==', listingId),
    where('status', 'in', ['aktif', 'dikonfirmasi', 'sudah_dibayar']),
    orderBy('tanggalMulai', 'asc')
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
}

/** Listener booking aktif per listing — untuk pemilik cek penghuni saat ini */
export const listenBookingAktifByListing = (
  listingId: string,
  callback:  (bookings: Booking[]) => void
) =>
  onSnapshot(
    query(
      collection(db, COL),
      where('listingId', '==', listingId),
      where('status', 'in', ['aktif', 'dikonfirmasi']),
      orderBy('tanggalMulai', 'asc')
    ),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)))
  )

/** Total pendapatan pemilik dari booking selesai */
export const hitungPendapatanPemilik = async (
  pemilikId: string
): Promise<number> => {
  const bookings = await getBookingsByPemilik(pemilikId)
  return bookings
    .filter(b => b.status === 'selesai' || b.status === 'aktif')
    .reduce((sum, b) => sum + b.totalHarga, 0)
}
