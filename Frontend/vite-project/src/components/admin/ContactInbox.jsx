import { useQuery } from '@tanstack/react-query'

import Button from '../common/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiClient } from '../../services/apiClient.js'
import styles from './Admin.module.css'

const ContactInbox = () => {
  const { authToken } = useAuth()
  const { data = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'contact'],
    queryFn: apiClient.fetchContactMessages,
    enabled: Boolean(authToken),
  })

  if (!authToken) {
    return null
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Inbox</p>
          <h3 className={styles.panelTitle}>Guest messages</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </div>
      <p className={styles.panelDescription}>Respond quickly to catering queries and private dining requests.</p>

      {isLoading && <p className={styles.muted}>Loading messages…</p>}
      {isError && <p className={styles.error}>{error.message}</p>}

      {!isLoading && !isError && data.length === 0 && <p className={styles.muted}>No new messages.</p>}

      {!isLoading && !isError && data.length > 0 && (
        <ul className={styles.list}>
          {data.map((message) => {
            const createdAt = message.createdAt
              ? new Date(message.createdAt).toLocaleDateString()
              : 'Just now'
            return (
              <li key={message._id} className={styles.listItem}>
                <div className={styles.actions}>
                  <strong>{message.name}</strong>
                  <span className={styles.badge}>{message.subject || 'General'}</span>
                </div>
                <p className={styles.muted}>
                  {message.email} · {createdAt}
                </p>
                <p>{message.message}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ContactInbox


