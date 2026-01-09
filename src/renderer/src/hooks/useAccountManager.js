import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase, signOut } from '../utils/supabase'
import { calculateLevel } from '../utils/Leveling'

const safeGetStr = (key, fallback) => {
  let val = localStorage.getItem(key)
  if (!val) return fallback
  
  // Recursively unquote and parse if it's a JSON string
  // This handles nested escaping issues like "\"\\\"Guest\\\"\""
  while (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed !== 'string') break // Not a string anymore, stop
      val = parsed
    } catch {
      // If it's just a string that looks like JSON but isn't valid, slice it
      val = val.slice(1, -1)
    }
  }
  return val || fallback
}

export const useAccountManager = (engine, addToast) => {
  const { testHistory, pb, setPb, clearAllData } = engine

  const [username, setUsername] = useState(() => safeGetStr('username', 'Guest'))
  const [localUsername, setLocalUsername] = useState(() => safeGetStr('localUsername', 'Guest'))
  const [selectedAvatarId, setSelectedAvatarId] = useState(1)
  const [unlockedAvatars, setUnlockedAvatars] = useState([0, 1])
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [fullHistory, setFullHistory] = useState([])
  
  const isFirstAuthCheck = useRef(true)
  const lastNotifiedUser = useRef(null)
  const isLoggingOut = useRef(false)

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
    if (!userId || testHistory.length === 0) return
    
    try {
      const cloudData = await fetchCloudHistory(userId)
      const cloudDateSet = new Set(cloudData.map(d => new Date(d.date).getTime()))

      const newLocalScores = testHistory.filter(score => {
        return !cloudDateSet.has(new Date(score.date).getTime())
      })

      if (newLocalScores.length === 0) return

      const scoresToPush = newLocalScores.map(score => ({
        user_id: userId,
        wpm: score.wpm,
        accuracy: score.accuracy,
        mode: score.mode,
        created_at: score.date
      }))

      const { error } = await supabase.from('scores').insert(scoresToPush)
      if (!error) {
        addToast(`Synced ${newLocalScores.length} new tests!`, 'success')
        if (typeof clearAllData === 'function') await clearAllData()
      }
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }, [testHistory, fetchCloudHistory, addToast, clearAllData])

  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true

    setIsLoggedIn(false)
    setUsername(localUsername)
    setFullHistory([])
    
    if (typeof clearAllData === 'function') await clearAllData()

    setUnlockedAvatars([0, 1])
    setSelectedAvatarId(1)
    
    localStorage.removeItem('typingzone-manual-logout') // Clear flag just in case
    localStorage.setItem('typingzone-manual-logout', 'true')
    
    // Explicitly wipe Supabase storage keys to prevent auto-recovery
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth-token')) localStorage.removeItem(key)
    })

    try {
      await signOut()
      addToast('Signed out successfully', 'info')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setTimeout(() => { isLoggingOut.current = false }, 2500)
    }
  }, [localUsername, addToast, clearAllData])

  const checkUnlocks = useCallback(async (level) => {
    const milestones = [
      { id: 2, level: 5, name: 'The Pulse' },
      { id: 3, level: 10, name: 'Tactical Edge' },
      { id: 4, level: 20, name: 'Expert Shards' },
      { id: 5, level: 30, name: 'Dark Master' },
      { id: 6, level: 40, name: 'Neon Specter' },
      { id: 7, level: 50, name: 'Void Walker' },
      { id: 8, level: 60, name: 'Ascended Zero' }
    ]

    let newlyUnlocked = []
    milestones.forEach(m => {
      if (level >= m.level && !unlockedAvatars.includes(m.id) && !isLoggingOut.current && level > 1) {
        newlyUnlocked.push(m.id)
      }
    })

    if (newlyUnlocked.length > 0) {
      const updatedList = [...new Set([...unlockedAvatars, ...newlyUnlocked])]
      setUnlockedAvatars(updatedList)
      
      if (window.api?.settings) await window.api.settings.set('unlockedAvatars', updatedList)

      if (isLoggedIn) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await supabase.from('profiles').update({ unlocked_avatars: updatedList }).eq('id', session.user.id)
        }
      }

      newlyUnlocked.forEach(id => {
        const item = milestones.find(m => m.id === id)
        addToast(`New Avatar: ${item.name}!`, 'success')
      })
    }
  }, [unlockedAvatars, isLoggedIn, addToast])

  const handleUpdateNickname = useCallback(async (newName) => {
    const trimmed = newName.trim()
    if (!trimmed) return

    setUsername(trimmed)
    setLocalUsername(trimmed)
    
    if (window.api?.settings) window.api.settings.set('localUsername', trimmed)

    if (isLoggedIn) {
       try {
         const { error } = await supabase.auth.updateUser({ data: { username: trimmed } })
         if (error) throw error
         addToast('Cloud profile updated', 'success')
       } catch (err) {
         addToast('Cloud sync failed', 'warning')
       }
    } else {
       addToast('Local nickname saved', 'success')
    }
  }, [isLoggedIn, addToast])

  const updateSelectedAvatar = useCallback(async (avatarId) => {
    setSelectedAvatarId(avatarId)
    if (window.api?.settings) await window.api.settings.set('selectedAvatarId', avatarId)
    
    if (isLoggedIn) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from('profiles').update({ selected_avatar_id: avatarId }).eq('id', session.user.id)
      }
    }
  }, [isLoggedIn])

  // Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isLoggingOut.current) return 
      
      const user = session?.user
      const isManualLogout = localStorage.getItem('typingzone-manual-logout') === 'true'

      // PROTECTION: If user manually logged out, ignore background recoveries
      if (user && isManualLogout && event !== 'SIGNED_IN') {
        console.log('Blocking auto-recovery due to manual logout flag')
        await supabase.auth.signOut()
        return
      }

      const name = user?.user_metadata?.username || user?.email

      if (user) {
         // If we are here via a fresh manual login, clear the protection flag
         if (event === 'SIGNED_IN') {
           localStorage.removeItem('typingzone-manual-logout')
         }
         
         setUsername(name)
         setIsLoggedIn(true)
         
         const loadCloudData = async () => {
           syncLocalToCloud(user.id)
           const cloudData = await fetchCloudHistory(user.id)
           if (cloudData.length > 0) {
              setFullHistory(cloudData)
              const cloudPb = Math.max(...cloudData.map(d => d.wpm))
              if (cloudPb > pb && typeof setPb === 'function') setPb(cloudPb)
           }
           
           const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
           if (profile) {
              if (profile.selected_avatar_id !== undefined) setSelectedAvatarId(profile.selected_avatar_id)
              if (profile.unlocked_avatars) setUnlockedAvatars([...new Set([0, 1, ...profile.unlocked_avatars])])
           }
         }
         loadCloudData()

         if (event === 'SIGNED_IN' && !isFirstAuthCheck.current && lastNotifiedUser.current !== name) {
            addToast(`Welcome back, ${name}!`, 'success')
         }
         lastNotifiedUser.current = name
      } else if (event === 'SIGNED_OUT' || (!user && isLoggedIn)) {
         setUsername(localUsername)
         setIsLoggedIn(false)
         lastNotifiedUser.current = null
         setFullHistory([]) 
         setUnlockedAvatars([0, 1])
         setSelectedAvatarId(1)
         if (event === 'SIGNED_OUT' && !isFirstAuthCheck.current) addToast('Signed out', 'info')
      }
    })

    const timer = setTimeout(() => { isFirstAuthCheck.current = false }, 2000)
    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [localUsername, pb, setPb, syncLocalToCloud, fetchCloudHistory, addToast])

  // Settings Sync
  useEffect(() => {
    localStorage.setItem('localUsername', localUsername)
    localStorage.setItem('username', username)
    if (window.api?.settings && isSettingsLoaded) {
      window.api.settings.set('username', username)
      window.api.settings.set('localUsername', localUsername)
      window.api.settings.set('selectedAvatarId', selectedAvatarId)
      window.api.settings.set('unlockedAvatars', unlockedAvatars)
    }
  }, [username, localUsername, selectedAvatarId, unlockedAvatars, isSettingsLoaded])

  const mergedHistory = useMemo(() => {
    const combined = [...fullHistory, ...testHistory];
    const unique = new Map();
    combined.forEach(item => { if (!unique.has(item.date)) unique.set(item.date, item) })
    return Array.from(unique.values()).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [fullHistory, testHistory])

  const currentLevel = useMemo(() => calculateLevel(mergedHistory).level, [mergedHistory])

  useEffect(() => {
    if (isSettingsLoaded) checkUnlocks(currentLevel)
  }, [currentLevel, isSettingsLoaded, checkUnlocks])

  return {
    isLoggedIn,
    setIsLoggedIn,
    username,
    setUsername,
    localUsername,
    setLocalUsername,
    fullHistory,
    setFullHistory,
    unlockedAvatars,
    setUnlockedAvatars,
    selectedAvatarId,
    setSelectedAvatarId,
    isSettingsLoaded,
    setIsSettingsLoaded,
    handleLogout,
    handleUpdateNickname,
    updateSelectedAvatar,
    mergedHistory,
    currentLevel,
    isLoggingOut
  }
}
