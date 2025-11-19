import { useState } from 'react'

import Button from '../common/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './Admin.module.css'

const AdminLogin = () => {
  const { login, isAuthenticating, authError } = useAuth()
  const [formValues, setFormValues] = useState({ email: '', password: '' })
  const [localError, setLocalError] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formValues.email || !formValues.password) {
      setLocalError('Email and password are required.')
      return
    }
    setLocalError(null)
    try {
      await login(formValues)
    } catch {
      // error handled by context state
    }
  }

  return (
    <section className={styles.panel} aria-label="Admin login">
      <div>
        <p className={styles.panelEyebrow}>Staff access</p>
        <h3 className={styles.panelTitle}>Sign in to manage service</h3>
        <p className={styles.panelDescription}>Use your admin credentials to view bookings and manage the menu.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            value={formValues.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formValues.password}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" size="lg" disabled={isAuthenticating}>
          {isAuthenticating ? 'Signing in…' : 'Login'}
        </Button>

        {(localError || authError) && <p className={styles.error}>{localError || authError}</p>}
      </form>
    </section>
  )
}

export default AdminLogin


