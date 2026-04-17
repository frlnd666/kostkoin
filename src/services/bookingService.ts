import {
  collection, addDoc, getDoc, getDocs, doc,
  updateDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Timestamp,
  writeBatch
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
// KALKULASI & LABEL
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

export const labelTipe = (tipe: TipeKamar): string => ({
  harian:   'Harian',
  mingguan: 'Mingguan',
  bulanan:  'Bulanan',
})[tipe]

export const satuanTipe = (tipe: TipeKamar): string => ({
  harian:   'hari',
  mingguan: 'minggu',
  bulanan:  'bulan',
})[tipe]

// ─────────────────────────────────────────────────────────────
// MAPPING TipeHarga (listing) ↔ TipeKamar (booking)
// ─────────────────────────────────────────────────────────────
export const tipeHargaToTipeKamar = (t: TipeHarga): TipeKamar =>
  ({ perhari: 'harian', perminggu: 'mingguan', perbulan: 'bulanan' } as Record<TipeHarga, TipeKamar>)[t] ?? 'bulanan'

export const tipeKamarToTipeHarga = (t: TipeKamar): TipeHarga =>
  ({ harian: 'perhari', mingguan: 'perminggu', bulanan: 'perbulan' } as Record<TipeKamar, TipeHarga>)[t] ?? 'perbulan'

// Ambil harga satuan dari listing berdasarkan tipe booking
export const getHargaSatuan = (listing: Listing, tipe: TipeKamar): number => {
  if (tipe === 'harian')   return listing.hargaPerHari   ?? listing.harga
  if (tipe === 'mingguan') return listing.hargaPerMinggu ?? listing.harga * 4
  if (tipe === 'bulanan')  return listing.hargaPerBulan  ?? listing.harga
  return listing.harga
}

// Tipe kamar yang tersedia di listing ini
export const getTipeKamarTersedia = (listing: Listing): TipeKamar[] => {
  const tipes: TipeKamar[] = []
  if (listing.hargaPerHari   || listing.tipeHarga === 'perhari')   tipes.push('harian')
  if (listing.hargaPerMinggu || listing.tipeHarga === 'perminggu') tipes.push('mingguan')
  if (listing.hargaPerBulan  || listing.tipeHarga === 'perbulan')  tipes.push('bulanan')
  if (tipes.length === 0) tipes.push(tipeHargaToTipeKamar(listing.tipeHarga))
  return tipes
}

// ─────────────────────────────────────────────────────────────
// CREATE BOOKING
// ─────────────────────────────────────────────────────────────
export const createBooking = async (
  input: CreateBookingInput
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...input,
    tanggalMulai:   Timestamp.fromDate(input.tanggalMulai),
    tanggalSelesai: Timestamp.fromDate(input.tanggalSelesai),
    status:         'menunggu_pembayaran' as BookingStatus,
    pembayaran:     null,
    alasanBatal:    '',
    createdAt:      serverTimestamp(),
    updatedAt:      serverTimestamp(),
  })

  const bookingId = ref.id

  const tmplPenyewa = notifTemplates.bookingDibuat(input.listingNama, bookingId)
  await sendNotification(
    input.penyewaId, 'booking_dibuat',
    tmplPenyewa.title, tmplPenyewa.body, tmplPenyewa.data
  )

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
export const listenBookingsByPemilik = (
  pemilikId: string,
  callback:  (bookings: Booking[]) => void
) =>
  onSnapshot(
    query(collection(db, COL), where('pemilikId', '==', pemilikId), orderBy('createdAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)))
  )

export const listenBookingsByPenyewa = (
  penyewaId: string,
  callback:  (bookings: Booking[]) => void
) =>
  onSnapshot(
    query(collection(db, COL), where('penyewaId', '==', penyewaId), orderBy('createdAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)))
  )

// Listener 1 booking spesifik (untuk halaman detail booking)
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
  extra?: Partial<Booking>
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

// Penyewa upload bukti bayar
export const konfirmasiPembayaran = async (
  bookingId:  string,
  booking:    Booking,
  pembayaran: PembayaranInfo
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:    'sudah_dibayar' as BookingStatus,
    pembayaran,
    updatedAt: serverTimestamp(),
  })

  const tmpl = notifTemplates.pembayaranLunas(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'pembayaran_lunas',
    tmpl.title, tmpl.body, tmpl.data
  )
}

// Pemilik konfirmasi check-in
export const konfirmasiCheckin = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:    'aktif' as BookingStatus,
    updatedAt: serverTimestamp(),
  })

  const tmpl = notifTemplates.checkinDikonfirmasi(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'checkin_dikonfirmasi',
    tmpl.title, tmpl.body, tmpl.data
  )
}

