import { useMemo, useState } from 'react'

import Button from '../components/common/Button.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import { useMenu } from '../hooks/useMenu.js'
import styles from './MenuPage.module.css'

const categories = ['all', 'appetizers', 'mains', 'desserts', 'drinks']

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { data: menuItems = [], isLoading, isError, refetch, isFetching } = useMenu()

  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'all') return menuItems
    return menuItems.filter((item) => item.category?.toLowerCase() === selectedCategory)
  }, [menuItems, selectedCategory])

  const groupedMenu = useMemo(() => {
    return filteredMenu.reduce((acc, item) => {
      const key = item.category || 'Specials'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [filteredMenu])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <SectionHeading
          eyebrow="Chef-driven menu"
          title="From charcoal tandoors to patiala cocktails"
          description="Thoughtfully curated courses inspired by vibrant Punjabi dhabas and modern Indian bistros."
        />
        <div className={styles.actions}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`${styles.filter} ${selectedCategory === category ? styles.active : ''}`}
            >
              {category}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            Refresh menu
          </Button>
        </div>
      </section>

      {isLoading && <p>Loading menu…</p>}
      {isError && <p className={styles.error}>Unable to load menu. Please try again later.</p>}

      {!isLoading &&
        !isError &&
        Object.entries(groupedMenu).map(([category, items]) => (
          <section key={category} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <p className={styles.categoryName}>{category}</p>
              <span className={styles.categoryDivider} />
            </div>
            <div className={styles.menuGrid}>
              {items.map((item) => (
                <article key={item._id} className={styles.menuCard}>
                  <div>
                    <div className={styles.menuCardHeader}>
                      <h3>{item.name}</h3>
                      <p className={styles.price}>₹{Number(item.price).toFixed(0)}</p>
                    </div>
                    <p>{item.description || 'Chef special crafted for the season.'}</p>
                  </div>
                  <p className={`${styles.badge} ${item.isAvailable ? styles.available : styles.unavailable}`}>
                    {item.isAvailable ? 'Available' : 'Temporarily unavailable'}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}

export default MenuPage

