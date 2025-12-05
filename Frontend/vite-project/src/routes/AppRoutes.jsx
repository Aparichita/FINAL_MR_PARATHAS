import { Routes, Route } from 'react-router-dom'

import MainLayout from '../components/layout/MainLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import MenuPage from '../pages/MenuPage.jsx'
import ReservationsPage from '../pages/ReservationsPage.jsx'
import ContactPage from '../pages/ContactPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import CartPage from '../pages/CartPage.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Navigate } from 'react-router-dom'

const NotFound = () => (
  <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
)

const AppRoutes = () => {
  const { user, isLoadingUser } = useAuth()

  const AdminGuard = ({ children }) => {
    if (isLoadingUser) return <div style={{ padding: 20 }}>Loading…</div>
    if (!user || user.role !== 'admin') return <Navigate to="/" replace />
    return children
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
