export type BookingStatus = 'pending' | 'paid' | 'active' | 'done' | 'cancelled'

export interface Booking {
  id:             string
  listingId:      string
  listingNama:    string
  listingAlamat:  string
  penyewaId:      string
  penyewaNama:    string
  penyewaEmail:   string
  penyewaNoHp:    string
  pemilikId:      string
  harga:          number
  durasi:         number
  totalHarga:     number
  tanggalMulai:   string
  tanggalSelesai: string
  status:         BookingStatus
  snapToken?:     string
  orderId?:       string
  createdAt:      any
}
