import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Keyboard, Palette, Globe, History, Trophy, Settings, LogOut, Play } from 'lucide-react'
import './CommandPalette.css'

const CommandPalette = ({ 
  isOpen, 
  onClose, 
  actions,
  theme,
  initialQuery = '' 
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const isCommandMode = query.trim().startsWith('>')
  const effectiveQuery = isCommandMode ? query.slice(1).trim() : query.trim()

  // Deduplicate actions based on label/id to prevent "4 times" issue
  const uniqueActions = useMemo(() => {
    const seen = new Set();
    return actions.filter(a => {
      const key = a.id || a.label;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [actions]);

  const filteredActions = uniqueActions.filter(action => {
    // Mode-specific filtering
    if (isCommandMode) {
      if (action.type !== 'command') return false
    } 
    // If NOT in command mode (>), we search EVERYTHING (Commands + Content)
    // The previous logic restricted it to 'content' only, hiding generic commands.

    if (!effectiveQuery) return true; // Show all if no query typed

    return (
      action.label.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
      (action.id && action.id.toLowerCase().includes(effectiveQuery.toLowerCase()))
    )
  })

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setSelectedIndex(0)
      setTimeout(() => {
        if (inputRef.current) {
           inputRef.current.focus()
           // If initial query exists, move cursor to end
           inputRef.current.setSelectionRange(initialQuery.length, initialQuery.length)
        }
      }, 10)
    }
  }, [isOpen, initialQuery])

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
