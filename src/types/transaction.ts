export type TipeTransaksi = 'booking' | 'refund' | 'withdrawal'

export interface Transaction {
  id:            string
  bookingId:     string
  penyewaId:     string
  pemilikId:     string
  totalBayar:    number
  feePenyewa:    number
  feePemilik:    number
  platformDapat: number
  pemilikDapat:  number
  tipe:          TipeTransaksi
  createdAt:     Date
}
 
