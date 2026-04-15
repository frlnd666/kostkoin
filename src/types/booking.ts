export type BookingStatus = 'pending' | 'paid' | 'active' | 'done' | 'cancelled'

export type TipeHarga = 'perhari' | 'perbulan'

export interface Booking {
  id:             string
  listingId:      string
  listingNama:    string
  listingAlamat:  string

  // Penyewa
  penyewaId:      string
  penyewaNama:    string
  penyewaEmail:   string
  penyewaNoHp:    string

  // Pemilik
  pemilikId:      string

  // Harga & Durasi
  harga:          number        // harga dasar dari listing (per hari/bulan)
  tipeHarga:      TipeHarga     // 'perhari' | 'perbulan'
  durasi:         number        // jumlah hari atau bulan

  // Rincian biaya (transparan)
  subtotal:       number        // harga × durasi
  biayaLayanan:   number        // 10% dari subtotal
  biayaMidtrans:  number        // Rp 4.000
  totalHarga:     number        // subtotal + biayaLayanan + biayaMidtrans

  // Tanggal
  tanggalMulai:   string        // YYYY-MM-DD
  tanggalSelesai: string        // YYYY-MM-DD

  // Status & Payment
  status:         BookingStatus
  snapToken?:     string
  orderId?:       string

  createdAt:      any
}
