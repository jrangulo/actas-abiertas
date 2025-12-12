'use client'

import { useFeatureSeen } from '@/hooks/use-feature-seen'

interface NewFeatureIndicatorProps {
  featureId: string
}

export function NewFeatureIndicator({ featureId }: Readonly<NewFeatureIndicatorProps>) {
  const { isNewFeature } = useFeatureSeen(featureId)

  if (!isNewFeature) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
    </span>
  )
}
