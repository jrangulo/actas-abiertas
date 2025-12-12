'use client'

import { useEffect } from 'react'
import { useNewPosts } from '@/hooks/use-new-posts'

interface BlogSeenMarkerProps {
  latestPostDate: string | null
}

export function BlogSeenMarker({ latestPostDate }: BlogSeenMarkerProps) {
  const { markAsSeen } = useNewPosts(latestPostDate)

  useEffect(() => {
    // Mark as seen when the blog page is visited
    markAsSeen()
  }, [markAsSeen])

  return null
}
