import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Tooltip.css'

const Tooltip = ({
  content,
  children,
  direction = 'bottom',
  align = 'center',
  className = '',
  style = {},
  fullWidth = false
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)

  const finalStyle = {
    ...style,
    ...(fullWidth ? { width: '100%', flex: 1, display: 'flex' } : {})
  }

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      let top = rect.top
      let left = rect.left + rect.width / 2

      if (direction === 'bottom') {
        top = rect.bottom + 8
      } else if (direction === 'top') {
        top = rect.top - 8
      } else if (direction === 'left') {
        top = rect.top + rect.height / 2
        left = rect.left - 8
      } else if (direction === 'right') {
        top = rect.top + rect.height / 2
        left = rect.right + 8
      }

      setCoords({ top, left })
    }
  }

  useEffect(() => {
    if (isVisible) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isVisible])

  return (
    <div
      ref={triggerRef}
      className={`tooltip-wrapper ${className}`}
      style={finalStyle}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            className={`tooltip-popup fixed ${direction} ${align !== 'center' ? `align-${align}` : ''}`}
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                direction === 'top' || direction === 'bottom'
                  ? 'translateX(-50%)'
                  : 'translateY(-50%)'
            }}
          >
            {content}
            <div className="tooltip-knob" />
          </div>,
          document.body
        )}
    </div>
  )
}

export default Tooltip
