import clsx from 'clsx'
import styles from './SectionHeading.module.css'

const SectionHeading = ({ eyebrow, title, description, align = 'left', className }) => {
  return (
    <div className={clsx(styles.wrapper, styles[align], className)}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}

export default SectionHeading

