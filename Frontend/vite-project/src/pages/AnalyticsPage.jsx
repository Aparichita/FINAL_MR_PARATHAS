import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  getRevenuePerDay,
  getTopItems,
  getPeakHours,
  getWeekendVsWeekday,
  getCategorySales,
} from '../api/analytics'
import { predictTomorrow, getSalesTrend, predictPeakHour, predictItemDemand } from '../api/ml'

const CARD = {
  background: 'var(--color-surface)',
  padding: 16,
  borderRadius: 16,
  boxShadow: '0 12px 30px rgba(42,27,17,0.06)',
}

const COLORS = ['#E67E22', '#F8C471', '#A3C9A8', '#7A4F2A', '#5E3D2E', '#2F4F4F']

export default function AnalyticsPage() {
  // --- Analytics states ---
  const [revenuePerDay, setRevenuePerDay] = useState([])
  const [topItems, setTopItems] = useState([])
  const [peakHours, setPeakHours] = useState([])
  const [weekendVsWeekday, setWeekendVsWeekday] = useState([])
  const [categorySales, setCategorySales] = useState([])

  // --- ML states ---
  const [predTomorrow, setPredTomorrow] = useState(null)
  const [salesTrend, setSalesTrend] = useState([])
  const [predPeakHour, setPredPeakHour] = useState(null)
  const [predItemDemand, setPredItemDemand] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadAnalytics = async () => {
      try {
        setLoading(true)

        const results = await Promise.allSettled([
          getRevenuePerDay(),
          getTopItems(),
          getPeakHours(),
          getWeekendVsWeekday(),
          getCategorySales(),
          predictTomorrow(),
          getSalesTrend(),
          predictPeakHour(),
          predictItemDemand(7),
        ])

        if (!mounted) return

        const safeArray = (res) =>
          res.status === 'fulfilled' && Array.isArray(res.value) ? res.value : []

        // --- Analytics ---
        setRevenuePerDay(safeArray(results[0]))
        setTopItems(safeArray(results[1]))
        setPeakHours(safeArray(results[2]))
        setWeekendVsWeekday(safeArray(results[3]))
        setCategorySales(safeArray(results[4]))

        // --- ML ---
        setPredTomorrow(results[5].status === 'fulfilled' ? results[5].value : null)
        const trend = results[6].status === 'fulfilled' ? results[6].value : []
        if (Array.isArray(trend)) setSalesTrend(trend)
        else if (trend?.series) setSalesTrend(trend.series)
        else setSalesTrend([])
        setPredPeakHour(results[7].status === 'fulfilled' ? results[7].value : null)
        setPredItemDemand(results[8].status === 'fulfilled' ? results[8].value : null)
      } catch (err) {
        console.error('AnalyticsPage error:', err)
        setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAnalytics()
    return () => {
      mounted = false
    }
  }, [])

  const handleDownloadOrders = async () => {
    try {
      const BASE = import.meta.env.VITE_ML_API_URL || 'https://restaurant-analytics-backend-1o58.onrender.com'
      const res = await fetch(`${BASE}/download/orders`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.csv'
      a.click()
    } catch (err) {
      console.error(err)
      alert('Failed to download orders')
    }
  }

  const handleAddOrder = async () => {
    try {
      const body = { item: 'Paratha', quantity: 2, price: 50 }
      const BASE = import.meta.env.VITE_ML_API_URL || 'https://restaurant-analytics-backend-1o58.onrender.com'
      const res = await fetch(`${BASE}/orders/add-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      console.log('Order added', data)
      alert('Order added successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to add order')
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading analytics…</div>
  if (error) return <div style={{ padding: 20 }}>Unable to load analytics. Try again later.</div>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Analytics Dashboard</h1>

      {/* --- Predictions --- */}
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div style={CARD}>
          <h3>Prediction — Tomorrow</h3>
          <p>Predicted orders: <strong>{predTomorrow?.predicted_orders ?? '—'}</strong></p>
          <p style={{ color: 'rgba(47,79,79,0.7)' }}>{predTomorrow?.method ?? ''}</p>
        </div>

        <div style={CARD}>
          <h3>ML: Predicted Peak Hour</h3>
          <p style={{ fontSize: 20, margin: '8px 0' }}>{predPeakHour?.hour ?? '—'}</p>
          <p style={{ color: 'rgba(47,79,79,0.7)' }}>
            {predPeakHour?.confidence ? `${(predPeakHour.confidence * 100).toFixed(0)}%` : ''}
          </p>
        </div>

        <div style={CARD}>
          <h3>ML: Predicted Item Demand</h3>
          <p style={{ fontSize: 18, margin: '8px 0' }}>{predItemDemand?.item ?? '—'}</p>
          <p style={{ color: 'rgba(47,79,79,0.7)' }}>
            {predItemDemand?.score ? `score: ${predItemDemand.score}` : ''}
          </p>
        </div>
      </div>

      {/* --- Revenue & Sales Trend --- */}
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', marginTop: 18 }}>
        <div style={CARD}>
          <h3>Revenue Per Day</h3>
          {revenuePerDay.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenuePerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" label={{ value: 'Date', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="total_amount" stroke="#E67E22" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p>No revenue data available</p>}
        </div>

        <div style={CARD}>
          <h3>Sales Trend (ML)</h3>
          {salesTrend.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" label={{ value: 'Date', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Sales', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6B8F71" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'rgba(47,79,79,0.7)' }}>Not enough sales data</p>}
        </div>
      </div>

      {/* --- Top Items & Category Sales --- */}
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 18 }}>
        <div style={CARD}>
          <h3>Top Selling Items</h3>
          {topItems.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="item" label={{ value: 'Item', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#E67E22" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No top item data available</p>}
        </div>

        <div style={CARD}>
          <h3>Category Sales</h3>
          {categorySales.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categorySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" label={{ value: 'Category', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#7A4F2A" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No category sales available</p>}
        </div>
      </div>

      {/* --- Peak Hours & Weekend vs Weekday --- */}
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 18 }}>
        <div style={CARD}>
          <h3>Peak Hours</h3>
          {peakHours.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Orders', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  fill="#A67C52"
                  label={{ position: 'top' }}
                  // Optional: highlight peak hour
                  >
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No peak hours data available</p>}
        </div>

        <div style={CARD}>
          <h3>Weekend vs Weekday</h3>
          {weekendVsWeekday.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={weekendVsWeekday}
                  dataKey="orders"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {weekendVsWeekday.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p>No weekend/weekday data available</p>}
        </div>
      </div>

      {/* --- Orders --- */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={handleDownloadOrders}>Download Orders</button>
        <button onClick={handleAddOrder}>Add Order</button>
      </div>
    </div>
  )
}
