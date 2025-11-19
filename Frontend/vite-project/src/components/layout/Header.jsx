import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import clsx from 'clsx'

import Button from '../common/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './Header.module.css'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  //{ label: 'Contact', path: '/contact' },
  { label: 'Admin', path: '/admin' },
]

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isAuthenticating } = useAuth()

  const closeMenu = () => setIsOpen(false)
  const handleLogout = async () => {
    await logout()
    closeMenu()
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          Mr. Parathas
        </Link>

        <button className={styles.menuToggle} onClick={() => setIsOpen((prev) => !prev)} aria-label="Toggle navigation">
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav className={clsx(styles.nav, isOpen && styles.open)}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
          <div className={styles.accountArea}>
            {!user ? (
              <Button to="/auth" variant="ghost" className={styles.accountButton} onClick={closeMenu}>
                Sign in
              </Button>
            ) : (
              <div className={styles.userActions}>
                <span className={styles.userChip}>Hi {user.username || user.email}</span>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  disabled={isAuthenticating}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header

