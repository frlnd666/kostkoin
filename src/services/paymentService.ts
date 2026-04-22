const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const createSnapToken = async (payload: {
  bookingId:    string
  orderId:      string
  totalHarga:   number
  penyewaNama:  string
  penyewaEmail: string
  penyewaNoHp:  string
}): Promise<string> => {
  const res  = await fetch(`${BACKEND_URL}/api/payment/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Gagal membuat token pembayaran')
  return data.token
}

export const checkPaymentStatus = async (orderId: string): Promise<string> => {
  // ✅ Tambahkan BACKEND_URL — sebelumnya relative URL, hit Vercel bukan backend
  const res  = await fetch(`${BACKEND_URL}/api/payment/status/${orderId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Gagal cek status')
  return data.status
}
