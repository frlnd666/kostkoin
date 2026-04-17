import { memo, useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate }             from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, Home, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuthStore }          from '../../store/authStore'
import { getListingById }        from '../../services/listingService'
import {
  createBooking,
  hitungTanggalSelesai,
  hitungTotalHarga,
  getHargaSatuan,
  getTipeKamarTersedia,
  labelTipe,
  satuanTipe,
  type CreateBookingInput,
} from '../../services/bookingService'
import { formatRupiah }          from '../../utils/format'
import type { Listing }          from '../../types/listing'
import type { TipeKamar }        from '../../types/booking'

// ── Konstanta durasi per tipe ─────────────────────────────────
const OPSI_DURASI: Record<TipeKamar, { label: string; value: number }[]> = {
  harian:   [1,2,3,5,7,10,14].map(n => ({ label: `${n} hari`,   value: n })),
  mingguan: [1,2,3,4,6,8].map(n =>    ({ label: `${n} minggu`,  value: n })),
  bulanan:  [1,2,3,4,6,9,12].map(n => ({ label: `${n} bulan`,   value: n })),
}

// ── Step Indicator ────────────────────────────────────────────
const StepBar = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {['Tipe & Durasi', 'Tanggal', 'Konfirmasi'].map((label, i) => {
      const idx    = i + 1
      const active = idx === step
      const done   = idx < step
      return (
        <div key={idx} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            active ? 'text-amber-500' : done ? 'text-green-500' : 'text-slate-300'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
              active ? 'border-amber-400 bg-amber-400 text-white' :
              done   ? 'border-green-400 bg-green-400 text-white' :
                       'border-slate-200 text-slate-300'
            }`}>
              {done ? '✓' : idx}
            </div>
            <span className="hidden sm:block">{label}</span>
          </div>
          {i < 2 && <div className={`w-8 h-px ${done ? 'bg-green-300' : 'bg-slate-200'}`} />}
        </div>
      )
    })}
  </div>
)

// ── Format Tanggal Display ────────────────────────────────────
const fmtDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const fmtDateShort = (d: Date) =>
  d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

// ─────────────────────────────────────────────────────────────
const BookingPage = memo(() => {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()

  const [listing, setListing]   = useState<Listing | null>(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSub]    = useState(false)
  const [error, setError]       = useState('')

  // Step state
  const [step, setStep]             = useState(1)
  const [tipeKamar, setTipeKamar]   = useState<TipeKamar>('bulanan')
  const [durasi, setDurasi]         = useState(1)
  const [tanggalMulai, setTanggal]  = useState<Date>(new Date())
  const [catatan, setCatatan]       = useState('')

  // Load listing
  useEffect(() => {
    if (!id) return
    getListingById(id)
      .then(data => {
        setListing(data)
        if (data) {
          const tipes = getTipeKamarTersedia(data)
          setTipeKamar(tipes[0])
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  // Kalkulasi derived values
  const tipesTersedia  = useMemo(() => listing ? getTipeKamarTersedia(listing) : [], [listing])
  const hargaSatuan    = useMemo(() => listing ? getHargaSatuan(listing, tipeKamar) : 0, [listing, tipeKamar])
  const tanggalSelesai = useMemo(() => hitungTanggalSelesai(tanggalMulai, tipeKamar, durasi), [tanggalMulai, tipeKamar, durasi])
  const totalHarga     = useMemo(() => hitungTotalHarga(hargaSatuan, durasi), [hargaSatuan, durasi])

  // Reset durasi saat ganti tipe
  const handleGantiTipe = (tipe: TipeKamar) => {
    setTipeKamar(tipe)
    setDurasi(1)
  }

  // Tanggal minimal = hari ini
  const todayStr = new Date().toISOString().split('T')[0]

  // Submit booking
  const handleSubmit = async () => {
    if (!listing || !user) return
    setSub(true)
    setError('')
    try {
      const input: CreateBookingInput = {
        listingId:      listing.id,
        listingNama:    listing.nama,
        listingAlamat:  listing.alamat,
        penyewaId:      user.uid,
        penyewaNama:    user.nama,
        penyewaEmail:   user.email ?? '',
        pemilikId:      listing.pemilikId,
        pemilikNama:    listing.pemilikNama,
        tipeKamar,
        tanggalMulai,
        tanggalSelesai,
        durasi,
        hargaSatuan,
        totalHarga,
        catatanPenyewa: catatan,
      }
      const bookingId = await createBooking(input)
      navigate(`/payment/${bookingId}`, { replace: true })
    } catch (err) {
      setError('Gagal membuat booking. Silakan coba lagi.')
      console.error(err)
    } finally {
      setSub(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!listing) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Home size={40} className="text-slate-200 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Listing tidak ditemukan</p>
      <button onClick={() => navigate('/listing')}
        className="mt-4 text-sm text-amber-500 font-semibold hover:underline">
        Cari kost lain
      </button>
    </div>
  )

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">Booking Kost</h1>
          <p className="text-xs text-slate-400 truncate max-w-[240px]">{listing.nama}</p>
        </div>
      </div>

      {/* Step indicator */}
      <StepBar step={step} />

      {/* ── STEP 1: Tipe & Durasi ─────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">

          {/* Pilih Tipe Kamar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Tipe Sewa
            </p>
            <div className="grid grid-cols-3 gap-2">
              {tipesTersedia.map(tipe => (
                <button key={tipe}
                  onClick={() => handleGantiTipe(tipe)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    tipeKamar === tipe
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {labelTipe(tipe)}
                </button>
              ))}
            </div>
          </div>

          {/* Harga satuan */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-0.5">Harga per {satuanTipe(tipeKamar)}</p>
            <p className="text-2xl font-bold text-amber-500">
              {formatRupiah(hargaSatuan)}
              <span className="text-sm font-normal text-slate-400 ml-1">/{satuanTipe(tipeKamar)}</span>
            </p>
          </div>

          {/* Pilih Durasi */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Durasi Sewa
            </p>
            <div className="grid grid-cols-4 gap-2">
              {OPSI_DURASI[tipeKamar].map(opsi => (
                <button key={opsi.value}
                  onClick={() => setDurasi(opsi.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    durasi === opsi.value
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {opsi.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotal preview */}
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Estimasi total</p>
              <p className="text-lg font-bold text-slate-800">{formatRupiah(totalHarga)}</p>
            </div>
            <p className="text-xs text-slate-400 text-right">
              {formatRupiah(hargaSatuan)} × {durasi} {satuanTipe(tipeKamar)}
            </p>
          </div>

          <button onClick={() => setStep(2)}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
            Lanjut Pilih Tanggal <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Pilih Tanggal ─────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CalendarDays size={14} className="text-amber-400" />
              Tanggal Mulai
            </label>
            <input
              type="date"
              min={todayStr}
              value={tanggalMulai.toISOString().split('T')[0]}
              onChange={e => setTanggal(new Date(e.target.value + 'T00:00:00'))}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          {/* Preview tanggal selesai */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              Ringkasan Waktu
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Check-in</span>
                <span className="font-semibold text-slate-800">{fmtDate(tanggalMulai)}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Check-out</span>
                <span className="font-semibold text-slate-800">{fmtDate(tanggalSelesai)}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Durasi</span>
                <span className="font-semibold text-amber-600">
                  {durasi} {satuanTipe(tipeKamar)}
                </span>
              </div>
            </div>
          </div>

          {/* Catatan opsional */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Catatan untuk Pemilik <span className="font-normal text-slate-300">(opsional)</span>
            </label>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Misal: saya akan datang sore hari, butuh parkir motor..."
              rows={3}
              maxLength={300}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            <p className="text-right text-xs text-slate-300 mt-1">{catatan.length}/300</p>
          </div>

          <button onClick={() => setStep(3)}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
            Lanjut Konfirmasi <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 3: Konfirmasi ────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">

          {/* Info kost */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Detail Kost
            </p>
            <div className="flex gap-3 items-start">
              {listing.foto?.[0] ? (
                <img src={listing.foto[0]} alt={listing.nama}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">🏠</div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-snug">{listing.nama}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{listing.alamat}, {listing.kota}</p>
                <p className="text-xs text-slate-500 mt-1">Pemilik: {listing.pemilikNama}</p>
              </div>
            </div>
          </div>

          {/* Ringkasan booking */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Ringkasan Booking
            </p>
            {[
              { label: 'Tipe Sewa',   value: labelTipe(tipeKamar) },
              { label: 'Durasi',      value: `${durasi} ${satuanTipe(tipeKamar)}` },
              { label: 'Check-in',    value: fmtDateShort(tanggalMulai) },
              { label: 'Check-out',   value: fmtDateShort(tanggalSelesai) },
              { label: 'Harga/Satuan',value: formatRupiah(hargaSatuan) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className="font-medium text-slate-800">{row.value}</span>
              </div>
            ))}
            {catatan && (
              <>
                <div className="h-px bg-slate-100" />
                <div className="text-sm">
                  <span className="text-slate-400 block mb-1">Catatan</span>
                  <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 rounded-lg p-2.5">{catatan}</p>
                </div>
              </>
            )}
          </div>

          {/* Total harga */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Pembayaran</p>
              <p className="text-2xl font-extrabold text-amber-500">{formatRupiah(totalHarga)}</p>
            </div>
            <p className="text-xs text-slate-400 text-right leading-relaxed">
              {formatRupiah(hargaSatuan)}<br />
              × {durasi} {satuanTipe(tipeKamar)}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-400 text-center leading-relaxed px-2">
            Dengan menekan tombol di bawah, kamu menyetujui syarat & ketentuan sewa kost ini.
            Pembayaran harus dilakukan dalam <strong>24 jam</strong> atau booking akan hangus otomatis.
          </p>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-200 disabled:cursor-not-allowed text-slate-900 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              'Konfirmasi & Lanjut Bayar'
            )}
          </button>
        </div>
      )}

    </main>
  )
})

BookingPage.displayName = 'BookingPage'
export default BookingPage
