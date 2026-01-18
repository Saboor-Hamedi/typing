/**
 * UserContext
 *
 * Purpose:
 * - Manages authentication state (local guest vs Supabase session), profile, and avatar progression.
 *
 * Data Sources:
 * - Local nickname and avatar preferences via Electron `settings` store + localStorage for UX.
 * - Cloud profile via Supabase `profiles` table (selected avatar, unlocked avatars).
 * - Deep-link handler integrates OAuth flow (`typingzone://auth?...`) and sets Supabase session.
 *
 * Behavior:
 * - On login: normalizes a display name, loads cloud profile, merges unlocked avatars with defaults.
 * - On logout: preserves unlocked avatars locally and resets selected avatar only if invalid.
 * - Provides `updateAvatar` and `unlockAvatar` with cloud sync when logged in.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, signOut } from '../utils/supabase'
import { VALIDATION, STORAGE_KEYS, PROGRESSION, SUCCESS_MESSAGES } from '../constants'
import { validateUsername } from '../utils/validation'

const UserContext = createContext(null)

/**
 * Safe string getter with recursive unquoting
 * Handles nested JSON escaping issues
 */
const safeGetStr = (key, fallback) => {
  let val = localStorage.getItem(key)
  if (!val) return fallback
  
  while (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed !== 'string') break
      val = parsed
    } catch {
      val = val.slice(1, -1)
    }
  }
  return val || fallback
}

/**
 * User Provider Component
 * Manages authentication state, user profile, and cloud sync
 */
