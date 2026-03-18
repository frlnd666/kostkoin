export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatTanggal = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })
}
