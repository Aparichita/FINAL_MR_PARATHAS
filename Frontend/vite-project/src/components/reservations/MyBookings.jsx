import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { useUserBookings, USER_BOOKINGS_QUERY_KEY } from '../../hooks/useUserBookings.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiClient } from '../../services/apiClient.js'
import SectionHeading from '../common/SectionHeading.jsx'
import styles from './MyBookings.module.css'

const formatDate = (value) => {
  try {
    return format(new Date(value), 'dd MMM yyyy · hh:mm a')
  } catch {
    return value ?? '—'
  }
}

const MyBookings = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data = [], isLoading, isError, error } = useUserBookings({
    enabled: Boolean(user),
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => apiClient.cancelBooking(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_BOOKINGS_QUERY_KEY })
    },
  })

  const sortedBookings = useMemo(
    () =>
      [...data].sort(
        (a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime(),
      ),
    [data],
  )

  if (!user) return null

  return (
    <section className={styles.section}>
      <SectionHeading
        eyebrow="Your bookings"
        title="Upcoming and past reservations"
        description="Cancel a booking up to 2 hours before arrival."
      />

      {isLoading && <p className={styles.muted}>Loading your bookings…</p>}
      {isError && <p className={styles.error}>{error.message}</p>}

      {!isLoading && !isError && sortedBookings.length === 0 && (
        <p className={styles.muted}>You haven’t booked a table yet.</p>
      )}

      {!isLoading && !isError && sortedBookings.length > 0 && (
        <div className={styles.list}>
          {sortedBookings.map((booking) => {
            const isCancelled = booking.bookingStatus === 'Cancelled'
            const isDisabled = isCancelled || cancelMutation.isPending
            return (
              <article key={booking._id} className={styles.card}>
                <div>
                  <p className={styles.eyebrow}>Table #{booking.table?.tableNumber ?? '—'}</p>
                  <h3>{formatDate(booking.bookingDate)}</h3>
                  <p className={styles.muted}>
                    Guests: {booking.numberOfGuests} · {booking.specialRequests || 'No notes'}
                  </p>
                  <p className={`${styles.badge} ${isCancelled ? styles.badgeCancelled : styles.badgeConfirmed}`}>
                    {booking.bookingStatus}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => cancelMutation.mutate(booking._id)}
                  disabled={isDisabled}
                >
                  {isCancelled ? 'Cancelled' : 'Cancel booking'}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default MyBookings

