import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import SectionHeading from '../components/common/SectionHeading.jsx'
import Button from '../components/common/Button.jsx'
import { useTakeawayCart } from '../hooks/useTakeawayCart.js'
import { useUserOrders } from '../hooks/useUserOrders.js'
import { useLoyaltySummary } from '../hooks/useLoyaltySummary.js'
import { apiClient } from '../services/apiClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './CartPage.module.css'

const CartPage = () => {
  const { user, refreshProfile } = useAuth()
  const {
    data: cart,
    isLoading,
    isError,
    checkout,
    isCheckingOut,
    updateItem,
    isUpdating,
  } = useTakeawayCart()
  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useUserOrders({ enabled: Boolean(user) })
  const {
    data: loyaltySummary,
    isLoading: isLoyaltyLoading,
    refetch: refetchLoyalty,
  } = useLoyaltySummary({ enabled: Boolean(user) })
  const [redeemInputs, setRedeemInputs] = useState({})
  const [loyaltyMessage, setLoyaltyMessage] = useState(null)

  const redeemMutation = useMutation({
    mutationFn: ({ orderId, points }) =>
      apiClient.redeemOrderPoints({ orderId, points }),
    onSuccess: async (_, variables) => {
      setLoyaltyMessage({
        type: 'success',
        text: 'Points redeemed successfully.',
      })
      setRedeemInputs((prev) => ({ ...prev, [variables.orderId]: '' }))
      await Promise.all([refetchOrders(), refetchLoyalty()])
      await refreshProfile?.()
    },
    onError: (error) => {
      setLoyaltyMessage({ type: 'error', text: error.message })
    },
  })

  // Add loyalty points discount calculation function
  const calculateLoyaltyDiscount = (points) => {
    // 50 points = 50 rupees discount, 100 points = 100 rupees discount, and so on
    return Math.floor(points / 50) * 50
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.heading}>
          <SectionHeading
            eyebrow="Takeaway cart"
            title="Sign in to place a takeaway order"
            description="Please sign in to add items to your cart and confirm your takeaway order."
          />
        </div>
        <Button to="/auth" variant="primary">
          Go to sign in
        </Button>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.menuItem?.price || 0)
    return sum + price * Number(item.quantity || 0)
  }, 0)

  // Calculate loyalty discount
  const currentPoints = loyaltySummary?.points ?? user?.points ?? 0
  const loyaltyDiscount = calculateLoyaltyDiscount(currentPoints)
  const total = Math.max(subtotal - loyaltyDiscount, 0)

  const handleCheckout = async () => {
    if (!items.length) return
    try {
      await checkout({ paymentMethod: 'Cash at Shop' })
      // basic UX: page will show empty cart after successful checkout
    } catch {
      // error surfaced via global error handler
    }
  }

  const handleIncrement = async (item) => {
    const currentQty = Number(item.quantity || 0)
    try {
      await updateItem({ menuItemId: item.menuItem?._id, quantity: currentQty + 1 })
    } catch {
      // handled globally
    }
  }

  const handleDecrement = async (item) => {
    const currentQty = Number(item.quantity || 0)
    if (currentQty === 0) return
    const nextQty = currentQty - 1
    try {
      await updateItem({ menuItemId: item.menuItem?._id, quantity: Math.max(nextQty, 0) })
    } catch {
      // handled globally
    }
  }

  const disableControls = isUpdating || isCheckingOut
  const loyaltyStats = [
    {
      label: 'Current points',
      value: currentPoints,
    },
    {
      label: 'Available discount',
      value: `₹${loyaltyDiscount}`,
    },
  ]

  const handleRedeemInputChange = (orderId, value) => {
    setRedeemInputs((prev) => ({ ...prev, [orderId]: value }))
  }

  const handleRedeemPoints = async (orderId) => {
    const rawValue = Number(redeemInputs[orderId])
    if (!Number.isInteger(rawValue) || rawValue <= 0) {
      setLoyaltyMessage({
        type: 'error',
        text: 'Enter a valid number of points to redeem.',
      })
      return
    }
    try {
      await redeemMutation.mutateAsync({ orderId, points: rawValue })
    } catch {
      // handled via mutation onError
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <SectionHeading
          eyebrow="Takeaway cart"
          title="Review your takeaway order"
          description="Confirm your items for pickup. A confirmation email with your order ID will be sent to you and the restaurant."
        />
      </div>

      {isLoading && <p>Loading cart…</p>}
      {isError && <p className={styles.error}>Unable to load cart. Please try again.</p>}

      {!isLoading && !items.length && <p className={styles.emptyState}>Your cart is empty. Add items from the menu to get started.</p>}

      {!isLoading && items.length > 0 && (
        <>
          <div className={styles.cartGrid}>
            {items.map((item) => {
              const price = Number(item.menuItem?.price || 0)
              const itemSubtotal = price * Number(item.quantity || 0)
              return (
                <article key={item.menuItem?._id} className={styles.cartItem}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <h3>{item.menuItem?.name}</h3>
                      <p className={styles.itemPrice}>₹{price.toFixed(0)}</p>
                    </div>
                    <p className={styles.itemDescription}>{item.menuItem?.description || 'Selected for takeaway.'}</p>
                  </div>
                  <div className={styles.itemFooter}>
                    <div className={styles.itemSubtotal}>
                      <span>Subtotal</span>
                      <strong>₹{itemSubtotal.toFixed(0)}</strong>
                    </div>
                    <div className={styles.quantityControls}>
                      <button
                        type="button"
                        onClick={() => handleDecrement(item)}
                        disabled={disableControls}
                        className={styles.quantityButton}
                        aria-label={`Reduce ${item.menuItem?.name}`}
                      >
                        −
                      </button>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleIncrement(item)}
                        disabled={disableControls}
                        className={styles.quantityButton}
                        aria-label={`Add more ${item.menuItem?.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className={styles.summaryBar}>
            <div className={styles.summaryDetails}>
              <p>Subtotal: <strong>₹{Number(subtotal).toFixed(0)}</strong></p>
              {loyaltyDiscount > 0 && (
                <p>Loyalty Discount: <strong>-₹{loyaltyDiscount.toFixed(0)}</strong></p>
              )}
              <p>Total: <strong>₹{Number(total).toFixed(0)}</strong></p>
            </div>
            <Button size="md" onClick={handleCheckout} disabled={isCheckingOut || !items.length}>
              {isCheckingOut ? 'Placing order…' : 'Confirm takeaway order'}
            </Button>
          </div>
        </>
      )}

      <section className={styles.loyaltyPanel}>
        <div className={styles.heading}>
          <SectionHeading
            eyebrow="Loyalty"
            title="Track and redeem your dine-in points"
            description="Earn points on dine-in orders and redeem them for instant bill discounts."
          />
        </div>
        {(isLoyaltyLoading || isOrdersLoading) && <p>Loading loyalty insights…</p>}
        {!isLoyaltyLoading && (
          <div className={styles.loyaltyGrid}>
            {loyaltyStats.map((stat) => (
              <article key={stat.label} className={styles.loyaltyCard}>
                <p className={styles.loyaltyLabel}>{stat.label}</p>
                <p className={styles.loyaltyValue}>{stat.value}</p>
              </article>
            ))}
          </div>
        )}
        {loyaltyMessage && (
          <p
            className={
              loyaltyMessage.type === 'error'
                ? styles.feedbackError
                : styles.feedbackSuccess
            }
          >
            {loyaltyMessage.text}
          </p>
        )}
        <div className={styles.ordersTableWrapper}>
          {isOrdersLoading && <p>Loading your dine-in orders…</p>}
          {!isOrdersLoading && orders.length === 0 && (
            <p className={styles.muted}>Your dine-in orders will appear here once placed at the restaurant.</p>
          )}
          {!isOrdersLoading && orders.length > 0 && (
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Points earned</th>
                  <th>Redeemed</th>
                  <th>Redeem points</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const pointsEarned = Number(order.meta?.pointsEarned || 0)
                  const redeemedPoints = Number(order.meta?.redeemedPoints || 0)
                  const isRedeemed = redeemedPoints > 0
                  const isCancelled = order.orderStatus === 'Cancelled'
                  const disableRedeem =
                    isRedeemed || isCancelled || (user?.points ?? 0) === 0 || redeemMutation.isPending

                  return (
                    <tr key={order._id}>
                      <td>{order._id}</td>
                      <td>{order.orderStatus}</td>
                      <td>₹{Number(order.totalAmount).toFixed(0)}</td>
                      <td>{pointsEarned}</td>
                      <td>{redeemedPoints || '—'}</td>
                      <td>
                        <div className={styles.redeemControls}>
                          <input
                            type="number"
                            min="1"
                            max={user?.points || undefined}
                            placeholder="Points"
                            value={redeemInputs[order._id] ?? ''}
                            onChange={(event) =>
                              handleRedeemInputChange(order._id, event.target.value)
                            }
                            disabled={disableRedeem}
                            className={styles.redeemInput}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={disableRedeem}
                            onClick={() => handleRedeemPoints(order._id)}
                          >
                            Redeem
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

export default CartPage