import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, Zap, Globe, User } from 'lucide-react'
import { supabase } from '../../utils/supabase'
import './LeaderboardView.css'

const LeaderboardView = ({ currentUser }) => {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', '15', '60', 'words'

  useEffect(() => {
    fetchScores()
  }, [filter])

  const fetchScores = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('scores')
        .select('id, wpm, accuracy, created_at, mode, user_id')
        .order('wpm', { ascending: false })

      if (filter !== 'all') {
        if (filter === 'words') {
           query = query.ilike('mode', 'words%')
        } else {
           query = query.ilike('mode', `% ${filter}`)
        }
      }

      const { data: scoresData, error: scoresError } = await query.limit(200)
      if (scoresError) throw scoresError

      // Step 2: Extract Top Unique Scores per user
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
    } finally {
      setLoading(false)
    }
  }

  const getModeIcon = (mode) => {
    if (mode.includes('time')) return <Clock size={14} />
    return <Zap size={14} />
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
                   {getModeIcon(score.mode)} {score.mode}
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
