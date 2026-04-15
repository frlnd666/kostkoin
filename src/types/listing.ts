export type ListingStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'inactive'

export type TipeHarga = 'perhari' | 'perbulan'

export interface Listing {
  id:          string
  nama:        string
  alamat:      string
  kota:        string
  harga:       number
  tipeHarga:   TipeHarga     // ← tambah ini
  deskripsi:   string
  fasilitas:   string[]
  foto:        string[]
  pemilikId:   string
  pemilikNama: string
  status:      ListingStatus
  createdAt:   any
}
