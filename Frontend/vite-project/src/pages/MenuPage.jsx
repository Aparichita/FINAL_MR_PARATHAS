import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../components/common/Button.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import { useMenu } from '../hooks/useMenu.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTakeawayCart } from '../hooks/useTakeawayCart.js'
import styles from './MenuPage.module.css'

const categories = ['all', 'appetizers', 'mains', 'desserts', 'drinks', 'parathas']

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { data: menuItems = [], isLoading, isError, refetch, isFetching } = useMenu()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: cartData, addItem, updateItem, isAdding, isUpdating } = useTakeawayCart()

  const cartItemsById = useMemo(() => {
    const items = cartData?.items || []
    return items.reduce((acc, current) => {
      if (current?.menuItem?._id) {
        acc[current.menuItem._id] = current
      }
      return acc
    }, {})
  }, [cartData])

  const guardAuth = useCallback(() => {
    if (!user) {
      navigate('/auth')
      return false
    }
    return true
  }, [navigate, user])

  const handleIncrement = async (item) => {
    if (!guardAuth()) return
    try {
      const currentQty = Number(cartItemsById[item._id]?.quantity || 0)
      if (currentQty === 0) {
        await addItem({ menuItem: item._id, quantity: 1 })
      } else {
        await updateItem({ menuItemId: item._id, quantity: currentQty + 1 })
      }
    } catch {
      // errors are handled by mutation error if needed
    }
  }

  const handleDecrement = async (item) => {
    if (!guardAuth()) return
    const currentQty = Number(cartItemsById[item._id]?.quantity || 0)
    if (currentQty === 0) return
    try {
      const nextQty = currentQty - 1
      await updateItem({ menuItemId: item._id, quantity: Math.max(nextQty, 0) })
    } catch {
      // handled by mutation error
    }
  }

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
              {items.map((item) => {
                const currentQty = Number(cartItemsById[item._id]?.quantity || 0)
                const isBusy = isAdding || isUpdating
                const disableControls = !item.isAvailable || isBusy

                return (
                  <article key={item._id} className={styles.menuCard}>
                    <div>
                      <div className={styles.menuCardHeader}>
                        <h3>{item.name}</h3>
                        <p className={styles.price}>₹{Number(item.price).toFixed(0)}</p>
                      </div>
                      <p>{item.description || 'Chef special crafted for the season.'}</p>
                    </div>
                    <div className={styles.menuCardFooter}>
                      <p className={`${styles.badge} ${item.isAvailable ? styles.available : styles.unavailable}`}>
                        {item.isAvailable ? 'Available' : 'Temporarily unavailable'}
                      </p>
                      {currentQty > 0 ? (
                        <div className={styles.quantityControls}>
                          <button
                            type="button"
                            onClick={() => handleDecrement(item)}
                            disabled={disableControls}
                            className={styles.quantityButton}
                            aria-label={`Reduce ${item.name}`}
                          >
                            −
                          </button>
                          <span className={styles.quantityValue}>{currentQty}</span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(item)}
                            disabled={disableControls}
                            className={styles.quantityButton}
                            aria-label={`Add more ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIncrement(item)}
                          disabled={disableControls}
                        >
                          Add to cart
                        </Button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
    </div>
  )
}

export default MenuPage

