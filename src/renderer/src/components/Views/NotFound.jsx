import { Home, Compass, AlertCircle } from 'lucide-react'
import './NotFound.css'

const NotFound = ({ activeTab, onBackHome }) => {
  return (
    <div className="not-found-container glass-panel">
      <div className="not-found-icon">
        <AlertCircle size={64} className="pulse-icon" />
      </div>
      
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Route Not Found</h2>
        <p>
          We couldn't find the page for <strong>"{activeTab}"</strong>. 
          It might be under construction or moved to a different galaxy.
        </p>
        
        <div className="not-found-actions">
          <button className="primary-btn" onClick={onBackHome}>
            <Home size={18} />
            Back to Typing
          </button>
          
          <div className="not-found-hint">
            <Compass size={14} />
            <span>Try using the sidebar to navigate</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
