import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const MENU_QUERY_KEY = ['menu']

export const useMenu = (options = {}) => {
  return useQuery({
    queryKey: MENU_QUERY_KEY,
    queryFn: apiClient.getMenu,
    ...options,
  })
}

