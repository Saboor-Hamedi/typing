import { motion } from 'framer-motion'
import './EmptyState.css'

/**
 * Empty State Component
 * Displays when no data is available with optional call-to-action
 * 
 * @param {ReactNode} icon - Icon component to display
 * @param {string} title - Main title
 * @param {string} description - Description text
 * @param {ReactNode} action - Optional action button/element
 */
const EmptyState = ({ icon, title, description, action }) => {
  return (
    <motion.div
      className="empty-state-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="empty-state-content">
        {icon && (
          <motion.div
            className="empty-state-icon"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            {icon}
          </motion.div>
        )}
        
        <h2 className="empty-state-title">{title}</h2>
        
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
        
        {action && (
          <motion.div
            className="empty-state-action"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {action}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default EmptyState
