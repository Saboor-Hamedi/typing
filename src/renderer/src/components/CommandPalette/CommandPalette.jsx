import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Keyboard, Palette, Globe, History, Trophy, Settings, LogOut, Play } from 'lucide-react'
import './CommandPalette.css'

const CommandPalette = ({ 
  isOpen, 
  onClose, 
  actions,
  theme 
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase()) ||
    action.id.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isOpen])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredActions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].onSelect()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="command-palette-overlay" onClick={onClose}>
          <motion.div 
            className="command-palette-container"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="command-palette-search">
              <Search size={18} className="search-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
              />
              <div className="esc-hint">ESC</div>
            </div>

            <div className="command-palette-list">
              {filteredActions.length > 0 ? (
                filteredActions.map((action, index) => (
                  <div
                    key={action.id}
                    className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                       action.onSelect()
                       onClose()
                    }}
                  >
                    <div className="item-icon">
                      {action.icon}
                    </div>
                    <div className="item-info">
                      <div className="item-label">{action.label}</div>
                      {action.shortcut && <div className="item-shortcut">{action.shortcut}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">No commands found</div>
              )}
            </div>
            
            <div className="command-palette-footer">
              <div className="footer-hint">
                <kbd>↑↓</kbd> to navigate
              </div>
              <div className="footer-hint">
                <kbd>↵</kbd> to select
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
