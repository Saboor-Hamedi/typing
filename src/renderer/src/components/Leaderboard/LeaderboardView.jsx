/**
 * LeaderboardView
 *
 * Purpose:
 * - Displays global top scores with basic filters and resolves usernames from `profiles`.
 *
 * Query Model:
 * - `scores.mode` is normalized to 'time' or 'words' (duration is not stored), so filters map to
 *   `eq('mode', 'time'|'words')` and then sort by WPM to derive unique top entries per user.
 * - Joins user display names with a second query to `profiles` for readability.
 * - Robust error state so backend failures aren't mistaken for infinite loading.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, Zap, Globe, User, RefreshCw } from 'lucide-react'
import { AVATAR_MAP } from '../../assets/avatars'
import { supabase } from '../../utils/supabase'
import './LeaderboardView.css'

const LeaderboardView = ({ currentUser }) => {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'time', 'words', '15', '60'
  const [lastUpdated, setLastUpdated] = useState(null)
  const [displayCount, setDisplayCount] = useState(20)

  const fetchScores = useCallback(async (opts = {}) => {
    const { silent = false } = opts
    if (!silent) setLoading(true)
    try {
      setError(null)
      // Select essential columns first. We'll handle test_limit gracefully if it missing or null.
      let query = supabase
        .from('scores')
        .select('id, wpm, accuracy, created_at, mode, user_id')
        .order('wpm', { ascending: false })

      if (filter !== 'all') {
        if (filter === 'words') {
          // Include both normalized and legacy strings like 'words 25'
          query = query.like('mode', 'words%')
        } else {
          // Include both normalized and legacy strings like 'time 60'
          query = query.like('mode', 'time%')
        }
      }

      const { data: scoresData, error: scoresError } = await query.limit(100)
      if (scoresError) throw scoresError

      // Step 2: Extract Top Unique Scores per user
      let filtered = scoresData || []

      // Graceful fallback for legacy records without `test_limit`
      if ((filter === '15' || filter === '60') && filtered.length > 0) {
        filtered = filtered.filter(s => {
          // Prefer explicit column
          if (typeof s.test_limit === 'number') return s.test_limit === Number(filter)
          // Legacy: parse limit from mode string like 'time 60' or 'time60'
          const match = String(s.mode).match(/time\s*(\d+)/i)
          return match ? Number(match[1]) === Number(filter) : false
        })
      }

      const uniqueScores = []
      const seenUsers = new Set()
      
      if (scoresData) {
        for (const score of scoresData) {
          if (!seenUsers.has(score.user_id)) {
            uniqueScores.push(score)
            seenUsers.add(score.user_id)
          }
          if (uniqueScores.length >= displayCount) break
        }
      }

      // Step 3: Get Profiles manually
      if (uniqueScores.length > 0) {
        const userIds = [...new Set(uniqueScores.map(s => s.user_id))]
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, selected_avatar_id')
          .in('id', userIds)
        
        if (!profilesError && profilesData) {
          const profileMap = {}
          profilesData.forEach(p => { profileMap[p.id] = { username: p.username, avatarId: p.selected_avatar_id } })
          
          const joinedScores = uniqueScores.map(s => ({
            ...s,
            profiles: profileMap[s.user_id] || { username: 'Unknown', avatarId: null }
          }))
          setScores(joinedScores)
        } else {
          setScores(uniqueScores)
        }
      } else {
        setScores([])
      }
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setScores([])
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchScores()
  }, [fetchScores, currentUser])

  // Refresh when auth state changes (login/logout) to avoid stale or cached results
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchScores({ silent: true })
    })
    return () => authListener?.subscription?.unsubscribe()
  }, [fetchScores])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchScores({ silent: true })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchScores, loading])

  const handleRefresh = () => {
    if (loading) return
    fetchScores()
  }

  const handleShowMore = () => {
    setDisplayCount((prev) => Math.min(prev + 20, 100))
  }

  const getAvatarForUser = (profile) => {
    const avatarId = profile?.avatarId
    if (avatarId !== null && avatarId !== undefined && AVATAR_MAP.hasOwnProperty(avatarId)) {
      return AVATAR_MAP[avatarId]
    }
    return null
  }

  const getModeIcon = (mode) => {
    if (String(mode).includes('time')) return <Clock size={14} />
    return <Zap size={14} />
  }

  const formatModeLabel = (score) => {
    // Use normalized columns when available
    const mode = String(score.mode)
    const tl = score.test_limit
    if (mode === 'time') {
      const seconds = typeof tl === 'number' ? tl : (mode.match(/time\s*(\d+)/i)?.[1] ? Number(mode.match(/time\s*(\d+)/i)[1]) : null)
      return seconds ? `time ${seconds}s` : 'time'
    }
    if (mode === 'words') {
      const words = typeof tl === 'number' ? tl : (mode.match(/words\s*(\d+)/i)?.[1] ? Number(mode.match(/words\s*(\d+)/i)[1]) : null)
      return words ? `words ${words}` : 'words'
    }
    return mode
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <div className="lb-title">
          <Globe size={24} className="lb-icon-main" />
          <h2>Global Leaderboard</h2>
        </div>
        <div className="lb-actions">
          <div className="lb-filters">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
            <button className={filter === '15' ? 'active' : ''} onClick={() => setFilter('15')}>15s</button>
            <button className={filter === '60' ? 'active' : ''} onClick={() => setFilter('60')}>60s</button>
            <button className={filter === 'words' ? 'active' : ''} onClick={() => setFilter('words')}>Words</button>
            <button 
              className="lb-refresh" 
              onClick={handleRefresh} 
              disabled={loading}
              title="Refresh leaderboard"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
          {lastUpdated && (
            <span className="lb-timestamp">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      </div>

      <div className="lb-content glass-panel">
        <div className="lb-table-header">
          <span className="rank-col">#</span>
          <span className="user-col">User</span>
          <span className="wpm-col">WPM</span>
          <span className="acc-col">Accuracy</span>
          <span className="mode-col">Mode</span>
          <span className="date-col">Date</span>
        </div>

        <div className="lb-list">
           {loading ? (
             <div className="lb-loading">Loading top scores...</div>
           ) : error ? (
             <div className="lb-empty">{error}</div>
           ) : scores.length === 0 ? (
             <div className="lb-empty">No scores yet. Be the first!</div>
          ) : (
            scores.map((score, index) => (
              <motion.div 
                key={score.id}
                className="lb-row"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className={`rank-col rank-${index + 1}`}>{index + 1}</span>
                <span className="user-col">
                  {getAvatarForUser(score.profiles) ? (
                    <img 
                      src={getAvatarForUser(score.profiles)} 
                      alt="avatar" 
                      className="user-avatar"
                    />
                  ) : (
                    <User size={16} className="user-placeholder" />
                  )}
                  <span className="user-name" title={score.profiles?.username || 'Anonymous'}>
                    {score.profiles?.username || 'Anonymous'}
                  </span>
                </span>
                <span className="wpm-col highlight">{score.wpm}</span>
                <span className="acc-col">{score.accuracy}%</span>
                 <span className="mode-col">
                   {getModeIcon(score.mode)} {formatModeLabel(score)}
                 </span>
                <span className="date-col">
                  {new Date(score.created_at).toLocaleDateString()}
                </span>
              </motion.div>
            ))
          )}
          {!loading && !error && scores.length > displayCount && (
            <div className="lb-show-more">
              <button onClick={handleShowMore}>Show more</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardView
