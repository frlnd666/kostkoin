import { memo, useState } from 'react'
import { useNavigate }    from 'react-router-dom'
import { useForm }        from 'react-hook-form'
import { ImagePlus, X, AlertCircle, CheckCircle } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Button  from '../../components/ui/Button'
import { addListing }            from '../../services/listingService'
import { uploadFotoListing }     from '../../services/storageService'
import { useAuthStore }          from '../../store/authStore'

interface FotoState {
  kamar:        File | null
  tempat_tidur: File | null
  fasilitas:    File | null
}

interface FormData {
  nama:      string
  alamat:    string
  kota:      string
  harga:     number
  deskripsi: string
  fasilitas: string
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
  const [preview, setPreview] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const handleFoto = (key: keyof FotoState, file: File | null) => {
    setFoto(prev => ({ ...prev, [key]: file }))
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(prev => ({ ...prev, [key]: url }))
    } else {
      setPreview(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  const onSubmit = async (data: FormData) => {
    console.log('=== SUBMIT START ===')
    console.log('USER:', user)

    if (!user) {
      console.log('❌ User null, redirect login')
      navigate('/login')
      return
    }

    if (!foto.kamar || !foto.tempat_tidur || !foto.fasilitas) {
      console.log('❌ Foto belum lengkap:', foto)
      setError('Semua foto wajib diisi (kamar, tempat tidur, dan fasilitas)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userId = user.uid
      console.log('✅ userId:', userId)
      console.log('📸 Mulai upload foto ke Cloudinary...')

      const urls = await uploadFotoListing(
        { kamar: foto.kamar, tempat_tidur: foto.tempat_tidur, fasilitas: foto.fasilitas },
        userId
      )
      console.log('✅ URL foto:', urls)

      const fasilitasList = data.fasilitas
        .split(',')
        .map(f => f.trim())
        .filter(Boolean)

      console.log('💾 Mulai simpan ke Firestore...')
      await addListing({
        nama:        data.nama,
        alamat:      data.alamat,
        kota:        data.kota,
        harga:       Number(data.harga),
        deskripsi:   data.deskripsi,
        fasilitas:   fasilitasList,
        foto:        [urls.kamar, urls.tempat_tidur, urls.fasilitas],
        pemilikId:   userId,
        pemilikNama: user.nama,
      }, userId)

      console.log('✅ Listing berhasil disimpan!')
      navigate('/pemilik/dashboard')
    } catch (e) {
      console.error('❌ ERROR DETAIL:', e)
      setError('Gagal menambah listing, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tambah Listing Kost</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        <Card padding="md">
          <h3 className="font-semibold text-slate-700 mb-4">Informasi Kost</h3>
          <div className="flex flex-col gap-3">

            <div>
              <label htmlFor="nama" className="text-sm font-medium text-slate-600 mb-1 block">Nama Kost</label>
              <input
                id="nama"
                {...register('nama', { required: 'Nama kost wajib diisi' })}
                placeholder="Kost Melati Indah"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>}
            </div>

            <div>
              <label htmlFor="alamat" className="text-sm font-medium text-slate-600 mb-1 block">Alamat</label>
              <input
                id="alamat"
                {...register('alamat', { required: 'Alamat wajib diisi' })}
                placeholder="Jl. Melati No. 10"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {errors.alamat && <p className="text-red-500 text-xs mt-1">{errors.alamat.message}</p>}
            </div>

            <div>
              <label htmlFor="kota" className="text-sm font-medium text-slate-600 mb-1 block">Kota</label>
              <input
                id="kota"
                {...register('kota', { required: 'Kota wajib diisi' })}
                placeholder="Jakarta"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {errors.kota && <p className="text-red-500 text-xs mt-1">{errors.kota.message}</p>}
            </div>

            <div>
              <label htmlFor="harga" className="text-sm font-medium text-slate-600 mb-1 block">Harga / Bulan (Rp)</label>
              <input
                id="harga"
                type="number"
                {...register('harga', { required: 'Harga wajib diisi', min: { value: 1, message: 'Harga tidak valid' } })}
                placeholder="500000"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {errors.harga && <p className="text-red-500 text-xs mt-1">{errors.harga.message}</p>}
            </div>

            <div>
              <label htmlFor="deskripsi" className="text-sm font-medium text-slate-600 mb-1 block">Deskripsi</label>
              <textarea
                id="deskripsi"
                {...register('deskripsi', { required: 'Deskripsi wajib diisi' })}
                rows={3}
                placeholder="Deskripsikan kost kamu..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi.message}</p>}
            </div>

            <div>
              <label htmlFor="fasilitas" className="text-sm font-medium text-slate-600 mb-1 block">Fasilitas</label>
              <input
                id="fasilitas"
                {...register('fasilitas')}
                placeholder="WiFi, AC, Kamar Mandi Dalam, Parkir"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-slate-400 mt-1">Pisahkan dengan koma</p>
            </div>

          </div>
        </Card>

        <Card padding="md">
          <h3 className="font-semibold text-slate-700 mb-1">Foto Kost <span className="text-red-500">*</span></h3>
          <p className="text-xs text-slate-400 mb-4">Semua foto wajib diisi</p>

          <div className="flex flex-col gap-4">
            {FOTO_LABELS.map(({ key, label, desc }) => (
              <div key={key}>
                <p className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-1.5">
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
          {loading ? 'Mengupload foto & menyimpan...' : 'Tambah Listing'}
        </Button>

      </form>
    </main>
  )
})

TambahListing.displayName = 'TambahListing'
export default TambahListing
