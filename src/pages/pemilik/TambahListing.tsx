// src/pages/pemilik/TambahListing.tsx

import { memo, useState, useEffect, useRef } from 'react'
import { useNavigate }                        from 'react-router-dom'
import { useForm }                            from 'react-hook-form'
import { ImagePlus, X, AlertCircle, CheckCircle, MapPin, Navigation } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import { addListing }        from '../../services/listingService'
import { uploadFotoListing } from '../../services/storageService'
import { useAuthStore }      from '../../store/authStore'

/* ─────────────────────── CONSTANTS ─────────────────────── */

const KOTA_BANTEN = [
  'Kota Serang', 'Kota Tangerang', 'Kota Tangerang Selatan',
  'Kota Cilegon', 'Kabupaten Serang', 'Kabupaten Tangerang',
  'Kabupaten Lebak', 'Kabupaten Pandeglang',
]

const FASILITAS_UMUM = [
  'WiFi', 'AC', 'Kamar Mandi Dalam', 'Kamar Mandi Luar',
  'Parkir Motor', 'Parkir Mobil', 'Dapur', 'Lemari',
  'Kasur', 'Meja Belajar', 'TV', 'Listrik Token',
]

const FOTO_LABELS = [
  { key: 'kamar',        label: 'Foto Isi Kamar',    desc: 'Tampilkan kondisi kamar secara keseluruhan' },
  { key: 'tempat_tidur', label: 'Foto Tempat Tidur', desc: 'Tampilkan kondisi tempat tidur' },
  { key: 'fasilitas',    label: 'Foto Fasilitas',    desc: 'Tampilkan fasilitas yang tersedia' },
] as const

/* ─────────────────────── TYPES ─────────────────────── */

interface FotoState {
  kamar:        File | null
  tempat_tidur: File | null
  fasilitas:    File | null
}

interface FormData {
  nama:        string
  alamat:      string
  kota:        string
  tipeHarga:   'perhari' | 'perbulan'
  harga:       number
  deskripsi:   string
  fasilitas:   string
}

/* ─────────────────────── LOCATION PICKER ─────────────────────── */

interface LocationPickerProps {
  lat?:     number
  lng?:     number
  onChange: (lat: number, lng: number) => void
}

const LocationPicker = memo(({ lat, lng, onChange }: LocationPickerProps) => {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)
  const markerRef   = useRef<unknown>(null)
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [loadingGPS, setLoadingGPS] = useState(false)
  const [leafletReady, setLeafletReady] = useState(false)

  // Default center: tengah Banten
  const defaultLat = lat ?? -6.1201
  const defaultLng = lng ?? 106.1504

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS jika belum ada
    if ((window as { L?: unknown }).L) {
      setLeafletReady(true)
      return
    }
    const script  = document.createElement('script')
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L

    const map = L.map(mapRef.current, { zoomControl: true })
      .setView([defaultLat, defaultLng], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const makeIcon = () => L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;
        border-radius:50% 50% 50% 0;
        background:#f59e0b;
        border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        transform:rotate(-45deg);
      "></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    })

    const addMarker = (cLat: number, cLng: number) => {
      if (markerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (markerRef.current as any).setLatLng([cLat, cLng])
      } else {
        markerRef.current = L.marker([cLat, cLng], {
          icon: makeIcon(), draggable: true,
        }).addTo(map)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(markerRef.current as any).on('dragend', () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pos = (markerRef.current as any).getLatLng()
          setCoords({ lat: pos.lat, lng: pos.lng })
          onChange(pos.lat, pos.lng)
        })
      }
      setCoords({ lat: cLat, lng: cLng })
      onChange(cLat, cLng)
    }

    // Jika sudah ada koordinat awal, pasang marker
    if (lat && lng) addMarker(lat, lng)

    // Klik peta → pindahkan marker
    map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      addMarker(e.latlng.lat, e.latlng.lng)
    })

    mapInstance.current = map

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mapInstance.current) (mapInstance.current as any).remove()
      mapInstance.current = null
      markerRef.current   = null
    }
  }, [leafletReady])

  const handleGPS = () => {
    if (!navigator.geolocation) return
    setLoadingGPS(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!mapInstance.current) { setLoadingGPS(false); return }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstance.current as any).setView([latitude, longitude], 17)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L
        if (markerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(markerRef.current as any).setLatLng([latitude, longitude])
        } else {
          markerRef.current = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: '',
              html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#f59e0b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
              iconSize: [28, 28], iconAnchor: [14, 28],
            }),
            draggable: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).addTo(mapInstance.current as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(markerRef.current as any).on('dragend', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = (markerRef.current as any).getLatLng()
            setCoords({ lat: p.lat, lng: p.lng })
            onChange(p.lat, p.lng)
          })
        }
        setCoords({ lat: latitude, lng: longitude })
        onChange(latitude, longitude)
        setLoadingGPS(false)
      },
      () => setLoadingGPS(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Tombol GPS */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={loadingGPS}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold text-blue-600 transition-colors disabled:opacity-50 w-fit"
      >
        <Navigation size={13} className={loadingGPS ? 'animate-spin' : ''} />
        {loadingGPS ? 'Mendeteksi lokasi...' : 'Gunakan Lokasi Saya (GPS)'}
      </button>

      {/* Peta */}
      {!leafletReady ? (
        <div className="h-56 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm border border-slate-200">
          Memuat peta...
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div ref={mapRef} style={{ height: '240px', width: '100%' }} />
        </div>
      )}

      {/* Keterangan */}
      {coords ? (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-2 rounded-xl">
          <CheckCircle size={12} />
          Lokasi ditandai: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          <MapPin size={12} />
          Klik peta untuk menandai lokasi kost, atau gunakan GPS di atas
        </div>
      )}
    </div>
  )
})

