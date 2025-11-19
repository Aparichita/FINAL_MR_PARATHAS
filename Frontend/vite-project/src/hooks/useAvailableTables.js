import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const AVAILABLE_TABLES_QUERY_KEY = ['tables', 'available']

export const useAvailableTables = (bookingDate) => {
  return useQuery({
    queryKey: [...AVAILABLE_TABLES_QUERY_KEY, bookingDate?.toISOString()],
    queryFn: () => apiClient.getAvailableTables(bookingDate),
    enabled: !!bookingDate, // Only fetch when bookingDate is provided
  })
}

