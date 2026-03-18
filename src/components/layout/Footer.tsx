import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '../../constants'

const Footer = memo(() => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">{APP_NAME}</h3>
            <p className="text-sm text-slate-400 mb-4">{APP_TAGLINE}</p>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-amber-400" />
              <span>Provinsi Banten, Indonesia</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Navigasi</h4>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                { label: 'Beranda',       href: '/' },
                { label: 'Cari Kost',     href: '/listing' },
                { label: 'Daftar Pemilik', href: '/register' },
                { label: 'Masuk',         href: '/login' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-amber-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">Kontak</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-amber-400" />
                <span>+62 xxx-xxxx-xxxx</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-amber-400" />
                <span>info@kostkoin.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'
export default Footer
 
