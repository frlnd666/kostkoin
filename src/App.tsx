import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'

import Navbar         from './components/layout/Navbar'
import Footer         from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Public
import HomePage    from './pages/public/HomePage'
import ListingPage from './pages/public/ListingPage'
import DetailPage  from './pages/public/DetailPage'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Penyewa
import ProfilPage     from './pages/penyewa/ProfilPage'
import BookingPage    from './pages/penyewa/BookingPage'
import PaymentPage    from './pages/penyewa/PaymentPage'
import RiwayatBooking from './pages/penyewa/RiwayatBooking'
import BuktiBooking   from './pages/penyewa/BuktiBooking'

// Pemilik
import DashboardPemilik  from './pages/pemilik/DashboardPemilik'
import TambahListing     from './pages/pemilik/TambahListing'
import RiwayatBookingPemilik from './pages/pemilik/RiwayatBooking'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'

import { useAuthStore }                  from './store/authStore'
import { onAuthChange, getUserData }     from './services/authService'

function App() {
  const { setUser, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 pb-16">
          <Routes>

            {/* ── Public ── */}
            <Route path="/"            element={<HomePage />} />
            <Route path="/listing"     element={<ListingPage />} />
            <Route path="/listing/:id" element={<DetailPage />} />

            {/* ── Auth ── */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Profil (semua role) ── */}
            <Route path="/profil" element={
              <ProtectedRoute>
                <ProfilPage />
              </ProtectedRoute>
            } />

            {/* ── Penyewa ── */}
            <Route path="/booking/:id" element={
              <ProtectedRoute allowedRoles={['penyewa']}>
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/:id" element={
              <ProtectedRoute allowedRoles={['penyewa']}>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/riwayat" element={
              <ProtectedRoute allowedRoles={['penyewa']}>
                <RiwayatBooking />
              </ProtectedRoute>
            } />
            <Route path="/booking/:id/bukti" element={
              <ProtectedRoute allowedRoles={['penyewa']}>
                <BuktiBooking />
              </ProtectedRoute>
            } />

            {/* ── Pemilik ── */}
            <Route path="/pemilik/dashboard" element={
              <ProtectedRoute allowedRoles={['pemilik']}>
                <DashboardPemilik />
              </ProtectedRoute>
            } />
            <Route path="/pemilik/tambah" element={
              <ProtectedRoute allowedRoles={['pemilik']}>
                <TambahListing />
              </ProtectedRoute>
            } />
            <Route path="/pemilik/booking" element={
              <ProtectedRoute allowedRoles={['pemilik']}>
                <RiwayatBookingPemilik />
              </ProtectedRoute>
            } />

            {/* ── Admin ── */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