export const UserProvider = ({ children, addToast }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState(() => safeGetStr(STORAGE_KEYS.USERNAME, VALIDATION.DEFAULT_USERNAME))
  const [localUsername, setLocalUsername] = useState(() => safeGetStr(STORAGE_KEYS.LOCAL_USERNAME, VALIDATION.DEFAULT_USERNAME))
  
  // Profile state
  const [selectedAvatarId, setSelectedAvatarId] = useState(PROGRESSION.DEFAULT_AVATAR_ID)
  const [unlockedAvatars, setUnlockedAvatars] = useState([...PROGRESSION.DEFAULT_UNLOCKED_AVATARS])
  
  // Loading state
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  
  // Refs for state management
  const isFirstAuthCheck = useRef(true)
  const lastNotifiedUser = useRef(null)
  const isLoggingOut = useRef(false)

  // Load user data from electron-store on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (window.api?.settings) {
        const [savedUser, savedAvatarId, savedUnlocked] = await Promise.all([
          window.api.settings.get(STORAGE_KEYS.SETTINGS.LOCAL_USERNAME),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.AVATAR_ID),
          window.api.settings.get(STORAGE_KEYS.SETTINGS.UNLOCKED_AVATARS),
        ])

        if (savedUser) setLocalUsername(savedUser)
        if (savedAvatarId !== undefined) setSelectedAvatarId(savedAvatarId)
        if (savedUnlocked && Array.isArray(savedUnlocked)) {
          // Merge saved unlocked avatars with defaults, ensuring avatar 1 is always available
          const mergedUnlocked = [...new Set([...PROGRESSION.DEFAULT_UNLOCKED_AVATARS, ...savedUnlocked])]
          setUnlockedAvatars(mergedUnlocked)
        }
      }
      setIsUserLoaded(true)
    }
    loadUserData()
  }, [])

  // Persist user data changes
  useEffect(() => {
    if (!isUserLoaded) return

    localStorage.setItem(STORAGE_KEYS.USERNAME, username)
    localStorage.setItem(STORAGE_KEYS.LOCAL_USERNAME, localUsername)

    if (window.api?.settings) {
      window.api.settings.set(STORAGE_KEYS.SETTINGS.LOCAL_USERNAME, localUsername)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.AVATAR_ID, selectedAvatarId)
      window.api.settings.set(STORAGE_KEYS.SETTINGS.UNLOCKED_AVATARS, unlockedAvatars)
    }
  }, [username, localUsername, selectedAvatarId, unlockedAvatars, isUserLoaded])

  // Single Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user
      
      if (user) {
        // Robust name extraction from social metadata
        const name = user.user_metadata?.full_name || 
                     user.user_metadata?.preferred_username || 
                     user.user_metadata?.user_name || 
                     user.user_metadata?.username || 
                     user.email?.split('@')[0] || 
                     'User'
        
        // Clear manual logout flag on fresh login
        localStorage.removeItem(STORAGE_KEYS.MANUAL_LOGOUT)

        setUsername(name)
        setIsLoggedIn(true)

        // Load cloud profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
          const cloudUnlocked = Array.isArray(profile.unlocked_avatars) ? profile.unlocked_avatars : []
          const mergedUnlocked = [...new Set([...PROGRESSION.DEFAULT_UNLOCKED_AVATARS, ...unlockedAvatars, ...cloudUnlocked])]

          // Sync back to cloud if local has more unlocks than cloud
          if (mergedUnlocked.length > cloudUnlocked.length) {
            await supabase.from('profiles').update({ unlocked_avatars: mergedUnlocked }).eq('id', user.id)
          }

          setUnlockedAvatars(mergedUnlocked)

          const cloudSelected = profile.selected_avatar_id
          if (cloudSelected !== undefined && mergedUnlocked.includes(cloudSelected)) {
            setSelectedAvatarId(cloudSelected)
          }
        }

        // Show welcome toast
        if (event === 'SIGNED_IN' && !isFirstAuthCheck.current && lastNotifiedUser.current !== name) {
          addToast?.(`${SUCCESS_MESSAGES.LOGIN_SUCCESS}, ${name}!`, 'success')
        }
        lastNotifiedUser.current = name
      } else {
        // RESET all user state to guest defaults
        setIsLoggedIn(false)
        setUsername(localUsername)
        setSelectedAvatarId(PROGRESSION.DEFAULT_AVATAR_ID)
        setUnlockedAvatars([...PROGRESSION.DEFAULT_UNLOCKED_AVATARS])
        lastNotifiedUser.current = null
      }
    })

    const timer = setTimeout(() => { isFirstAuthCheck.current = false }, 2000)
    return () => {
      subscription?.unsubscribe()
      clearTimeout(timer)
    }
  }, [localUsername, addToast])

  // Deep Link Auth Handler (Electron Only)
  useEffect(() => {
    if (!window.api?.onDeepLink) return

    const unsubscribeDeepLink = window.api.onDeepLink(async (url) => {
      if (!url) return
      
      const cleanUrl = url.replace(/['"]/g, '').trim()
      
      // DEBUG: Show the exact protocol received
      if (cleanUrl.startsWith('typingzone')) {
        addToast?.('Link detected: ' + cleanUrl.substring(0, 35) + '...', 'info')
      } else {
        addToast?.('Received unknown protocol: ' + cleanUrl.substring(0, 15), 'warning')
      }
      if (import.meta.env.DEV) {
        console.log('Deep link received:', cleanUrl)
      }

      // Robust token extraction using Regex (Case Insensitive)
      const accessTokenMatch = cleanUrl.match(/access_token=([^&#\s?]+)/i)
      const refreshTokenMatch = cleanUrl.match(/refresh_token=([^&#\s?]+)/i)

      if (accessTokenMatch && refreshTokenMatch) {
        try {
          const accessToken = decodeURIComponent(accessTokenMatch[1])
          const refreshToken = decodeURIComponent(refreshTokenMatch[1])

          addToast?.('Keys found! Syncing...', 'info')

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Session error:', error)
            addToast?.('Sync Failed: ' + error.message, 'error')
          } else if (data.user) {
            const user = data.user
            const name = user.user_metadata?.full_name || 
                         user.user_metadata?.preferred_username || 
                         user.user_metadata?.user_name || 
                         user.user_metadata?.username || 
                         user.email?.split('@')[0] || 
                         'User'
            
            setUsername(name)
            setIsLoggedIn(true)
            addToast?.(`Verified: Logged in as ${name}`, 'success')
            if (import.meta.env.DEV) {
              console.log('Login successful for:', name)
            }
          }
        } catch (err) {
          console.error('Deep link catch error:', err)
          addToast?.('Error syncing session', 'error')
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('No tokens found in URL:', cleanUrl)
        }
        addToast?.('No login tokens detected in link', 'warning')
      }
    })

    // Signal main process that we are ready to receive deep links
    window.api.rendererReady?.()

    return () => unsubscribeDeepLink?.()
  }, [addToast])

  /**
   * Update username with validation
   */
  const updateUsername = useCallback(async (newName) => {
    const validation = validateUsername(newName)
    if (!validation.isValid) {
      addToast?.(validation.error, 'error')
      return false
    }

    const trimmed = newName.trim()
    setUsername(trimmed)
    setLocalUsername(trimmed)

    if (isLoggedIn) {
      try {
        const { error } = await supabase.auth.updateUser({ data: { username: trimmed } })
        if (error) throw error
        addToast?.(SUCCESS_MESSAGES.PROFILE_UPDATED, 'success')
      } catch (err) {
        addToast?.('Cloud sync failed', 'warning')
      }
    } else {
      addToast?.(SUCCESS_MESSAGES.LOCAL_NICKNAME_SAVED, 'success')
    }
    return true
  }, [isLoggedIn, addToast])

  /**
   * Update selected avatar
   */
  const updateAvatar = useCallback(async (avatarId) => {
    if (!unlockedAvatars.includes(avatarId)) {
      addToast?.('Avatar not unlocked', 'error')
      return
    }
    setSelectedAvatarId(avatarId)
    if (isLoggedIn) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from('profiles').update({ selected_avatar_id: avatarId }).eq('id', session.user.id)
      }
    }
  }, [isLoggedIn, unlockedAvatars, addToast])

  /**
   * Unlock new avatar
   */
  const unlockAvatar = useCallback(async (avatarId) => {
    if (unlockedAvatars.includes(avatarId)) return
    const updatedList = [...new Set([...unlockedAvatars, avatarId])]
    setUnlockedAvatars(updatedList)
    if (isLoggedIn) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from('profiles').update({ unlocked_avatars: updatedList }).eq('id', session.user.id)
      }
    }
  }, [isLoggedIn, unlockedAvatars])

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true

    setIsLoggedIn(false)
    setUsername(localUsername)
    // PRESERVE unlocked avatars for guest users - only reset selected avatar if needed
    if (!unlockedAvatars.includes(selectedAvatarId)) {
      setSelectedAvatarId(PROGRESSION.DEFAULT_AVATAR_ID)
    }

    localStorage.setItem(STORAGE_KEYS.MANUAL_LOGOUT, 'true')

    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth-token')) localStorage.removeItem(key)
    })

    try {
      await signOut()
      addToast?.(SUCCESS_MESSAGES.LOGOUT_SUCCESS, 'info')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setTimeout(() => { isLoggingOut.current = false }, 2500)
    }
  }, [localUsername, addToast])

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    username,
    localUsername,
    setLocalUsername,
    updateUsername,
    selectedAvatarId,
    unlockedAvatars,
    updateAvatar,
    unlockAvatar,
    handleLogout,
    isUserLoaded,
    isLoggingOut,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
