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
    <div className="empty-state-container">
      <div className="empty-state-content">
        {icon && (
          <div className="empty-state-icon">
            {icon}
          </div>
        )}
        
        <h2 className="empty-state-title">{title}</h2>
        
        {description && (
          <p className="empty-state-description">{description}</p>
        )}
        
        {action && (
          <div className="empty-state-action">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmptyState
