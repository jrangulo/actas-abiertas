'use client'

import { useCallback, useMemo } from 'react'

const STORAGE_KEY = 'actas-abiertas-last-seen-post'

export function useNewPosts(latestPostDate: string | null) {
  // Derivamos el estado en vez de setState dentro de useEffect (lint: react-hooks/set-state-in-effect)
  const hasNewPosts = useMemo(() => {
    if (!latestPostDate) return false
    if (typeof window === 'undefined') return false

    const lastSeen = localStorage.getItem(STORAGE_KEY)
    if (!lastSeen) return true

    const lastSeenDate = new Date(lastSeen)
    const latestDate = new Date(latestPostDate)
    return latestDate > lastSeenDate
  }, [latestPostDate])

  const markAsSeen = useCallback(() => {
    if (latestPostDate) {
      localStorage.setItem(STORAGE_KEY, latestPostDate)
    }
  }, [latestPostDate])

  return { hasNewPosts, markAsSeen }
}
