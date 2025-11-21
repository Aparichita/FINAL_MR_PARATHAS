import React from 'react'
import Button from '../common/Button.jsx'
import styles from './Admin.module.css'

const SeasonalDish = () => {
  return (
    <section className={styles.panel} aria-live="polite">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className={styles.panelEyebrow}>Seasonal</p>
          <h3 className={styles.panelTitle}>Methi Paneer Stuffed Paratha</h3>
        </div>
        <div>
          <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>₹199</span>
        </div>
      </div>

      <p style={{ marginTop: 8, color: 'rgba(47,79,79,0.8)' }}>
        A comforting stuffed paratha with fresh fenugreek and mild paneer, finished with a touch of ghee — perfect for chilly evenings.
      </p>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Button size="sm">Edit</Button>
        <Button variant="outline" size="sm">Remove</Button>
      </div>
    </section>
  )
}

export default SeasonalDish
