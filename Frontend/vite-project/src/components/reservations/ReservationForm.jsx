import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { AVAILABLE_TABLES_QUERY_KEY, useAvailableTables } from '../../hooks/useAvailableTables.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiClient } from '../../services/apiClient.js'
import Button from '../common/Button.jsx'
import styles from './ReservationForm.module.css'

const ReservationForm = () => {
  const queryClient = useQueryClient()
  const { authToken } = useAuth()
  
  const [formValues, setFormValues] = useState({
    tableId: '',
    bookingDate: '',
    bookingTime: '',
    numberOfGuests: 2,
    specialRequests: '',
  })

  // Calculate booking datetime for table availability check
  const bookingDateTime = formValues.bookingDate && formValues.bookingTime 
    ? new Date(`${formValues.bookingDate}T${formValues.bookingTime}`)
    : null

  const {
    data: tables = [],
    isLoading,
    isError: isTablesError,
    error: tablesError,
  } = useAvailableTables(bookingDateTime)

  const { mutateAsync, isPending, isSuccess, isError, error, data } = useMutation({
    mutationFn: apiClient.bookReservation,
    onSuccess: () => {
      setFormValues({
        tableId: '',
        bookingDate: '',
        bookingTime: '',
        numberOfGuests: 2,
        specialRequests: '',
      })
      queryClient.invalidateQueries({ queryKey: AVAILABLE_TABLES_QUERY_KEY })
    },
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formValues.tableId || !formValues.bookingDate || !formValues.bookingTime) {
      return
    }
    const bookingDate = new Date(`${formValues.bookingDate}T${formValues.bookingTime}`)
    try {
      await mutateAsync({
        tableId: formValues.tableId,
        bookingDate,
        numberOfGuests: Number(formValues.numberOfGuests),
        specialRequests: formValues.specialRequests,
      })
    } catch {
      // handled by mutation state
    }
  }

  // Function to validate time is between 7:30 AM and 1:30 AM
  const isValidTime = (time) => {
    if (!time) return true
    
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    
    // 7:30 AM = 7 * 60 + 30 = 450 minutes
    // 1:30 AM next day = 24 * 60 + 1 * 60 + 30 = 1470 minutes
    return totalMinutes >= 450 && totalMinutes <= 1470
  }

  const disabled = isPending
  const isTimeValid = isValidTime(formValues.bookingTime)

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="tableId">Select table</label>
          <select
            id="tableId"
            name="tableId"
            value={formValues.tableId}
            onChange={handleChange}
            required
            disabled={isLoading || disabled}
          >
            <option value="">Choose a table</option>
            {tables.map((table) => (
              <option key={table._id} value={table._id}>
                Table #{table.tableNumber} · Seats {table.capacity}
              </option>
            ))}
          </select>
        </div>
        {isTablesError && <p className={styles.error}>{tablesError.message}</p>}

        <div className={styles.inlineFields}>
          <div className={styles.fieldGroup}>
            <label htmlFor="bookingDate">Date</label>
            <input 
              type="date" 
              id="bookingDate" 
              name="bookingDate" 
              value={formValues.bookingDate} 
              onChange={handleChange} 
              required 
              min={format(new Date(), 'yyyy-MM-dd')} 
              disabled={disabled} 
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="bookingTime">Time</label>
            <input 
              type="time" 
              id="bookingTime" 
              name="bookingTime" 
              value={formValues.bookingTime} 
              onChange={handleChange} 
              required 
              min="07:30"
              max="25:30" // Using 25:30 to represent 1:30 AM next day
              step="1800" // 30 minutes intervals (1800 seconds)
              disabled={disabled} 
            />
            {formValues.bookingTime && !isTimeValid && (
              <p className={styles.error}>
                Please select a time between 7:30 AM and 1:30 AM
              </p>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="numberOfGuests">Guests</label>
            <input type="number" id="numberOfGuests" name="numberOfGuests" min="1" max="12" value={formValues.numberOfGuests} onChange={handleChange} required disabled={disabled} />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="specialRequests">Special requests</label>
          <textarea id="specialRequests" name="specialRequests" rows="3" placeholder="Allergies, celebrations, chef preferences…" value={formValues.specialRequests} onChange={handleChange} disabled={disabled} />
        </div>

        <Button 
          type="submit" 
          size="lg" 
          disabled={disabled || !isTimeValid || !formValues.bookingTime}
        >
          {isPending ? 'Booking…' : 'Confirm reservation'}
        </Button>

        {!authToken && (
          <p className={styles.helper}>
            Create an account from the account page to save your preferences and view reservations faster next
            time.
          </p>
        )}
        {isSuccess && <p className={styles.success}>Reservation confirmed! Booking ID: {data?._id || data?.id}</p>}
        {isError && <p className={styles.error}>{error.message}</p>}
      </form>

      <div className={styles.panel}>
        <h3>Available tables</h3>
        {isLoading && <p>Loading tables…</p>}
        {isTablesError && <p className={styles.error}>{tablesError.message}</p>}
        {!isLoading && !isTablesError && tables.length === 0 && <p>No tables are available at the chosen time.</p>}
        <ul>
          {tables.map((table) => (
            <li key={table._id}>
              <div>
                <p>Table #{table.tableNumber}</p>
                <small>Seats {table.capacity}</small>
              </div>
              <span className={styles.badge}>Open</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ReservationForm