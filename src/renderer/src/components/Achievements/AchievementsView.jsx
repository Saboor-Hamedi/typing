import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Star,
  Shield,
  Zap,
  Flame,
  Crown,
  Lock,
  CheckCircle2,
  Target,
  Award
} from 'lucide-react'
import { PROGRESSION } from '../../constants'
import UniversalAvatar from '../Common/UniversalAvatar'
import { AVATAR_DEFS } from '../../assets/avatars'
import './AchievementsView.css'

const TIERS = [
  {
    name: 'Initiate',
    range: [1, 20],
    color: '#cd7f32', // Bronze
    icon: <Shield size={24} />,
    description: 'The journey of a thousand words begins with a single stroke.'
  },
  {
    name: 'Specialist',
    range: [21, 50],
    color: '#c0c0c0', // Silver
    icon: <Zap size={24} />,
    description: 'Precision meets speed. You are carving your path.'
  },
  {
    name: 'Elite',
    range: [51, 100],
    color: '#ffd700', // Gold
    icon: <Flame size={24} />,
    description: 'A master of the keys. Your rhythm is undeniable.'
  },
  {
    name: 'Legend',
    range: [101, 200],
    color: '#e5e4e2', // Platinum
    icon: <Star size={24} />,
    description: 'Names of the legends are etched in the silicon itself.'
  },
  {
    name: 'Sovereign',
    range: [201, 350],
    color: '#b9f2ff', // Diamond
    icon: <Crown size={24} />,
    description: 'You do not just type; you command the flow of data.'
  },
  {
    name: 'Ascended',
    range: [351, 500],
    color: '#ff00ff', // Omega
    icon: <Award size={24} />,
    description: 'The keyboard is but an extension of your own soul.'
  }
]

const AchievementsView = ({ currentLevel = 1, unlockedAvatars = [0, 1] }) => {
  const achievements = useMemo(() => {
    return TIERS.map((tier) => {
      const tierAvatars = PROGRESSION.AVATAR_UNLOCK_LEVELS.filter(
        (av) => av.level >= tier.range[0] && av.level <= tier.range[1]
      )

      const unlockedInTier = tierAvatars.filter((av) => unlockedAvatars.includes(av.id)).length
      const isTierLocked = currentLevel < tier.range[0]
      const isTierCompleted = currentLevel > tier.range[1]
      const isCurrentTier = currentLevel >= tier.range[0] && currentLevel <= tier.range[1]

      return {
        ...tier,
        avatars: tierAvatars,
        unlockedCount: unlockedInTier,
        totalCount: tierAvatars.length,
        isLocked: isTierLocked,
        isCompleted: isTierCompleted,
        isCurrent: isCurrentTier,
        progress: isTierCompleted
          ? 100
          : isTierLocked
            ? 0
            : ((currentLevel - tier.range[0]) / (tier.range[1] - tier.range[0])) * 100
      }
    })
  }, [currentLevel, unlockedAvatars])

  return (
    <div className="achievements-container">
      <header className="achievements-header">
        <div className="header-content">
          <Trophy size={32} className="header-icon" />
          <div className="text-content">
            <h1>Rank & Achievements</h1>
            <p>Climb the tiers and unlock legendary avatars.</p>
          </div>
        </div>
        <div className="level-badge-large">
          <span className="label">CURRENT LEVEL</span>
          <span className="value">{currentLevel}</span>
        </div>
      </header>

      <div className="tiers-grid">
        {achievements.map((tier, idx) => (
          <motion.div
            key={tier.name}
            className={`tier-card glass-panel ${tier.isLocked ? 'locked' : ''} ${tier.isCurrent ? 'current' : ''} ${tier.isCompleted ? 'completed' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="tier-card-header" style={{ '--tier-color': tier.color }}>
              <div className="tier-icon-wrap">{tier.isLocked ? <Lock size={20} /> : tier.icon}</div>
              <div className="tier-info">
                <div className="tier-name-row">
                  <h3>{tier.name} Tier</h3>
                  {tier.isCompleted && <CheckCircle2 size={16} className="status-icon completed" />}
                  {tier.isCurrent && <Target size={16} className="status-icon current" />}
                </div>
                <span className="tier-range">
                  Lvl {tier.range[0]} — {tier.range[1]}
                </span>
              </div>
            </div>

            <p className="tier-description">{tier.description}</p>

            <div className="tier-progress">
              <div className="progress-labels">
                <span>Tier Progress</span>
                <span>{Math.round(tier.progress)}%</span>
              </div>
              <div className="progress-bar-bg">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${tier.progress}%` }}
                  style={{ backgroundColor: tier.color }}
                />
              </div>
            </div>

            <div className="unlocked-avatars">
              <div className="avatars-header">
                <span>Unlockables</span>
                <span className="count">
                  {tier.unlockedCount}/{tier.totalCount}
                </span>
              </div>
              <div className="avatars-track">
                {tier.avatars.map((av) => {
                  const isUnlocked = unlockedAvatars.includes(av.id)
                  const avDef = AVATAR_DEFS.find((d) => d.id === av.id)

                  return (
                    <div
                      key={av.id}
                      className={`av-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                      title={av.name}
                    >
                      <div className="av-hex">
                        <UniversalAvatar
                          avatarId={av.id}
                          theme={avDef?.theme}
                          size={32}
                          className="av-img"
                        />
                        {!isUnlocked && (
                          <div className="av-lock">
                            <span className="av-lv">L{av.level}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {tier.isCurrent && <div className="current-badge">ACTIVE TIER</div>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default AchievementsView
