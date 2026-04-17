export type ListingStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'inactive'

// Tipe harga yang didukung per listing
export type TipeHarga = 'perhari' | 'perminggu' | 'perbulan'
// ↑ tambah 'perminggu' — kalau tidak mau, hapus saja dan sesuaikan di BookingPage

export interface Listing {
  id:          string
  nama:        string
  alamat:      string
  kota:        string
  deskripsi:   string
  fasilitas:   string[]
  foto:        string[]
  pemilikId:   string
  pemilikNama: string
  status:      ListingStatus
  createdAt:   any

  // ── Harga ───────────────────────────────────────────────────
  harga:       number       // harga utama (backward compat — tetap ada)
  tipeHarga:   TipeHarga    // tipe default listing

  // Harga per tipe (opsional — diisi jika listing support multi tipe)
  hargaPerHari?:    number
  hargaPerMinggu?:  number
  hargaPerBulan?:   number
}
