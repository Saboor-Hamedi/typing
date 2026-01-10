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
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, Zap, Globe, User } from 'lucide-react'
import { supabase } from '../../utils/supabase'
import './LeaderboardView.css'

const LeaderboardView = ({ currentUser }) => {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'time', 'words', '15', '60'

  useEffect(() => {
    fetchScores()
  }, [filter, currentUser])

  const fetchScores = async () => {
    setLoading(true)
    try {
      setError(null)
      let query = supabase
        .from('scores')
        .select('id, wpm, accuracy, created_at, mode, user_id, test_limit')
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

      const { data: scoresData, error: scoresError } = await query.limit(200)
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
      
      for (const score of scoresData) {
        if (!seenUsers.has(score.user_id)) {
          uniqueScores.push(score)
          seenUsers.add(score.user_id)
        }
        if (uniqueScores.length >= 50) break
      }

      // Step 3: Get Profiles manually
      if (uniqueScores.length > 0) {
        const userIds = [...new Set(uniqueScores.map(s => s.user_id))]
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds)
        
        if (!profilesError && profilesData) {
          const profileMap = {}
          profilesData.forEach(p => { profileMap[p.id] = p.username })
          
          const joinedScores = uniqueScores.map(s => ({
            ...s,
            profiles: { username: profileMap[s.user_id] || 'Unknown' }
          }))
          setScores(joinedScores)
        } else {
          setScores(uniqueScores)
        }
      } else {
        setScores([])
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setScores([])
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
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
        
        <div className="lb-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === '15' ? 'active' : ''} onClick={() => setFilter('15')}>15s</button>
          <button className={filter === '60' ? 'active' : ''} onClick={() => setFilter('60')}>60s</button>
          <button className={filter === 'words' ? 'active' : ''} onClick={() => setFilter('words')}>Words</button>
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
                  <User size={14} style={{ marginRight: 8, opacity: 0.5 }} />
                  {score.profiles?.username || 'Anonymous'}
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
        </div>
      </div>
    </div>
  )
}

export default LeaderboardView
