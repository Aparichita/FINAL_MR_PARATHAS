import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const LOYALTY_SUMMARY_QUERY_KEY = ['loyalty', 'summary']

export const useLoyaltySummary = (options = {}) => {
  return useQuery({
    queryKey: LOYALTY_SUMMARY_QUERY_KEY,
    queryFn: apiClient.getLoyaltySummary,
    ...options,
  })
}

