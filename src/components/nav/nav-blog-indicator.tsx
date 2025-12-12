'use client'

import { useNewPosts } from '@/hooks/use-new-posts'

interface NavBlogIndicatorProps {
  latestPostDate: string | null
}

export function NavBlogIndicator({ latestPostDate }: NavBlogIndicatorProps) {
  const { hasNewPosts } = useNewPosts(latestPostDate)

  if (!hasNewPosts) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
    </span>
  )
}
