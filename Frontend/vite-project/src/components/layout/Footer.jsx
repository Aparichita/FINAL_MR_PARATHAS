import { FaFacebook, FaInstagram, FaPhoneAlt } from 'react-icons/fa'
import { MdOutlineEmail } from 'react-icons/md'

import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>Mr. Parathas</p>
          <p className={styles.muted}>
            Elevated North Indian comfort food, crafted with seasonal ingredients and slow-fire techniques.
          </p>
        </div>

        <div>
          <p className={styles.heading}>Visit us</p>
          <p className={styles.muted}>14 Residency Road, Bengaluru</p>
          <p className={styles.muted}>Open daily · 11am – 11pm</p>
        </div>

        <div>
          <p className={styles.heading}>Contact</p>
          <a href="tel:+919876543210" className={styles.contact}>
            <FaPhoneAlt /> +91 987 654 3210
          </a>
          <a href="mailto:reservations@mrparathas.com" className={styles.contact}>
            <MdOutlineEmail /> reservations@mrparathas.com
          </a>
        </div>

        <div>
          <p className={styles.heading}>Social</p>
          <div className={styles.socials}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebook />
            </a>
          </div>
        </div>
      </div>
      <p className={styles.copy}>© {new Date().getFullYear()} Mr. Parathas. Crafted with flavor.</p>
    </footer>
  )
}

export default Footer

