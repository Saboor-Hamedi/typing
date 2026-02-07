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
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className="spinner-circle" />
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
