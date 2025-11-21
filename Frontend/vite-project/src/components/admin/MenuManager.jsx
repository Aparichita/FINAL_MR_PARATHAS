import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiTrash2 } from 'react-icons/fi'

import Button from '../common/Button.jsx'
import { useMenu, MENU_QUERY_KEY } from '../../hooks/useMenu.js'
import { apiClient } from '../../services/apiClient.js'
import styles from './Admin.module.css'

const categories = ['appetizers', 'mains', 'desserts', 'drinks', 'parathas']

const MenuManager = () => {
  const queryClient = useQueryClient()
  const { data: menuItems = [], isLoading } = useMenu()
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    category: 'mains',
    price: '',
    isAvailable: true,
  })

  const { mutateAsync, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: apiClient.createMenuItem,
    onSuccess: () => {
      setFormValues({
        name: '',
        description: '',
        category: 'mains',
        price: '',
        isAvailable: true,
      })
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY })
    },
  })

  const { mutateAsync: deleteItem, isPending: isDeleting, isSuccess: deleteSuccess, isError: deleteError, error: deleteErrorMsg } = useMutation({
    mutationFn: apiClient.deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY })
    },
  })

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteItem(id)
      } catch {
        // handled by mutation state
      }
    }
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formValues.name || !formValues.price) return
    try {
      await mutateAsync({
        name: formValues.name,
        description: formValues.description,
        category: formValues.category,
        price: Number(formValues.price),
        isAvailable: formValues.isAvailable,
      })
    } catch {
      // handled by mutation state
    }
  }

  return (
    <section className={styles.panel}>
      <div>
        <p className={styles.panelEyebrow}>Menu manager</p>
        <h3 className={styles.panelTitle}>Add a seasonal dish</h3>
        <p className={styles.panelDescription}>
          Keep the public menu updated with chef specials and beverage pairings.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="menu-name">Name</label>
            <input id="menu-name" name="name" value={formValues.name} onChange={handleChange} required placeholder="Smoked paneer tikka" />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="menu-category">Category</label>
            <select id="menu-category" name="category" value={formValues.category} onChange={handleChange}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="menu-price">Price (₹)</label>
            <input id="menu-price" name="price" type="number" min="0" step="10" value={formValues.price} onChange={handleChange} required />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="menu-description">Description</label>
          <textarea
            id="menu-description"
            name="description"
            rows="3"
            value={formValues.description}
            onChange={handleChange}
            placeholder="Stone-ground spices, kasoori methi smoke and clarified butter drizzle."
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="menu-available">Mark as available</label>
          <input
            id="menu-available"
            name="isAvailable"
            type="checkbox"
            checked={formValues.isAvailable}
            onChange={handleChange}
          />
        </div>

        <Button type="submit" size="md" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save item'}
        </Button>

        {isSuccess && <p className={styles.success}>Menu updated.</p>}
        {isError && <p className={styles.error}>{error.message}</p>}
      </form>

      <div>
        <p className={styles.badge}>Live menu preview</p>
        {isLoading && <p className={styles.muted}>Loading menu…</p>}
        {!isLoading && menuItems.length === 0 && <p className={styles.muted}>No dishes yet.</p>}
        {deleteSuccess && <p className={styles.success}>Item deleted successfully.</p>}
        {deleteError && <p className={styles.error}>{deleteErrorMsg?.message || 'Failed to delete item'}</p>}
        {!isLoading && menuItems.length > 0 && (
          <div className={styles.scrollArea}>
            <ul className={styles.list}>
              {menuItems.map((item) => (
                <li key={item._id} className={styles.listItem}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <strong>{item.name}</strong>
                  <span className={styles.muted}>
                    ₹{Number(item.price).toFixed(0)} · {item.category}
                  </span>
                  <span className={styles.status}>
                    {item.isAvailable ? (
                      <span className={styles.statusConfirmed}>Available</span>
                    ) : (
                      <span className={styles.statusCancelled}>Paused</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id, item.name)}
                  disabled={isDeleting}
                  className={styles.deleteBtn}
                  aria-label={`Delete ${item.name}`}
                  title="Delete item"
                >
                  <FiTrash2 />
                </button>
              </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export default MenuManager


