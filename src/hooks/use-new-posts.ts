'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'actas-abiertas-last-seen-post'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function useNewPosts(latestPostDate: string | null) {
  const hasNewPosts = useSyncExternalStore(
    subscribe,
    // Client snapshot
    () => {
      if (!latestPostDate) return false
      const lastSeen = localStorage.getItem(STORAGE_KEY)
      if (!lastSeen) return true
      return new Date(latestPostDate) > new Date(lastSeen)
    },
    // Server snapshot - always false to avoid hydration mismatch
    () => false
  )

  const markAsSeen = useCallback(() => {
    if (latestPostDate) {
      localStorage.setItem(STORAGE_KEY, latestPostDate)
      // Dispatch storage event to trigger re-render
      window.dispatchEvent(new StorageEvent('storage'))
    }
  }, [latestPostDate])

  return { hasNewPosts, markAsSeen }
}
