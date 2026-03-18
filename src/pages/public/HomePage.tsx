import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Clock, Shield } from 'lucide-react'
import Button from '../../components/ui/Button'
import { APP_NAME, APP_TAGLINE } from '../../constants'

const HomePage = memo(() => {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Selamat Datang di <span className="text-amber-400">{APP_NAME}</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            {APP_TAGLINE}. Temukan kost & kontrakan terbaik di seluruh wilayah Banten dengan harga terjangkau.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/listing">
              <Button variant="primary" size="lg">
                <Search size={18} />
                Cari Kost Sekarang
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg">
                Daftarkan Kost Anda
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Fitur Unggulan */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Kenapa Pilih <span className="text-amber-500">{APP_NAME}</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon:  <Clock size={32} className="text-amber-400" />,
                title: 'Sewa Per Jam',
                desc:  'Fleksibel! Sewa kost sesuai kebutuhan, mulai dari 1 jam tanpa biaya berlebih.',
              },
              {
                icon:  <MapPin size={32} className="text-amber-400" />,
                title: 'Khusus Banten',
                desc:  'Platform kost pertama yang fokus melayani seluruh wilayah Provinsi Banten.',
              },
              {
                icon:  <Shield size={32} className="text-amber-400" />,
                title: 'Aman & Terpercaya',
                desc:  'Semua listing diverifikasi admin. Pembayaran aman melalui sistem KostKoin.',
              },
            ].map((f, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-center mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Pemilik */}
      <section className="py-16 px-4 bg-amber-400">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Punya Kost atau Kontrakan?
          </h2>
          <p className="text-slate-700 mb-6">
            Pasarkan propertimu di KostKoin dan jangkau ribuan penyewa di seluruh Banten.
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Daftarkan Properti Gratis
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
})

HomePage.displayName = 'HomePage'
export default HomePage
 
