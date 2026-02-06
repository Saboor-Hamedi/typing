import React, { memo } from 'react'
import { motion } from 'framer-motion'
import '../../components/Layout/AppLayout.css' // Reuse CSS

const ChameleonAura = memo(({ heat, isEnabled }) => {
  if (!isEnabled) return null

  return (
    <div className="chameleon-aura-layer">
      {/* Ground Heat Base */}
      <div className="chameleon-fire-base" />

      {/* Optimized: Reduced flame count from 16 to 8 for performance */}
      {[...Array(8)].map((_, i) => (
        <motion.div 
          key={i}
          className="chameleon-flame-tongue"
          animate={{ 
            opacity: heat > 0.3 ? (heat - 0.3) * 0.6 : 0, 
            height: [`${2 + (heat * 15)}%`, `${5 + (heat * 25)}%`, `${3 + (heat * 18)}%`],
            scaleX: [1, 1.05, 0.98, 1],
            translateX: [`${(i/8 * 100) - 2}%`, `${(i/8 * 100) + 1}%`, `${(i/8 * 100) - 2}%`]
          }}
          transition={{ 
            height: { duration: 1.5 + (Math.random() * 1), repeat: Infinity, ease: "easeInOut" },
            scaleX: { duration: 2 + (Math.random() * 1), repeat: Infinity, ease: "easeInOut" },
            translateX: { duration: 3 + (Math.random() * 2), repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.5 }
          }}
          style={{
            left: `${(i / 8) * 100}%`,
            width: '20%', // Wider flames to cover gaps
            background: `linear-gradient(to top, rgba(var(--main-color-rgb), 0.45) 0%, rgba(var(--main-color-rgb), 0.15) 60%, transparent)`
          }}
        />
      ))}
    </div>
  )
})

ChameleonAura.displayName = 'ChameleonAura'

export default ChameleonAura
