const BASE_URL = import.meta.env.VITE_ML_API_URL || 'https://restaurant-analytics-backend-1o58.onrender.com'

// Safe fetch helper for objects or arrays
async function fetchSafe(url, defaultValue = {}) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Network response not ok')
    const data = await res.json()
    return data ?? defaultValue
  } catch (err) {
    console.error(`Failed to fetch ${url}`, err)
    return defaultValue
  }
}

export async function predictTomorrow() {
  return fetchSafe(`${BASE_URL}/ml/ml/predict-tomorrow`, {})
}

// Optional n_days parameter
export async function predictItemDemand(n_days = 7) {
  return fetchSafe(
    `${BASE_URL}/ml/ml/predict-item-demand?n_days=${n_days}`,
    {}
  )
}

export async function predictPeakHour() {
  return fetchSafe(`${BASE_URL}/ml/ml/predict-peak-hour`, {})
}

export async function getSalesTrend() {
  return fetchSafe(`${BASE_URL}/ml/ml/sales-trend`, [])
}

export default {
  predictTomorrow,
  predictItemDemand,
  predictPeakHour,
  getSalesTrend,
}
