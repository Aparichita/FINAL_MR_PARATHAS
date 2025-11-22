const BASE_URL = import.meta.env.VITE_ML_API_URL || 'https://restaurant-analytics-backend-1o58.onrender.com'

// Safe fetch helper for arrays
async function fetchArray(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Network response not ok')
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error(`Failed to fetch ${url}`, err)
    return []
  }
}

export async function getTopItems() {
  return fetchArray(`${BASE_URL}/analytics/top-items`)
}

export async function getPeakHours() {
  return fetchArray(`${BASE_URL}/analytics/peak-hours`)
}

export async function getWeekendVsWeekday() {
  return fetchArray(`${BASE_URL}/analytics/weekend-vs-weekday`)
}

export async function getCategorySales() {
  return fetchArray(`${BASE_URL}/analytics/category-sales`)
}

export async function getRevenuePerDay() {
  return fetchArray(`${BASE_URL}/analytics/revenue-per-day`)
}

export default {
  getTopItems,
  getPeakHours,
  getWeekendVsWeekday,
  getCategorySales,
  getRevenuePerDay,
}
