import { useState } from 'react'
import './Tooltip.css'

const Tooltip = ({ content, children, direction = 'bottom', align = 'center' }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`tooltip-popup ${direction} ${align !== 'center' ? `align-${align}` : ''}`}>
          {content}
          <div className="tooltip-knob" />
        </div>
      )}
    </div>
  )
}

export default Tooltip