LocationPicker.displayName = 'LocationPicker'

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

const TambahListing = memo(() => {
  const navigate        = useNavigate()
  const { user }        = useAuthStore()
  const [foto, setFoto] = useState<FotoState>({ kamar: null, tempat_tidur: null, fasilitas: null })
  const [preview, setPreview]                   = useState<Record<string, string>>({})
  const [fasilitasPilihan, setFasilitasPilihan] = useState<string[]>([])
  const [koordinat, setKoordinat]               = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { tipeHarga: 'perbulan' }
  })

  const tipeHarga         = watch('tipeHarga')
  const hargaMin          = tipeHarga === 'perhari' ? 10_000   : 250_000
  const hargaLabel        = tipeHarga === 'perhari' ? 'Hari'   : 'Bulan'
  const hargaPlaceholder  = tipeHarga === 'perhari' ? '50000'  : '500000'

  const handleFoto = (key: keyof FotoState, file: File | null) => {
    setFoto(prev => ({ ...prev, [key]: file }))
    if (file) {
      setPreview(prev => ({ ...prev, [key]: URL.createObjectURL(file) }))
    } else {
      setPreview(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  const toggleFasilitas = (item: string) => {
    setFasilitasPilihan(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    )
  }

  const onSubmit = async (data: FormData) => {
    if (!user) { navigate('/login'); return }

    if (!foto.kamar || !foto.tempat_tidur || !foto.fasilitas) {
      setError('Semua foto wajib diisi (kamar, tempat tidur, dan fasilitas)')
      return
    }

    if (!koordinat) {
      setError('Tentukan lokasi kost di peta terlebih dahulu')
      return
    }

    const fasilitasManual = data.fasilitas
      ? data.fasilitas.split(',').map(f => f.trim()).filter(Boolean)
      : []
    const allFasilitas = [...new Set([...fasilitasPilihan, ...fasilitasManual])]

    if (allFasilitas.length === 0) {
      setError('Tambahkan minimal 1 fasilitas')
      return
    }

    setLoading(true)
    setError('')

    try {
      const urls = await uploadFotoListing(
        { kamar: foto.kamar, tempat_tidur: foto.tempat_tidur, fasilitas: foto.fasilitas },
        user.uid
      )

      await addListing({
        nama:        data.nama,
        alamat:      data.alamat,
        kota:        data.kota,
        tipeHarga:   data.tipeHarga,
        harga:       Number(data.harga),
        deskripsi:   data.deskripsi,
        fasilitas:   allFasilitas,
        foto:        [urls.kamar, urls.tempat_tidur, urls.fasilitas],
        pemilikId:   user.uid,
        pemilikNama: user.nama,
        lat:         koordinat.lat,   // ← koordinat peta
        lng:         koordinat.lng,   // ← koordinat peta
      }, user.uid)

      navigate('/pemilik/dashboard')
    } catch (e) {
      console.error(e)
      setError('Gagal menambah listing, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tambah Listing Kost</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* ── Informasi Kost ── */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-700 mb-4">Informasi Kost</h3>
          <div className="flex flex-col gap-3">

            {/* Nama */}
            <div>
              <label htmlFor="nama" className="text-sm font-medium text-slate-600 mb-1 block">
                Nama Kost
              </label>
              <input
                id="nama"
                {...register('nama', { required: 'Nama kost wajib diisi' })}
                placeholder="Kost Melati Indah"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>}
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor="alamat" className="text-sm font-medium text-slate-600 mb-1 block">
                Alamat Lengkap
              </label>
              <input
                id="alamat"
                {...register('alamat', { required: 'Alamat wajib diisi' })}
                placeholder="Jl. Melati No. 10, Kel. Cipocok Jaya"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {errors.alamat && <p className="text-red-500 text-xs mt-1">{errors.alamat.message}</p>}
            </div>

            {/* Kota Banten */}
            <div>
              <label htmlFor="kota" className="text-sm font-medium text-slate-600 mb-1 block">
                Kota / Kabupaten
              </label>
              <select
                id="kota"
                {...register('kota', { required: 'Kota wajib dipilih' })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Pilih Kota/Kabupaten di Banten</option>
                {KOTA_BANTEN.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              {errors.kota && <p className="text-red-500 text-xs mt-1">{errors.kota.message}</p>}
            </div>

            {/* Tipe Harga */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Tipe Harga Sewa
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['perhari', 'perbulan'] as const).map(tipe => (
                  <label
                    key={tipe}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      tipeHarga === tipe
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-amber-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={tipe}
                      {...register('tipeHarga', { required: true })}
                      className="sr-only"
                    />
                    <span className="text-lg mb-0.5">{tipe === 'perhari' ? '📅' : '🗓️'}</span>
                    <span className={`text-sm font-semibold ${tipeHarga === tipe ? 'text-amber-600' : 'text-slate-700'}`}>
                      Per {tipe === 'perhari' ? 'Hari' : 'Bulan'}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      min. {tipe === 'perhari' ? 'Rp 10.000' : 'Rp 250.000'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Harga */}
            <div>
              <label htmlFor="harga" className="text-sm font-medium text-slate-600 mb-1 block">
                Harga / {hargaLabel} (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">Rp</span>
                <input
                  id="harga"
                  type="number"
                  {...register('harga', {
                    required: 'Harga wajib diisi',
                    min: {
                      value:   hargaMin,
                      message: `Harga minimal Rp ${hargaMin.toLocaleString('id-ID')} per ${hargaLabel.toLowerCase()}`,
                    },
                  })}
                  placeholder={hargaPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              {errors.harga && <p className="text-red-500 text-xs mt-1">{errors.harga.message}</p>}
              <p className="text-xs text-slate-400 mt-1">
                * Harga yang dibayar penyewa = harga kamu + biaya layanan 10% + Rp 4.000
              </p>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="deskripsi" className="text-sm font-medium text-slate-600 mb-1 block">
                Deskripsi
              </label>
              <textarea
                id="deskripsi"
                {...register('deskripsi', { required: 'Deskripsi wajib diisi' })}
                rows={3}
                placeholder="Deskripsikan kost kamu: lokasi strategis, suasana, dll..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi.message}</p>}
            </div>

          </div>
        </Card>

        {/* ── Lokasi Kost (Peta) ── */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin size={15} className="text-amber-400" />
            Lokasi Kost di Peta <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Tandai posisi kost secara akurat agar penyewa bisa menemukannya
          </p>
          <LocationPicker
            lat={koordinat?.lat}
            lng={koordinat?.lng}
            onChange={(lat, lng) => setKoordinat({ lat, lng })}
          />
        </Card>

        {/* ── Fasilitas ── */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-700 mb-3">Fasilitas</h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {FASILITAS_UMUM.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleFasilitas(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  fasilitasPilihan.includes(item)
                    ? 'bg-amber-400 border-amber-400 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="fasilitas" className="text-xs text-slate-400 mb-1 block">
              Fasilitas lainnya (opsional, pisahkan dengan koma)
            </label>
            <input
              id="fasilitas"
              {...register('fasilitas')}
              placeholder="Kulkas, Water Heater, dll"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {fasilitasPilihan.length > 0 && (
            <p className="text-xs text-green-600 mt-2">
              ✓ {fasilitasPilihan.length} fasilitas dipilih: {fasilitasPilihan.join(', ')}
            </p>
          )}
        </Card>

        {/* ── Foto Kost ── */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-700 mb-1">
            Foto Kost <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Semua foto wajib diisi (maks 5MB per foto)</p>

          <div className="flex flex-col gap-4">
            {FOTO_LABELS.map(({ key, label, desc }) => (
              <div key={key}>
                <p className="text-sm font-medium text-slate-600 mb-0.5 flex items-center gap-1.5">
                  {label}
                  {foto[key] ? (
                    <CheckCircle size={13} className="text-green-500" />
                  ) : (
                    <span className="text-red-400 text-xs">wajib</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mb-2">{desc}</p>

                {preview[key] ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden">
                    <img src={preview[key]} alt={label} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleFoto(key, null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                    <ImagePlus size={24} className="text-slate-300 mb-2" />
                    <span className="text-xs text-slate-400">Klik untuk upload foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFoto(key, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? 'Mengupload & menyimpan...' : 'Tambah Listing'}
        </Button>

      </form>
    </main>
  )
})

TambahListing.displayName = 'TambahListing'
export default TambahListing
