export type ListingStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'inactive'

export interface Listing {
  id:          string
  nama:        string
  alamat:      string
  kota:        string
  harga:       number
  deskripsi:   string
  fasilitas:   string[]
  foto:        string[]
  pemilikId:   string
  pemilikNama: string
  status:      ListingStatus
  createdAt:   any
}
