import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const USER_ORDERS_QUERY_KEY = ['orders', 'me']

export const useUserOrders = (options = {}) => {
  return useQuery({
    queryKey: USER_ORDERS_QUERY_KEY,
    queryFn: apiClient.getMyOrders,
    ...options,
  })
}

