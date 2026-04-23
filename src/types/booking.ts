import type { Timestamp } from 'firebase/firestore'


export type TipeKamar = 'harian' | 'mingguan' | 'bulanan'

export type BookingStatus =
  | 'menunggu_pembayaran'
  | 'sudah_dibayar'
  | 'dikonfirmasi'
  | 'aktif'
  | 'selesai'
  | 'dibatalkan'
  | 'hangus'

export interface PembayaranInfo {
  metode:         string
  orderId:        string
  transactionId?: string
  dibayarAt:      Timestamp
  buktiUrl?:      string
}

export interface Booking {
  id:              string
  listingId:       string
  listingNama:     string
  listingAlamat:   string
  penyewaId:       string
  penyewaNama:     string
  penyewaEmail:    string
  penyewaNoHp:     string
  pemilikId:       string
  pemilikNama:     string
  tipeKamar:       TipeKamar
  tanggalMulai:    Timestamp
  tanggalSelesai:  Timestamp
  durasi:          number
  hargaSatuan:     number
  totalHarga:      number
  orderId:         string
  catatanPenyewa:  string
  status:          BookingStatus
  pembayaran:      PembayaranInfo | null
  alasanBatal:     string
  dibatalkanOleh:  'penyewa' | 'pemilik' | ''
  dibatalkanAt?:   Timestamp
  dikonfirmasiAt?: Timestamp
  aktifAt?:        Timestamp
  selesaiAt?:      Timestamp
  hangusAt?:       Timestamp
  createdAt:       Timestamp
  updatedAt:       Timestamp
}
