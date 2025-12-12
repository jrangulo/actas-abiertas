/**
 * Hook para rastrear si ciertas características han sido vistas por el usuario.
 * Almacena el estado de las características en localStorage como un mapa: { featureId: true/false }
 *
 * @example
 * // Uso básico en un componente
 * function MyFeature() {
 *   const { isNewFeature, markFeatureAsSeen } = useFeatureSeen('feature-v2-charts')
 *
 *   const handleClick = () => {
 *     markFeatureAsSeen()
 *     // ... rest of click logic
 *   }
 *
 *   return (
 *     <div>
 *       {isNewFeature && <Badge>New!</Badge>}
 *       <button onClick={handleClick}>View Charts</button>
 *     </div>
 *   )
 * }
 *
 * @example
 * // Con el componente NewFeatureIndicator
 * <div className="relative">
 *   <NavLink href="/dashboard">Dashboard</NavLink>
 *   <NewFeatureIndicator featureId="dashboard-redesign" />
 * </div>
 */
'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'actas-abiertas-features-seen'
const STORAGE_EVENT = 'actas-abiertas-features-updated'

type FeaturesSeenMap = Record<string, boolean>

function getSeenFeatures(): FeaturesSeenMap {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error parsing features seen data:', error)
    return {}
  }
}

function setSeenFeatures(features: FeaturesSeenMap): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  } catch (error) {
    console.error('Error saving features seen data:', error)
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function useFeatureSeen(featureId: string) {
  const isFeatureSeen = useSyncExternalStore(
    subscribe,
    // Client snapshot
    () => getSeenFeatures()[featureId] === true,
    // Server snapshot - true (seen) to avoid showing indicator during SSR
    () => true
  )

  const markFeatureAsSeen = useCallback(() => {
    const seenFeatures = getSeenFeatures()
    seenFeatures[featureId] = true
    setSeenFeatures(seenFeatures)
  }, [featureId])

  const resetFeature = useCallback(() => {
    const seenFeatures = getSeenFeatures()
    delete seenFeatures[featureId]
    setSeenFeatures(seenFeatures)
  }, [featureId])

  const isNewFeature = !isFeatureSeen

  return {
    isNewFeature,
    isFeatureSeen,
    markFeatureAsSeen,
    resetFeature,
  }
}

export function markFeaturesAsSeen(featureIds: string[]): void {
  const seenFeatures = getSeenFeatures()
  featureIds.forEach((id) => {
    seenFeatures[id] = true
  })
  setSeenFeatures(seenFeatures)
}

export function resetAllFeatures(): void {
  if (globalThis.window !== undefined) {
    localStorage.removeItem(STORAGE_KEY)
  }
}
