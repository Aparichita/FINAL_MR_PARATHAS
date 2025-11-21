import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const ADMIN_LOYALTY_QUERY_KEY = ['admin', 'loyalty']

export const useAdminLoyalty = (options = {}) => {
  return useQuery({
    queryKey: ADMIN_LOYALTY_QUERY_KEY,
    queryFn: apiClient.getAdminLoyaltyOverview,
    ...options,
  })
}

