import type { Timestamp } from 'firebase/firestore'

export type TipeKamar  = 'harian' | 'mingguan' | 'bulanan'

export type BookingStatus =
  | 'menunggu_pembayaran'
  | 'sudah_dibayar'
  | 'dikonfirmasi'
  | 'aktif'
  | 'selesai'
  | 'dibatalkan'
  | 'hangus'

export interface PembayaranInfo {
  metode:    string       // 'transfer_bank' | 'ewallet' | 'tunai'
  buktiUrl:  string       // URL foto bukti transfer
  dibayarAt: Timestamp
}

export interface Booking {
  id:             string
  listingId:      string
  listingNama:    string
  listingAlamat:  string
  penyewaId:      string
  penyewaNama:    string
  penyewaEmail:   string
  pemilikId:      string
  pemilikNama:    string

  tipeKamar:      TipeKamar
  tanggalMulai:   Timestamp
  tanggalSelesai: Timestamp
  durasi:         number      // jumlah hari/minggu/bulan
  hargaSatuan:    number      // harga per periode
  totalHarga:     number      // hargaSatuan × durasi

  status:         BookingStatus
  pembayaran:     PembayaranInfo | null

  catatanPenyewa: string      // pesan/catatan saat booking
  alasanBatal:    string      // diisi jika dibatalkan/ditolak

  createdAt:      Timestamp
  updatedAt:      Timestamp
}

// Untuk tipe data di Listing (update listing type juga)
export interface HargaTipe {
  harian?:   number
  mingguan?: number
  bulanan?:  number
}
