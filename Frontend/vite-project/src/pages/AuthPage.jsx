import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../components/common/Button.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AuthPage.module.css'

const initialLoginState = { email: '', password: '' }
const initialSignupState = { username: '', email: '', password: '' }

const AuthPage = () => {
  const navigate = useNavigate()
  const { user, login, register, logout, isAuthenticating } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true) // true for login, false for signup
  const [loginValues, setLoginValues] = useState(initialLoginState)
  const [signupValues, setSignupValues] = useState(initialSignupState)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target
    setter((prev) => ({ ...prev, [name]: value }))
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    try {
      const account = await login(loginValues)
      setStatusMessage(`Welcome back, ${account?.username || account?.email}!`)
      setLoginValues(initialLoginState)
      navigate('/reservations')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    try {
      const account = await register(signupValues)
      setStatusMessage(`Account created for ${account?.username || account?.email}.`)
      setSignupValues(initialSignupState)
      navigate('/reservations')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const switchToLogin = () => {
    setIsLoginMode(true)
    setErrorMessage('')
    setStatusMessage('')
  }

  const switchToSignup = () => {
    setIsLoginMode(false)
    setErrorMessage('')
    setStatusMessage('')
  }

  if (user) {
    return (
      <div className={styles.page}>
        <SectionHeading
          eyebrow="Account"
          title="You are signed in"
          description="Access your reservations, manage favorites and switch to the admin console if you have elevated permissions."
        />
        <div className={styles.card}>
          <p className={styles.helper}>Signed in as {user.username || user.email}</p>
          <div className={styles.actions}>
            <Button to="/reservations">Make a reservation</Button>
            {user.role === 'admin' && (
              <Button to="/admin" variant="outline">
                Go to admin
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow="Account"
        title={isLoginMode ? "Sign in to your account" : "Create a new account"}
        description="Save your guest preferences, access booking history and unlock member-only tastings."
      />
      {statusMessage && <p className={styles.success}>{statusMessage}</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.toggleContainer}>
        <button
          type="button"
          className={`${styles.toggleButton} ${isLoginMode ? styles.active : ''}`}
          onClick={switchToLogin}
        >
          Login
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${!isLoginMode ? styles.active : ''}`}
          onClick={switchToSignup}
        >
          Sign up
        </button>
      </div>

      <div className={styles.formContainer}>
        {isLoginMode ? (
          <form className={styles.form} onSubmit={handleLoginSubmit}>
            <h3>Login</h3>
            <div className={styles.fieldGroup}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={loginValues.email}
                onChange={handleChange(setLoginValues)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={loginValues.password}
                onChange={handleChange(setLoginValues)}
                required
              />
            </div>
            <Button type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Signing in…' : 'Login'}
            </Button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSignupSubmit}>
            <h3>Sign up</h3>
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                name="username"
                value={signupValues.username}
                onChange={handleChange(setSignupValues)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                value={signupValues.email}
                onChange={handleChange(setSignupValues)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                value={signupValues.password}
                onChange={handleChange(setSignupValues)}
                required
                minLength={8}
              />
              <p className={styles.helper}>Use 8+ characters with a number and symbol.</p>
            </div>
            <Button type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthPage


