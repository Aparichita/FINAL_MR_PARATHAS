import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
})

export const ACCESS_TOKEN_STORAGE_KEY = 'restaurant_access_token'
export const REFRESH_TOKEN_STORAGE_KEY = 'restaurant_refresh_token'

const tokenStorageKey = ACCESS_TOKEN_STORAGE_KEY
const refreshTokenStorageKey = REFRESH_TOKEN_STORAGE_KEY

if (typeof window !== 'undefined') {
  const savedToken = window.localStorage.getItem(tokenStorageKey)
  if (savedToken) {
    api.defaults.headers.common.Authorization = `Bearer ${savedToken}`
  }
}

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? null

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(tokenStorageKey, token)
    }
  } else {
    delete api.defaults.headers.common.Authorization
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(tokenStorageKey)
    }
  }
}

export const setRefreshToken = (token) => {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(refreshTokenStorageKey, token)
  } else {
    window.localStorage.removeItem(refreshTokenStorageKey)
  }
}

const handleError = (error) => {
  // Handle validation errors from backend
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
    const validationMessages = error.response.data.errors.map((err) => err.message || `${err.field}: ${err.message}`).join(', ')
    return Promise.reject(new Error(validationMessages))
  }
  // Handle regular API errors
  const apiError = error?.response?.data?.message ?? error.message ?? 'Something went wrong'
  return Promise.reject(new Error(apiError))
}

api.interceptors.response.use((response) => response, handleError)

export const apiClient = {
  getMenu: async () => {
    const response = await api.get('/menu')
    return unwrapResponse(response) ?? []
  },
  getAvailableTables: async (bookingDate) => {
    const params = bookingDate ? { bookingDate: bookingDate.toISOString() } : {}
    const response = await api.get('/tables/available', { params })
    return unwrapResponse(response) ?? []
  },
  bookReservation: async (payload) => {
    const response = await api.post('/tables/bookings/create', payload)
    return unwrapResponse(response)
  },
  submitContact: async (payload) => {
    const response = await api.post('/contact', payload)
    return unwrapResponse(response)
  },
  register: async (payload) => {
    const response = await api.post('/auth/register', payload)
    return unwrapResponse(response)
  },
  fetchReservations: async () => {
    const response = await api.get('/tables/bookings')
    return unwrapResponse(response) ?? []
  },
  fetchContactMessages: async () => {
    const response = await api.get('/contact')
    return unwrapResponse(response) ?? []
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return unwrapResponse(response)
  },
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken })
    return unwrapResponse(response)
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return unwrapResponse(response)
  },
  createMenuItem: async (payload) => {
    const response = await api.post('/menu', payload)
    return unwrapResponse(response)
  },
  updateMenuItem: async (id, payload) => {
    const response = await api.put(`/menu/${id}`, payload)
    return unwrapResponse(response)
  },
  deleteMenuItem: async (id) => {
    const response = await api.delete(`/menu/${id}`)
    return unwrapResponse(response)
  },
  updateBookingStatus: async (id, operationalStatus) => {
    const response = await api.put(`/tables/bookings/${id}/status`, { operationalStatus })
    return unwrapResponse(response)
  },
}

