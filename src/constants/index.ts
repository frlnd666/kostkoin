 
export const PLATFORM_FEE_PENYEWA = 0.05
export const PLATFORM_FEE_PEMILIK = 0.10

export const BANTEN_KOTA_KABUPATEN = [
  'Kota Serang',
  'Kota Cilegon',
  'Kota Tangerang',
  'Kota Tangerang Selatan',
  'Kabupaten Serang',
  'Kabupaten Pandeglang',
  'Kabupaten Lebak',
  'Kabupaten Tangerang',
]

export const KECAMATAN_BANTEN: Record<string, string[]> = {
  'Kota Serang': ['Serang', 'Cipocok Jaya', 'Curug', 'Kasemen', 'Taktakan', 'Walantaka'],
  'Kota Cilegon': ['Cilegon', 'Cibeber', 'Citangkil', 'Ciwandan', 'Grogol', 'Jombang', 'Pulomerak', 'Purwakarta'],
  'Kota Tangerang': ['Batuceper', 'Benda', 'Cibodas', 'Ciledug', 'Cipondoh', 'Jatiuwung', 'Karangtengah', 'Karawaci', 'Larangan', 'Neglasari', 'Periuk', 'Pinang', 'Tangerang'],
  'Kota Tangerang Selatan': ['Ciputat', 'Ciputat Timur', 'Pamulang', 'Pondok Aren', 'Serpong', 'Serpong Utara', 'Setu'],
  'Kabupaten Serang': ['Anyar', 'Baros', 'Bandung', 'Binuang', 'Bojonegara', 'Carenang', 'Cikeusal', 'Cinangka', 'Ciomas', 'Ciruas', 'Kramatwatu', 'Pabuaran', 'Padarincang', 'Pontang', 'Tanara', 'Tirtayasa'],
  'Kabupaten Pandeglang': ['Carita', 'Cimanuk', 'Labuan', 'Majasari', 'Mandalawangi', 'Menes', 'Pandeglang', 'Saketi', 'Sumur'],
  'Kabupaten Lebak': ['Bayah', 'Cibadak', 'Cipanas', 'Leuwidamar', 'Maja', 'Malingping', 'Rangkasbitung', 'Warunggunung'],
  'Kabupaten Tangerang': ['Balaraja', 'Cisauk', 'Curug', 'Kelapa Dua', 'Kosambi', 'Legok', 'Pagedangan', 'Pasar Kemis', 'Serpong', 'Tigaraksa'],
}

export const TIPE_PROPERTI  = ['Kost', 'Kontrakan'] as const
export const TIPE_SEWA      = ['Per Jam', 'Per Hari', 'Per Bulan'] as const

export const FASILITAS_LIST = [
  'AC', 'WiFi', 'Kamar Mandi Dalam', 'Kamar Mandi Luar',
  'Kasur', 'Lemari', 'Meja', 'Kursi', 'TV', 'Dapur',
  'Parkir Motor', 'Parkir Mobil', 'Laundry', 'CCTV', 'Security 24 Jam',
]

export const APP_NAME    = 'KostKoin'
export const APP_TAGLINE = 'Sewa Kost & Kontrakan Murah Per Jam di Banten'
