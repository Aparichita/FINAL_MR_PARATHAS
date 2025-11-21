import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

import {
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  apiClient,
  setAuthToken,
  setRefreshToken as persistRefreshToken,
} from '../services/apiClient.js'

const AuthContext = createContext(null)

const userStorageKey = 'restaurant_user'

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthTokenState] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  })
  const [refreshToken, setRefreshTokenState] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  })
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(userStorageKey)
    return stored ? JSON.parse(stored) : null
  })
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [authError, setAuthError] = useState(null)

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(userStorageKey, JSON.stringify(nextUser))
    }
  }, [])

  const clearStoredUser = useCallback(() => {
    setUser(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(userStorageKey)
    }
  }, [])

  const applySession = (payload) => {
    const nextUser = payload?.user ?? payload
    const access = payload?.accessToken
    const refresh = payload?.refreshToken

    if (access) {
      setAuthToken(access)
      setAuthTokenState(access)
    }

    if (typeof refresh !== 'undefined') {
      persistRefreshToken(refresh)
      setRefreshTokenState(refresh ?? null)
    }

    if (nextUser) {
      persistUser(nextUser)
    }

    return nextUser
  }

  const login = async (credentials) => {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      const data = await apiClient.login(credentials)
      return applySession(data)
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  const register = async (payload) => {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      const data = await apiClient.register(payload)
      return applySession(data)
    } catch (error) {
      setAuthError(error.message)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout(refreshToken ?? undefined)
    } catch {
      // safe to ignore logout failures client-side
    } finally {
      setAuthToken(null)
      setAuthTokenState(null)
      persistRefreshToken(null)
      setRefreshTokenState(null)
      clearStoredUser()
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!authToken) return null
    setIsLoadingUser(true)
    try {
      const currentUser = await apiClient.getCurrentUser()
      persistUser(currentUser)
      return currentUser
    } catch {
      return null
    } finally {
      setIsLoadingUser(false)
    }
  }, [authToken, persistUser])

  useEffect(() => {
    if (!authToken || user) return
    let isMounted = true
    setIsLoadingUser(true)
    const loadUser = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser()
        if (isMounted && currentUser) {
          persistUser(currentUser)
        }
      } catch {
        if (!isMounted) return
        setAuthToken(null)
        setAuthTokenState(null)
        persistRefreshToken(null)
        setRefreshTokenState(null)
        clearStoredUser()
      } finally {
        if (isMounted) {
          setIsLoadingUser(false)
        }
      }
    }
    loadUser()
    return () => {
      isMounted = false
    }
  }, [authToken, user])

  const value = useMemo(
    () => ({
      user,
      authToken,
      login,
      register,
      logout,
       refreshProfile,
      refreshToken,
      isAuthenticating,
      isLoadingUser,
      authError,
    }),
    [user, authToken, refreshToken, isAuthenticating, isLoadingUser, authError, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}

