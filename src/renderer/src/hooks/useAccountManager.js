/**
 * useAccountManager
 *
 * Purpose:
 * - Harmonizes local engine history with cloud history and PB via Supabase.
 *
 * Flow:
 * - When logged in: push any local-only scores to cloud, then fetch cloud history.
 * - Stability: only overwrite local view when cloud returns rows; otherwise keep local and retry.
 * - `mergedHistory`: de-duplicates by date and sorts newest-first for analytics & leveling.
 *
 * Notes:
 * - Includes `testHistory` in effect dependencies so recalculation happens after store loads.
 * - Does not clear local history after sync to avoid temporary level drops.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { calculateLevel, levelFromXP } from '../utils/Leveling'
import { STORAGE_KEYS } from '../constants'
import { useUser } from '../contexts'

export const useAccountManager = (engine, addToast) => {
  const { testHistory, pb, setPb } = engine
  const { isLoggedIn } = useUser()

  const [fullHistory, setFullHistory] = useState([])
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  const isFirstAuthCheck = useRef(true)
  const isSyncing = useRef(false)

  const fetchCloudHistory = useCallback(async (userId = null) => {
    try {
      if (!userId) {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        userId = session?.user?.id
      }

      if (userId) {
        const { data, error } = await supabase
          .from('scores')
          .select('wpm, accuracy, mode, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          return data.map((d) => ({
            wpm: d.wpm,
            accuracy: d.accuracy,
            mode: d.mode,
            date: d.created_at
          }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch cloud history:', err)
    }
    return []
  }, [])

  const syncLocalToCloud = useCallback(
    async (userId) => {
      if (!userId || testHistory.length === 0 || isSyncing.current) return
      isSyncing.current = true

      try {
        const cloudData = await fetchCloudHistory(userId)
        const cloudDateSet = new Set(cloudData.map((d) => new Date(d.date).getTime()))

        const newLocalScores = testHistory.filter((score) => {
          return !cloudDateSet.has(new Date(score.date).getTime())
        })

        if (newLocalScores.length === 0) {
          isSyncing.current = false
          return
        }

        const scoresToPush = newLocalScores.map((score) => ({
          user_id: userId,
          wpm: score.wpm,
          accuracy: score.accuracy,
          mode: score.mode,
          created_at: score.date
        }))

        const { error } = await supabase.from('scores').insert(scoresToPush)
        if (!error) {
          addToast?.(`Synced ${newLocalScores.length} new tests!`, 'success')
          // DON'T clear data here - it will be cleared after cloud history loads
          // if (typeof clearAllData === 'function') await clearAllData()
        }
      } catch (err) {
        console.error('Sync failed:', err)
      } finally {
        isSyncing.current = false
      }
    },
    [testHistory, fetchCloudHistory, addToast]
  )

  // EFFECT: Initial load of local storage XP floor
  useEffect(() => {
    const initStore = async () => {
      if (window.api?.data) {
        const xp = await window.api.data.get(STORAGE_KEYS.DATA.XP)
        if (typeof xp === 'number' && xp > 0) {
          setHighWaterMarkXP(xp)
          setIsSettingsLoaded(true)
        }
      }
    }
    initStore()
  }, [])

  // EFFECT: Reactive Cloud Data Loading
  useEffect(() => {
    let active = true

    const loadAccountData = async () => {
      if (isLoggedIn) {
        // Use getSession for immediate access to current user
        const {
          data: { session }
        } = await supabase.auth.getSession()
        const userId = session?.user?.id

        if (userId && active) {
          // 1. Fetch cloud history immediately
          const cloudDataPromise = fetchCloudHistory(userId)

          // 2. While fetching, check if we need to sync any local stuff
          if (testHistory.length > 0) {
            await syncLocalToCloud(userId)
          }

          const cloudData = await cloudDataPromise

          if (active) {
            if (cloudData && cloudData.length > 0) {
              setFullHistory(cloudData)
              const cloudPb = Math.max(...cloudData.map((d) => d.wpm))
              if (cloudPb > pb && typeof setPb === 'function') setPb(cloudPb)
            } else {
              // Minimal delay for DB consistency if we just inserted
              setTimeout(async () => {
                if (!active) return
                const retry = await fetchCloudHistory(userId)
                if (retry && retry.length > 0) {
                  setFullHistory(retry)
                }
              }, 1000)
            }
          }
        }
      } else {
        setFullHistory([])
      }
      setIsSettingsLoaded(true)
    }

    loadAccountData()
    return () => {
      active = false
    }
  }, [isLoggedIn, testHistory.length === 0]) // Only re-run if login status or local history presence changes

  const mergedHistory = useMemo(() => {
    const combined = [...fullHistory, ...testHistory]
    const unique = new Map()
    combined.forEach((item) => {
      if (!unique.has(item.date)) unique.set(item.date, item)
    })
    return Array.from(unique.values()).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [fullHistory, testHistory])

  // Avoid transient drops by caching the last non-empty level and persisting XP
  const [highWaterMarkXP, setHighWaterMarkXP] = useState(0)

  // Initialize floor XP from local history if present
  useEffect(() => {
    if (testHistory && testHistory.length > 0) {
      const { experience } = calculateLevel(testHistory)
      if (experience > highWaterMarkXP) setHighWaterMarkXP(experience)
    }
  }, [testHistory])

  // EFFECT: Safe High Water Mark Persistence
  useEffect(() => {
    if (!isLoggedIn) return
    const mergedStats = calculateLevel(mergedHistory)
    const xp = mergedStats.experience || 0

    if (xp > highWaterMarkXP) {
      setHighWaterMarkXP(xp)
      if (window.api?.data) {
        window.api.data.set(STORAGE_KEYS.DATA.XP, xp)
      }
    }
  }, [mergedHistory, isLoggedIn, highWaterMarkXP])

  const progression = useMemo(() => {
    // 1. Calculate pure local stats (Offline/Guest View)
    const localStats = calculateLevel(testHistory)

    // 2. Calculate merged stats (Online View)
    const mergedStats = calculateLevel(mergedHistory)

    // If NOT logged in, we strictly show local progress to avoid confusion
    if (!isLoggedIn) {
      return localStats
    }

    // If logged in, we use the "High Water Mark" logic to prevent drops during sync
    const xp = mergedStats.experience
    const effectiveXP = Math.max(xp || 0, highWaterMarkXP)

    return {
      ...levelFromXP(effectiveXP),
      experience: effectiveXP // Ensure we return the effective XP for stats
    }
  }, [mergedHistory, testHistory, highWaterMarkXP, isLoggedIn])

  const currentLevel = progression.level

  return {
    fullHistory,
    setFullHistory,
    isSettingsLoaded,
    mergedHistory,
    currentLevel,
    progression
  }
}
