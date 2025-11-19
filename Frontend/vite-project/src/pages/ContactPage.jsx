import SectionHeading from '../components/common/SectionHeading.jsx'
import ContactDetails from '../components/contact/ContactDetails.jsx'
import ContactForm from '../components/contact/ContactForm.jsx'
import styles from './ContactPage.module.css'

const mapEmbed =
"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.1108040002887!2d77.71521347489288!3d12.964760987349958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae13001085dc09%3A0x81513be004428a95!2sMR.%20PARATHAS!5e0!3m2!1sen!2sin!4v1763526623808!5m2!1sen!2sin" 
const ContactPage = () => {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <SectionHeading
          align="center"
          eyebrow="Visit"
          title="We are in the heart of ACES LAYOUT"
          description="Drop by for a walk-in lunch, plan celebrations with our events team or simply say hello. Our reservations crew replies within the hour."
        />
        <p className={styles.inlineHighlight}>Daily · 7:30 am – 1:30 am</p>
      </section>

      <div className={styles.grid}>
        <div>
          <SectionHeading
            eyebrow="Write to us"
            title="Tell us about your plans"
            description="Share your queries on private dining, catering or collaborations. We respond with curated recommendations and next steps."
          />
          <ContactForm />
        </div>

        <div className={styles.details}>
          <ContactDetails />
          <div className={styles.mapCard}>
            <iframe
              src={mapEmbed}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title="Mr. Parathas location map"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage


