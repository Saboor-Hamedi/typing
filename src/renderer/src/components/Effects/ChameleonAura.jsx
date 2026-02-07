import React, { memo } from 'react'
import { motion } from 'framer-motion'
import '../../components/Layout/AppLayout.css' // Reuse CSS

const ChameleonAura = memo(({ isEnabled }) => {
  if (!isEnabled) return null

  return (
    <div className="chameleon-aura-layer">
      {/* Ground Heat Base */}
      <div className="chameleon-fire-base" />

      {/* Optimized: Using CSS-driven animations for zero re-renders */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="chameleon-flame-tongue"
          animate={{
            height: [
              `calc(2% + var(--chameleon-heat) * 15%)`,
              `calc(5% + var(--chameleon-heat) * 25%)`,
              `calc(3% + var(--chameleon-heat) * 18%)`
            ],
            scaleX: [1, 1.05, 0.98, 1],
            translateX: [`${(i / 8) * 100 - 2}%`, `${(i / 8) * 100 + 1}%`, `${(i / 8) * 100 - 2}%`]
          }}
          transition={{
            height: { duration: 1.5 + Math.random() * 1, repeat: Infinity, ease: 'easeInOut' },
            scaleX: { duration: 2 + Math.random() * 1, repeat: Infinity, ease: 'easeInOut' },
            translateX: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{
            left: `${(i / 8) * 100}%`,
            width: '20%',
            background: `linear-gradient(to top, rgba(var(--main-color-rgb), 0.45) 0%, rgba(var(--main-color-rgb), 0.15) 60%, transparent)`
          }}
        />
      ))}
    </div>
  )
})

ChameleonAura.displayName = 'ChameleonAura'

export default ChameleonAura
