import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient.js'

export const TAKEAWAY_CART_QUERY_KEY = ['takeawayCart']

export const useTakeawayCart = () => {
  const queryClient = useQueryClient()

  const cartQuery = useQuery({
    queryKey: TAKEAWAY_CART_QUERY_KEY,
    queryFn: apiClient.getTakeawayCart,
  })

  const addMutation = useMutation({
    mutationFn: apiClient.addToTakeawayCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_CART_QUERY_KEY })
    },
  })

  const updateMutation = useMutation({
    mutationFn: apiClient.updateTakeawayCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_CART_QUERY_KEY })
    },
  })

  const removeMutation = useMutation({
    mutationFn: apiClient.removeTakeawayCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_CART_QUERY_KEY })
    },
  })

  const clearMutation = useMutation({
    mutationFn: apiClient.clearTakeawayCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_CART_QUERY_KEY })
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: apiClient.checkoutTakeawayCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAKEAWAY_CART_QUERY_KEY })
    },
  })

  return {
    ...cartQuery,
    addItem: addMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    removeItem: removeMutation.mutateAsync,
    clearCart: clearMutation.mutateAsync,
    checkout: checkoutMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
    isClearing: clearMutation.isPending,
    isCheckingOut: checkoutMutation.isPending,
  }
}


