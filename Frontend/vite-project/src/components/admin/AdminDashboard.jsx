import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import styles from './Admin.module.css'
import { useAdminDashboard } from '../../hooks/useAdminDashboard.js'
import { useAdminLoyalty, ADMIN_LOYALTY_QUERY_KEY } from '../../hooks/useAdminLoyalty.js'
import { apiClient } from '../../services/apiClient.js'

const AdminDashboard = () => {
  const queryClient = useQueryClient()
  const [loyaltyFeedback, setLoyaltyFeedback] = useState(null)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
  } = useAdminDashboard({ staleTime: 60_000 })
  const {
    data: loyaltyData,
    isLoading: isLoyaltyLoading,
  } = useAdminLoyalty({ staleTime: 60_000 })

  const adjustMutation = useMutation({
    mutationFn: ({ identifier, delta }) => apiClient.adjustUserPoints({ identifier, delta }),
    onSuccess: () => {
      setLoyaltyFeedback({ type: 'success', message: 'Points updated.' })
      queryClient.invalidateQueries({ queryKey: ADMIN_LOYALTY_QUERY_KEY })
    },
    onError: (error) => {
      setLoyaltyFeedback({ type: 'error', message: error.message })
    },
  })

  const ordersByStatus = dashboardData?.ordersByStatus ?? {}
  const topSellingItem = dashboardData?.topSellingItem

  const handleAdjustPoints = async (prefillEmail = '') => {
    const identifier = window.prompt('Enter customer email:', prefillEmail || '')
    if (!identifier) return
    const input = window.prompt('Adjust points by (use negative numbers to subtract):', '50')
    if (input === null) return
    const delta = Number(input)
    if (!Number.isFinite(delta) || delta === 0) {
      setLoyaltyFeedback({
        type: 'error',
        message: 'Please enter a valid, non-zero number.',
      })
      return
    }
    try {
      await adjustMutation.mutateAsync({ identifier: identifier.trim(), delta })
    } catch {
      // handled via onError
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Business pulse</p>
          <h3 className={styles.panelTitle}>Live performance highlights</h3>
          <p className={styles.panelDescription}>
            Snapshot of orders, guests and loyalty activity powering your operations today.
          </p>
        </div>
      </div>

     
      <div className={styles.loyaltyGrid}>
        
        <div className={styles.loyaltyPanel}>
          <p className={styles.panelEyebrow}>Top loyalty guests</p>
          {isLoyaltyLoading ? (
            <p className={styles.muted}>Loading guests…</p>
          ) : loyaltyData?.topUsers?.length ? (
            <ul className={styles.loyaltyList}>
              {loyaltyData.topUsers.map((guest) => (
                <li key={guest.id} className={styles.loyaltyRow}>
                  <div>
                    <strong>{guest.username || guest.email}</strong>
                    <p className={styles.muted}>{guest.email}</p>
                  </div>
                  <div className={styles.loyaltyRowActions}>
                    <span className={styles.loyaltyBadge}>{guest.points} pts</span>
                    <button
                      type="button"
                      className={styles.loyaltyAdjustBtn}
                      onClick={() => handleAdjustPoints(guest.id)}
                      disabled={adjustMutation.isPending}
                    >
                      Adjust
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>No loyalty participants yet.</p>
          )}
          {loyaltyFeedback && (
            <p
              className={
                loyaltyFeedback.type === 'error' ? styles.error : styles.success
              }
            >
              {loyaltyFeedback.message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard

