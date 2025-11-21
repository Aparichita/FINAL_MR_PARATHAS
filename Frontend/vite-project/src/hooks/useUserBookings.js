import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const USER_BOOKINGS_QUERY_KEY = ['bookings', 'me']

export const useUserBookings = (options = {}) => {
  return useQuery({
    queryKey: USER_BOOKINGS_QUERY_KEY,
    queryFn: apiClient.getUserBookings,
    ...options,
  })
}

