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

import { useCallback, useMemo, useState, useEffect } from 'react'

const STORAGE_KEY = 'actas-abiertas-features-seen'
const STORAGE_EVENT = 'actas-abiertas-features-updated'

type FeaturesSeenMap = Record<string, boolean>

function getSeenFeatures(): FeaturesSeenMap {
  if (globalThis.window === undefined) return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error parsing features seen data:', error)
    return {}
  }
}

function setSeenFeatures(features: FeaturesSeenMap): void {
  if (globalThis.window === undefined) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features))
    globalThis.window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  } catch (error) {
    console.error('Error saving features seen data:', error)
  }
}

export function useFeatureSeen(featureId: string) {
  const [updateTrigger, setUpdateTrigger] = useState(0)

  useEffect(() => {
    if (globalThis.window === undefined) return

    const handleStorageUpdate = () => {
      setUpdateTrigger((prev) => prev + 1)
    }

    globalThis.window.addEventListener(STORAGE_EVENT, handleStorageUpdate)
    return () => {
      globalThis.window.removeEventListener(STORAGE_EVENT, handleStorageUpdate)
    }
  }, [])

  const isFeatureSeen = useMemo(() => {
    const seenFeatures = getSeenFeatures()
    return seenFeatures[featureId] === true
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateTrigger is intentionally used to force re-evaluation
  }, [featureId, updateTrigger])

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
