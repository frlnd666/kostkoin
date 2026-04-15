import { memo, useState }  from 'react'
import { useNavigate }     from 'react-router-dom'
import { useForm }         from 'react-hook-form'
import { ImagePlus, X, AlertCircle, CheckCircle } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import { addListing }        from '../../services/listingService'
import { uploadFotoListing } from '../../services/storageService'
import { useAuthStore }      from '../../store/authStore'

const KOTA_BANTEN = [
  'Kota Serang',
  'Kota Tangerang',
  'Kota Tangerang Selatan',
  'Kota Cilegon',
  'Kabupaten Serang',
  'Kabupaten Tangerang',
  'Kabupaten Lebak',
  'Kabupaten Pandeglang',
]

const FASILITAS_UMUM = [
  'WiFi', 'AC', 'Kamar Mandi Dalam', 'Kamar Mandi Luar',
  'Parkir Motor', 'Parkir Mobil', 'Dapur', 'Lemari',
  'Kasur', 'Meja Belajar', 'TV', 'Listrik Token',
]

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

const FOTO_LABELS = [
  { key: 'kamar',        label: 'Foto Isi Kamar',    desc: 'Tampilkan kondisi kamar secara keseluruhan' },
  { key: 'tempat_tidur', label: 'Foto Tempat Tidur', desc: 'Tampilkan kondisi tempat tidur' },
  { key: 'fasilitas',    label: 'Foto Fasilitas',    desc: 'Tampilkan fasilitas yang tersedia' },
] as const

const TambahListing = memo(() => {
  const navigate        = useNavigate()
  const { user }        = useAuthStore()
  const [foto, setFoto] = useState<FotoState>({ kamar: null, tempat_tidur: null, fasilitas: null })
  const [preview, setPreview]                   = useState<Record<string, string>>({})
  const [fasilitasPilihan, setFasilitasPilihan] = useState<string[]>([])
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { tipeHarga: 'perbulan' }
  })

  const tipeHarga = watch('tipeHarga')

  const hargaMin    = tipeHarga === 'perhari' ? 10_000   : 250_000
  const hargaLabel  = tipeHarga === 'perhari' ? 'Hari'   : 'Bulan'
  const hargaPlaceholder = tipeHarga === 'perhari' ? '50000'  : '500000'

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
                {KOTA_BANTEN.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
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
                    <span className="text-lg mb-0.5">
                      {tipe === 'perhari' ? '📅' : '🗓️'}
                    </span>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                  Rp
                </span>
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
