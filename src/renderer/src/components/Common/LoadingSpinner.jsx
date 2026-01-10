import { motion } from 'framer-motion'
import './LoadingSpinner.css'

/**
 * Loading Spinner Component
 * Displays animated loading indicator
 * 
 * @param {string} size - Size variant: 'small', 'medium', 'large'
 * @param {string} message - Optional loading message
 */
const LoadingSpinner = ({ size = 'medium', message }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }

  return (
    <div className="loading-spinner-container">
      <motion.div
        className={`loading-spinner ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <div className="spinner-circle" />
      </motion.div>
      {message && (
        <motion.p
          className="loading-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

export default LoadingSpinner
