import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import MenuManager from '../components/admin/MenuManager.jsx'
import ReservationsList from '../components/admin/ReservationsList.jsx'
import ContactInbox from '../components/admin/ContactInbox.jsx'
import AdminDashboard from '../components/admin/AdminDashboard.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AdminPage.module.css'

const AdminPage = () => {
  const { user, authToken, logout, isLoadingUser } = useAuth()
  const navigate = useNavigate()

  // Check if user is admin when authenticated
  useEffect(() => {
    if (authToken && user && user.role !== 'admin') {
      // User is authenticated but not an admin - redirect to home
      navigate('/', { replace: true })
    }
  }, [authToken, user, navigate])

  // Show loading state while checking user
  if (isLoadingUser) {
    return (
      <div className={styles.page}>
        <p>Loading...</p>
      </div>
    )
  }

  // If authenticated but not admin, show access denied (will redirect via useEffect)
  if (authToken && user && user.role !== 'admin') {
    return (
      <div className={styles.page}>
        <SectionHeading
          eyebrow="Access Denied"
          title="Unauthorized Access"
          description="You do not have permission to access this page. Only administrators can access the admin panel."
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow="Admin"
        title="Operational command center"
        description="Manage live reservations, update the menu and respond to guest enquiries from a single dashboard."
      />

      {!authToken && <AdminLogin />}

      {authToken && user?.role === 'admin' && (
        <>
          <div className={styles.headerBar}>
            <div className={styles.userBadge}>
              <strong>{user?.username || user?.email}</strong>
              <span>Signed in as admin</span>
            </div>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>

          <AdminDashboard />

          <div className={styles.grid}>
            <MenuManager />
            <ReservationsList />
          </div>

          <ContactInbox />
        </>
      )}
    </div>
  )
}

export default AdminPage


