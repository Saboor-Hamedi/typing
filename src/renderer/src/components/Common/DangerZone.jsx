import { Trash2, AlertTriangle } from 'lucide-react'
import './DangerZone.css'

const DangerZone = ({ title, description, buttonText, onAction, icon: Icon = Trash2, className = '' }) => {
  return (
    <section className={`danger-zone-card glass-panel ${className}`}>
      <div className="danger-zone-header">
        <div className="danger-icon-container">
          <Icon size={18} />
        </div>
        <div className="danger-title-group">
          <span className="danger-label">{title || 'Danger Zone'}</span>
          <p className="danger-description">
            {description || 'This action is permanent and cannot be undone.'}
          </p>
        </div>
      </div>
      <button className="danger-action-btn" onClick={onAction}>
        {buttonText || 'Execute Action'}
      </button>
    </section>
  )
}

export default DangerZone
