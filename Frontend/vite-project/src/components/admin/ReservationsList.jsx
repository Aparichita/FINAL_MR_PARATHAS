import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import Button from '../common/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiClient } from '../../services/apiClient.js'
import styles from './Admin.module.css'

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    return format(new Date(value), 'dd MMM yyyy · hh:mm a')
  } catch {
    return value
  }
}

const ReservationsList = () => {
  const queryClient = useQueryClient()
  const { authToken } = useAuth()
  const { data = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'reservations'],
    queryFn: apiClient.fetchReservations,
    enabled: Boolean(authToken),
  })

  const [updatingId, setUpdatingId] = useState(null)

  const { mutateAsync: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => apiClient.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] })
      setUpdatingId(null)
    },
  })

  const {
    mutateAsync: cancelBooking,
    isPending: isCancelling,
  } = useMutation({
    mutationFn: (bookingId) => apiClient.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] })
    },
  })

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId)
    try {
      await updateStatus({ id: bookingId, status: newStatus })
    } catch {
      setUpdatingId(null)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await cancelBooking(bookingId)
    } catch {
      // handled by mutation error boundary if needed
    }
  }

  const statusClass = {
    confirmed: styles.statusConfirmed,
    pending: styles.statusPending,
    cancelled: styles.statusCancelled,
  }

  const operationalStatusOptions = ['not reached yet', 'having food', 'done']

  if (!authToken) {
    return null
  }

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Reservations</p>
          <h3 className={styles.panelTitle}>Live bookings</h3>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </div>
      </div>
      <p className={styles.panelDescription}>
        Track guest arrivals and special requests before service begins.
      </p>

      {isLoading && <p className={styles.muted}>Loading reservations…</p>}
      {isError && <p className={styles.error}>{error.message}</p>}

      {!isLoading && !isError && data.length === 0 && <p className={styles.muted}>No reservations yet.</p>}

      {!isLoading && !isError && data.length > 0 && (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Arrival</th>
                <th>Notes</th>
                <th>Booking Status</th>
                <th>Operational Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((booking) => {
                const tableLabel =
                  booking.table?.tableNumber ??
                  booking.tableNumber ??
                  booking.table?.name ??
                  booking.tableId?.tableNumber ??
                  '—'
                const statusKey = (booking.bookingStatus?.toLowerCase?.() ?? 'confirmed')
                const operationalStatus = booking.operationalStatus || 'not reached yet'
                const isUpdating = updatingId === booking._id
                const userLabel = booking.user?.username || booking.user?.email || booking.customerName || booking.customer?.name || 'Walk-in'
                
                return (
                  <tr key={booking._id || `${booking.tableId}-${booking.bookingDate}`}>
                    <td>{userLabel}</td>
                    <td>#{tableLabel}</td>
                    <td>{booking.numberOfGuests ?? booking.guests ?? '—'}</td>
                    <td>{formatDateTime(booking.bookingDate)}</td>
                    <td>{booking.specialRequests || '—'}</td>
                    <td className={styles.status}>
                      <span className={statusClass[statusKey] ?? styles.statusPending}>{statusKey}</span>
                    </td>
                    <td>
                      <select
                        value={operationalStatus}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                        disabled={isUpdating}
                        className={styles.statusSelect}
                      >
                        {operationalStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleCancel(booking._id)}
                        disabled={isCancelling || statusKey === 'cancelled'}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ReservationsList


