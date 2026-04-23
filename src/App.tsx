// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect }      from 'react'

// Layout
import Navbar             from './components/layout/Navbar'
import Footer             from './components/layout/Footer'
import ProtectedRoute     from './components/layout/ProtectedRoute'

// Public
import HomePage           from './pages/public/HomePage'
import ListingPage        from './pages/public/ListingPage'
import DetailPage         from './pages/public/DetailPage'

// Auth
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'

// Penyewa
import ProfilPage         from './pages/penyewa/ProfilPage'
import BookingPage        from './pages/penyewa/BookingPage'
import PaymentPage        from './pages/penyewa/PaymentPage'
import RiwayatPage        from './pages/penyewa/RiwayatPage'
import DetailBookingPage  from './pages/penyewa/DetailBookingPage'

// Pemilik
import DashboardPemilik   from './pages/pemilik/DashboardPemilik'
import TambahListing      from './pages/pemilik/TambahListing'
import BookingMasukPage   from './pages/pemilik/BookingMasukPage'

// Admin
import AdminDashboard     from './pages/admin/AdminDashboard'

// Notifikasi
import NotifikasiPage     from './pages/shared/NotifikasiPage'

// Store & Service
import { useAuthStore }             from './store/authStore'
import { onAuthChange, getUserData } from './services/authService'

// ── Audio unlock ── ← TAMBAHKAN INI
import { unlockAudio } from './utils/notifSound'

function App() {
  const { setUser, setLoading, setInitialized } = useAuthStore()

  // ── Unlock AudioContext saat pertama kali user tap/klik ── ← TAMBAHKAN INI
  useEffect(() => { unlockAudio() }, [])

  useEffect(() => {
    const unsubscribe = onAuthChange(async firebaseUser => {
      setLoading(true)
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid)
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
      setInitialized(true)
    })
    return () => unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 pb-16">
          <Routes>

            <Route path="/"                    element={<HomePage />} />
<Route path="/listing"             element={<ListingPage />} />
<Route path="/listing/:id"         element={<DetailPage />} />
<Route path="/login"               element={<LoginPage />} />
<Route path="/register"            element={<RegisterPage />} />
<Route path="/profil"              element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
<Route path="/booking/:id"         element={<ProtectedRoute allowedRoles={['penyewa']}><BookingPage /></ProtectedRoute>} />
<Route path="/payment/:id"         element={<ProtectedRoute allowedRoles={['penyewa']}><PaymentPage /></ProtectedRoute>} />
<Route path="/riwayat"             element={<ProtectedRoute allowedRoles={['penyewa']}><RiwayatPage /></ProtectedRoute>} />
<Route path="/booking/detail/:id"  element={<ProtectedRoute allowedRoles={['penyewa']}><DetailBookingPage /></ProtectedRoute>} />
<Route path="/pemilik/dashboard"   element={<ProtectedRoute allowedRoles={['pemilik']}><DashboardPemilik /></ProtectedRoute>} />
<Route path="/pemilik/tambah"      element={<ProtectedRoute allowedRoles={['pemilik']}><TambahListing /></ProtectedRoute>} />
<Route path="/pemilik/booking"     element={<ProtectedRoute allowedRoles={['pemilik']}><BookingMasukPage /></ProtectedRoute>} />
<Route path="/admin/dashboard"     element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
<Route path="/notifikasi"          element={<ProtectedRoute><NotifikasiPage /></ProtectedRoute>} />
<Route path="*"                    element={<Navigate to="/" replace />} />

          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
