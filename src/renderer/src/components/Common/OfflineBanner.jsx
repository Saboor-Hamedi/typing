import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useEffect, useState } from 'react'
import './OfflineBanner.css'

/**
 * Offline Banner Component
 * Displays banner when user goes offline/online with improved UX
 */
const OfflineBanner = () => {
  const { isOffline } = useNetworkStatus()
  const [showOnlineMessage, setShowOnlineMessage] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true)
      setShowOnlineMessage(false)
    } else if (wasOffline && !isOffline) {
      // Show online message briefly when coming back online
      setShowOnlineMessage(true)
      const timer = setTimeout(() => {
        setShowOnlineMessage(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOffline, wasOffline])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          className="offline-banner offline"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="status"
          aria-live="polite"
        >
          <WifiOff size={18} />
          <span>You're offline. Cloud sync is paused. Your data is saved locally.</span>
        </motion.div>
      )}
      {showOnlineMessage && !isOffline && (
        <motion.div
          className="offline-banner online"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={18} />
          <span>Back online. Cloud sync resumed.</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner
