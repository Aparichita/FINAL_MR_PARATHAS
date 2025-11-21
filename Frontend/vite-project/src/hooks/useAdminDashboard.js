import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const ADMIN_DASHBOARD_QUERY_KEY = ['admin', 'dashboard']

export const useAdminDashboard = (options = {}) => {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: apiClient.getAdminDashboard,
    ...options,
  })
}

