import { FaClock, FaPhoneAlt } from 'react-icons/fa'
import { MdLocationOn, MdOutlineMail } from 'react-icons/md'

import styles from './ContactDetails.module.css'

const ContactDetails = () => {
  return (
    <div className={styles.card}>
      <h3>Visit the restaurant</h3>
      <div className={styles.row}>
        <MdLocationOn />
        <div>
          <p>14 Residency Road</p>
          <p>Bengaluru, Karnataka 560025</p>
        </div>
      </div>
      <div className={styles.row}>
        <FaClock />
        <div>
          <p>Monday – Sunday</p>
          <p>7:30 am - 1:30 am</p>
        </div>
      </div>
      <div className={styles.row}>
        <FaPhoneAlt />
        <a href="tel:+919876543210">+91 987 654 3210</a>
      </div>
      <div className={styles.row}>
        <MdOutlineMail />
        <a href="mailto:hello@mrparathas.com">hello@mrparathas.com</a>
      </div>
    </div>
  )
}

export default ContactDetails

