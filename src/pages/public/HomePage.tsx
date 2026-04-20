// src/pages/public/HomePage.tsx

import { memo }  from 'react'
import { Link }  from 'react-router-dom'
import { Search, MapPin, Shield, Star, ChevronRight } from 'lucide-react'
import { APP_TAGLINE }  from '../../constants'
import BannerSlider     from '../../components/home/BannerSlider'

const HomePage = memo(() => {
  return (
    <main style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--color-bg)', padding: '2.5rem 1rem 1.5rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            background: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            padding: '0.28rem 0.75rem', borderRadius: 999,
            marginBottom: '1.1rem'
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }}/>
            Platform Kost Banten
          </span>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 8vw, 2.75rem)',
            fontWeight: 700, lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--color-text)',
            marginBottom: '0.85rem'
          }}>
            Cari Kost di{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Banten</em>
          </h1>

          <p style={{
            fontSize: '0.9rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.75,
            maxWidth: '34ch',
            margin: '0 auto 1.75rem'
          }}>
            {APP_TAGLINE}. Harga transparan, bayar online.
          </p>

          {/* Search Bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.35rem 0.35rem 0.35rem 1rem',
            marginBottom: '1rem'
          }}>
            <Search size={14} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}/>
            <input
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: '0.85rem', padding: '0.3rem 0.75rem',
                color: 'var(--color-text)', fontFamily: 'var(--font-body)'
              }}
              placeholder="Nama kost atau alamat..."
            />
            <Link to="/listing">
              <button style={{
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
              }}>
                Cari Kost
              </button>
            </Link>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
            <Link to="/listing">
              <button style={{
                background: 'var(--color-gold)', color: 'var(--color-text-inverse)',
                border: 'none', borderRadius: 'var(--radius-lg)',
                padding: '0.65rem 1.4rem', fontSize: '0.85rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>
                Jelajahi Sekarang
              </button>
            </Link>
            <Link to="/register">
              <button style={{
                background: 'transparent', color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                padding: '0.65rem 1.2rem', fontSize: '0.85rem', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>
                Daftarkan Kost
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── BANNER SLIDER ── */}
      <section style={{ padding: '0 1rem 1.5rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <BannerSlider />
        </div>
      </section>

      {/* ── KOTA PILIHAN ── */}
      <section style={{ padding: '0 1rem 1.5rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: 4 }}>
            {['Serang', 'Tangerang', 'Tangerang Selatan', 'Cilegon', 'Lebak'].map(kota => (
              <Link key={kota} to={`/listing?kota=${kota}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '0.65rem 1rem', borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer', minWidth: 72
                }}>
                  <MapPin size={16} style={{ color: 'var(--color-gold)' }}/>
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                    {kota}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FITUR UNGGULAN ── */}
      <section style={{ padding: '0 1rem 1.5rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[
            { icon: <Star size={18}/>, title: 'Listing Terverifikasi', desc: 'Semua kost dicek & disetujui admin sebelum tayang' },
            { icon: <Shield size={18}/>, title: 'Pembayaran Aman', desc: 'Transaksi terlindungi via Midtrans, uang aman' },
            { icon: <MapPin size={18}/>, title: 'Fokus Banten', desc: 'Platform kost pertama khusus Provinsi Banten' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.9rem 1rem', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{
                flexShrink: 0, width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-gold-subtle)',
                border: '1px solid var(--color-gold-border)',
                color: 'var(--color-gold)'
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{
                  fontSize: '0.88rem', fontWeight: 600,
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-display)',
                  marginBottom: 2
                }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA PEMILIK ── */}
      <section style={{ padding: '0.5rem 1rem 2rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            borderRadius: 'var(--radius-xl)', padding: '2rem 1.5rem',
            textAlign: 'center',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-gold-border)'
          }}>
            <div style={{
              fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem',
              fontFamily: 'var(--font-display)', color: 'var(--color-text)'
            }}>
              Punya Kost di Banten?
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Daftarkan gratis, jangkau ribuan penyewa sekarang
            </p>
            <Link to="/register">
              <button style={{
                background: 'var(--color-gold)', color: 'var(--color-text-inverse)',
                border: 'none', borderRadius: 'var(--radius-lg)',
                padding: '0.7rem 1.5rem', fontSize: '0.875rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}>
                Daftarkan Properti
                <ChevronRight size={15}/>
              </button>
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
})

HomePage.displayName = 'HomePage'
export default HomePage
