import { PLATFORM_FEE_PENYEWA, PLATFORM_FEE_PEMILIK } from '../constants'

export interface FeeCalculation {
  subtotal:      number
  feePenyewa:    number
  totalBayar:    number
  feePemilik:    number
  pemilikDapat:  number
  platformDapat: number
}

export const calculateFee = (harga: number, durasi: number): FeeCalculation => {
  const subtotal      = harga * durasi
  const feePenyewa    = Math.round(subtotal * PLATFORM_FEE_PENYEWA)
  const totalBayar    = subtotal + feePenyewa
  const feePemilik    = Math.round(subtotal * PLATFORM_FEE_PEMILIK)
  const pemilikDapat  = subtotal - feePemilik
  const platformDapat = feePenyewa + feePemilik

  return { subtotal, feePenyewa, totalBayar, feePemilik, pemilikDapat, platformDapat }
}
 
