import { useAuth } from '../context/AuthContext.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import ReservationForm from '../components/reservations/ReservationForm.jsx'
import MyBookings from '../components/reservations/MyBookings.jsx'
import styles from './ReservationsPage.module.css'

const ReservationsPage = () => {
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow="Reserve"
        title="Book your table in seconds"
        description={
          user
            ? `Hi ${user.username || user.email}, choose your preferred table and arrival time. Loyalty balance: ${Number(user.points || 0)} pts.`
            : 'Sign in from the admin page to secure a reservation and access your booking history.'
        }
      />
      <ReservationForm />
      {user && <MyBookings />}
    </div>
  )
}

export default ReservationsPage

