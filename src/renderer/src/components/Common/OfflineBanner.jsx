import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import './OfflineBanner.css'

/**
 * Offline Banner Component
 * Displays banner when user goes offline
 */
const OfflineBanner = () => {
  const { isOffline } = useNetworkStatus()

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          className="offline-banner"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <WifiOff size={18} />
          <span>You're offline. Cloud sync is paused.</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner
