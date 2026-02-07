import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Keyboard,
  Palette,
  Globe,
  History,
  Trophy,
  Settings,
  LogOut,
  Play,
  Command
} from 'lucide-react'
import './CommandPalette.css'

const CommandPalette = ({ isOpen, onClose, actions, theme, initialQuery = '' }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const isCommandMode = query.trim().startsWith('>')
  const effectiveQuery = isCommandMode ? query.slice(1).trim() : query.trim()

  const uniqueActions = useMemo(() => {
    const seen = new Set()
    return actions.filter((a) => {
      const key = a.id || a.label
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [actions])

  const filteredActions = uniqueActions.filter((action) => {
    if (isCommandMode) {
      if (action.type !== 'command') return false
    }
    if (!effectiveQuery) return true
    return (
      action.label.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
      (action.id && action.id.toLowerCase().includes(effectiveQuery.toLowerCase()))
    )
  })

  // Scroll active item into view - Boundary-safe scroller
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('.command-item.selected')
      if (selectedElement) {
        const container = listRef.current
        const containerRect = container.getBoundingClientRect()
        const selectedRect = selectedElement.getBoundingClientRect()

        // Check if item is above the viewport
        if (selectedRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - selectedRect.top + 10
        }
        // Check if item is below the viewport
        else if (selectedRect.bottom > containerRect.bottom) {
          container.scrollTop += selectedRect.bottom - containerRect.bottom + 10
        }
      }
    }
  }, [selectedIndex, filteredActions])

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setSelectedIndex(0)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.setSelectionRange(initialQuery.length, initialQuery.length)
        }
      }, 10)
    }
  }, [isOpen, initialQuery])

  // Reset selection index when filtering changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length)
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
            initial={{ opacity: 0, scale: 0.98, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="command-palette-search">
              <div className="search-icon-wrap">
                {isCommandMode ? (
                  <Command size={18} className="search-icon" />
                ) : (
                  <Search size={18} className="search-icon" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  isCommandMode ? 'Type a command...' : 'Search commands, modes, settings...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />
              <div className="esc-hint">ESC</div>
            </div>

            <div className="command-palette-list" ref={listRef}>
              {filteredActions.length > 0 ? (
                filteredActions.map((action, index) => {
                  const isSelected = index === selectedIndex
                  const showCategory =
                    index === 0 || filteredActions[index - 1].category !== action.category

                  return (
                    <div key={action.id || action.label}>
                      {showCategory && action.category && (
                        <div className="command-palette-category">{action.category}</div>
                      )}
                      <motion.div
                        className={`command-item ${isSelected ? 'selected' : ''}`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => {
                          action.onSelect()
                          onClose()
                        }}
                        initial={false}
                      >
                        <div className="item-icon">{action.icon}</div>
                        <div className="item-info">
                          <div className="item-label">{action.label}</div>
                          {action.shortcut && (
                            <div className="item-shortcut">{action.shortcut}</div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )
                })
              ) : (
                <div className="no-results">
                  <Search size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <span>No results found for "{effectiveQuery}"</span>
                </div>
              )}
            </div>

            <div className="command-palette-footer">
              <div className="footer-hint">
                <kbd>↑↓</kbd> <span>Navigate</span>
              </div>
              <div className="footer-hint">
                <kbd>Enter</kbd> <span>Select</span>
              </div>
              <div className="footer-hint">
                <kbd>ESC</kbd> <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
