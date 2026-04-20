// src/types/listing.ts

export type ListingStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'inactive'

export type TipeHarga = 'perhari' | 'perminggu' | 'perbulan'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt:   any

  // Harga
  harga:           number
  tipeHarga:       TipeHarga
  hargaPerHari?:   number
  hargaPerMinggu?: number
  hargaPerBulan?:  number

  // Koordinat peta (opsional — diisi saat tambah/edit listing)
  lat?: number
  lng?: number
}
