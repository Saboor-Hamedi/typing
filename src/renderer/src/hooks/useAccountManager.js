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
        const { data: { session } } = await supabase.auth.getSession()
        userId = session?.user?.id
      }
      
      if (userId) {
        const { data, error } = await supabase
          .from('scores')
          .select('wpm, accuracy, mode, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          return data.map(d => ({
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

  const syncLocalToCloud = useCallback(async (userId) => {
    if (!userId || testHistory.length === 0 || isSyncing.current) return
    isSyncing.current = true
    
    try {
      const cloudData = await fetchCloudHistory(userId)
      const cloudDateSet = new Set(cloudData.map(d => new Date(d.date).getTime()))

      const newLocalScores = testHistory.filter(score => {
        return !cloudDateSet.has(new Date(score.date).getTime())
      })

      if (newLocalScores.length === 0) {
        isSyncing.current = false
        return
      }

      const scoresToPush = newLocalScores.map(score => ({
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
  }, [testHistory, fetchCloudHistory, addToast])

  // EFFECT: Reactive Cloud Data Loading
  useEffect(() => {
    // Load stored XP for level floor (prevents visible drops during sync)
    const loadStoredXp = async () => {
      try {
        if (window.api?.data) {
          const xp = await window.api.data.get(STORAGE_KEYS.DATA.XP)
          if (typeof xp === 'number' && xp > 0) {
            storedXpRef.current = xp
            lastStableLevelRef.current = levelFromXP(xp).level
          }
        }
      } catch {}
    }
    loadStoredXp()
    const loadAccountData = async () => {
      if (isLoggedIn) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Push any local-only scores first
          await syncLocalToCloud(session.user.id)

          // Fetch cloud history
          const cloudData = await fetchCloudHistory(session.user.id)

          // Only overwrite local view if cloud has data; otherwise, keep current until retry
          if (cloudData && cloudData.length > 0) {
            setFullHistory(cloudData)
            const cloudPb = Math.max(...cloudData.map(d => d.wpm))
            if (cloudPb > pb && typeof setPb === 'function') setPb(cloudPb)
          } else {
            // Retry shortly — allows DB to reflect newly inserted rows
            setTimeout(async () => {
              const retry = await fetchCloudHistory(session.user.id)
              if (retry && retry.length > 0) {
                setFullHistory(retry)
                const retryPb = Math.max(...retry.map(d => d.wpm))
                if (retryPb > pb && typeof setPb === 'function') setPb(retryPb)
              }
            }, 800)
          }
        }
      } else {
        setFullHistory([])
      }
      setIsSettingsLoaded(true)
    }

    loadAccountData()
  }, [isLoggedIn, syncLocalToCloud, fetchCloudHistory, pb, setPb, testHistory])

  const mergedHistory = useMemo(() => {
    const combined = [...fullHistory, ...testHistory];
    const unique = new Map();
    combined.forEach(item => { if (!unique.has(item.date)) unique.set(item.date, item) })
    return Array.from(unique.values()).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [fullHistory, testHistory])

  // Avoid transient drops by caching the last non-empty level and persisting XP
  const lastStableLevelRef = useRef(1)
  const storedXpRef = useRef(0)
  // Initialize last stable level from local history if present
  useEffect(() => {
    if (testHistory && testHistory.length > 0) {
      lastStableLevelRef.current = calculateLevel(testHistory).level
    }
  }, [testHistory])
  const currentLevel = useMemo(() => {
    const stats = calculateLevel(mergedHistory)
    const lvl = stats.level
    const xp = stats.experience

    if (mergedHistory.length > 0) {
      lastStableLevelRef.current = lvl
      // Persist only when XP increases; never overwrite with 0
      if (typeof xp === 'number' && xp > storedXpRef.current) {
        storedXpRef.current = xp
        window.api?.data?.set(STORAGE_KEYS.DATA.XP, xp)
      }
      return lvl
    }

    // If history is empty, use the last stable level derived from stored XP/local
    return lastStableLevelRef.current
  }, [mergedHistory])

  return {
    fullHistory,
    setFullHistory,
    isSettingsLoaded,
    mergedHistory,
    currentLevel
  }
}