// Pemilik / sistem selesaikan booking
export const selesaikanBooking = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:    'selesai' as BookingStatus,
    updatedAt: serverTimestamp(),
  })

  const tmpl = notifTemplates.bookingSelesai(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'booking_selesai',
    tmpl.title, tmpl.body, tmpl.data
  )
}

// Batal oleh penyewa atau pemilik
export const batalkanBooking = async (
  bookingId:   string,
  booking:     Booking,
  alasanBatal: string,
  batalOleh:   'penyewa' | 'pemilik'
): Promise<void> => {
  await updateDoc(doc(db, COL, bookingId), {
    status:      'dibatalkan' as BookingStatus,
    alasanBatal,
    updatedAt:   serverTimestamp(),
  })

  const targetId = batalOleh === 'penyewa' ? booking.pemilikId : booking.penyewaId
  await sendNotification(
    targetId, 'booking_hangus',
    '❌ Booking Dibatalkan',
    `Booking ${booking.listingNama} telah dibatalkan. Alasan: ${alasanBatal}`,
    { bookingId }
  )
}

// Hangus: tidak datang lebih dari 24 jam setelah tanggal mulai
export const hanguskanBooking = async (
  bookingId: string,
  booking:   Booking
): Promise<void> => {
  const batch = writeBatch(db)
  batch.update(doc(db, COL, bookingId), {
    status:    'hangus' as BookingStatus,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  const tmplPenyewa = notifTemplates.bookingHangus(booking.listingNama, bookingId)
  await sendNotification(
    booking.penyewaId, 'booking_hangus',
    tmplPenyewa.title, tmplPenyewa.body, tmplPenyewa.data
  )

  const kompensasi  = Math.floor(booking.totalHarga * 0.4)
  const tmplPemilik = notifTemplates.danaHangus(kompensasi, bookingId)
  await sendNotification(
    booking.pemilikId, 'dana_hangus_masuk',
    tmplPemilik.title, tmplPemilik.body, tmplPemilik.data
  )
}

// ─────────────────────────────────────────────────────────────
// HELPERS: STATUS
// ─────────────────────────────────────────────────────────────
export const labelStatus = (status: BookingStatus): string => ({
  menunggu_pembayaran: 'Menunggu Pembayaran',
  sudah_dibayar:       'Sudah Dibayar',
  dikonfirmasi:        'Dikonfirmasi',
  aktif:               'Aktif',
  selesai:             'Selesai',
  dibatalkan:          'Dibatalkan',
  hangus:              'Hangus',
})[status] ?? status

export const colorStatus = (status: BookingStatus): string => ({
  menunggu_pembayaran: 'text-amber-600 bg-amber-50',
  sudah_dibayar:       'text-blue-600 bg-blue-50',
  dikonfirmasi:        'text-indigo-600 bg-indigo-50',
  aktif:               'text-green-600 bg-green-50',
  selesai:             'text-slate-600 bg-slate-100',
  dibatalkan:          'text-red-600 bg-red-50',
  hangus:              'text-orange-600 bg-orange-50',
})[status] ?? 'text-slate-600 bg-slate-100'

// ─────────────────────────────────────────────────────────────
// HELPERS: FORMAT TANGGAL
// ─────────────────────────────────────────────────────────────
export const formatTanggal = (ts: Timestamp | null | undefined): string => {
  if (!ts) return '-'
  return ts.toDate().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export const formatTanggalPendek = (ts: Timestamp | null | undefined): string => {
  if (!ts) return '-'
  return ts.toDate().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
