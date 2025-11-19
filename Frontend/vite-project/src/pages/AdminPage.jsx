import Button from '../components/common/Button.jsx'
import AdminLogin from '../components/admin/AdminLogin.jsx'
import MenuManager from '../components/admin/MenuManager.jsx'
import ReservationsList from '../components/admin/ReservationsList.jsx'
import ContactInbox from '../components/admin/ContactInbox.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AdminPage.module.css'

const AdminPage = () => {
  const { user, authToken, logout } = useAuth()

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow="Admin"
        title="Operational command center"
        description="Manage live reservations, update the menu and respond to guest enquiries from a single dashboard."
      />

      {!authToken && <AdminLogin />}

      {authToken && (
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


