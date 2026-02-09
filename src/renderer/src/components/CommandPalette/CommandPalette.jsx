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
  Command,
  Quote,
  Zap,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import './CommandPalette.css'

const CommandPalette = ({ isOpen, onClose, actions, theme, initialQuery = '', engine }) => {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('search') // 'search' or 'command'
  const [dbResults, setDbResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Handle initialization of mode and query
  useEffect(() => {
    if (isOpen) {
      if (initialQuery.startsWith('>')) {
        setMode('command')
        setQuery(initialQuery.slice(1))
      } else {
        setMode('search')
        setQuery(initialQuery)
      }
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialQuery])

  // Filter local actions (Commands/Navigation)
  const uniqueActions = useMemo(() => {
    const seen = new Set()
    return actions.filter((a) => {
      const key = a.id || a.label
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [actions])

  const filteredLocalActions = useMemo(() => {
    if (mode === 'command') {
      return uniqueActions
        .filter((a) => a.type === 'command')
        .filter((a) => !query || a.label.toLowerCase().includes(query.toLowerCase()))
    }
    // Search mode: Strictly ONLY show database sentences
    return []
  }, [uniqueActions, mode, query])

  const handleSentenceSelect = useCallback(
    (text) => {
      if (engine && engine.resetGame) {
        engine.resetGame({
          words: text.split(' '),
          isSentenceMode: true
        })
        onClose()
      }
    },
    [engine, onClose]
  )

  // Fetch Database results if in search mode
  const fetchDbResults = useCallback(
    async (q) => {
      if (mode === 'command' || !isOpen) {
        setDbResults([])
        return
      }

      if (window.api?.db) {
        const trimmed = q.trim()
        if (!trimmed) {
          const difficulties = ['easy', 'medium', 'hard']
          const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)]
          const initial = await window.api.db.getSentences(randomDiff, 5)

          const diffLabel =
            randomDiff === 'easy' ? 'Beginner' : randomDiff === 'hard' ? 'Advanced' : 'Intermediate'

          setDbResults(
            initial.map((text) => ({
              id: `db-${text}`,
              label: text,
              type: 'sentence',
              category: `Suggested (${diffLabel})`,
              icon: <Quote size={18} />,
              text: text,
              difficulty: diffLabel,
              onSelect: () => handleSentenceSelect(text)
            }))
          )
        } else {
          const searchResults = await window.api.db.searchSentences(trimmed, 15)
          setDbResults(
            searchResults.map((res) => {
              const diffLabel =
                res.difficulty === 'easy'
                  ? 'Beginner'
                  : res.difficulty === 'hard'
                    ? 'Advanced'
                    : 'Intermediate'
              return {
                id: `db-${res.id}`,
                label: res.text,
                type: 'sentence',
                category: 'Search Results',
                icon: <Quote size={18} />,
                text: res.text,
                difficulty: diffLabel,
                onSelect: () => handleSentenceSelect(res.text)
              }
            })
          )
        }
      }
    },
    [mode, isOpen, handleSentenceSelect]
  )

  const lastQueryRef = useRef('')

  useEffect(() => {
    if (!isOpen) return

    // Immediately fetch if query is empty to avoid delay on clearing
    if (!query.trim()) {
      fetchDbResults('')
      lastQueryRef.current = ''
      return
    }

    const handler = setTimeout(() => {
      // Corrected: If query hasn't changed, don't re-fetch (even if results were 0)
      if (query === lastQueryRef.current) return
      lastQueryRef.current = query
      fetchDbResults(query)
    }, 50)
    return () => clearTimeout(handler)
  }, [query, fetchDbResults, isOpen])

  const allResults = useMemo(() => {
    return [...filteredLocalActions, ...dbResults]
  }, [filteredLocalActions, dbResults])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, mode])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % allResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allResults[selectedIndex]) {
        allResults[selectedIndex].onSelect()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Backspace' && query === '' && mode === 'command') {
      // If query is empty and we hit backspace in command mode, go back to search mode
      setMode('search')
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
                {mode === 'command' ? (
                  <ChevronRight size={18} className="search-icon mode-command" />
                ) : (
                  <Search size={18} className="search-icon mode-search" />
                )}
              </div>

              <div className="search-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    mode === 'command' ? 'Type a command...' : 'Search sentences, navigation...'
                  }
                  value={query}
                  onChange={(e) => {
                    const val = e.target.value
                    if (mode === 'search' && val === '>') {
                      setMode('command')
                      setQuery('')
                    } else {
                      setQuery(val)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                />
              </div>

              <div className="esc-hint">ESC</div>
            </div>

            <div className="command-palette-list" ref={listRef}>
              {allResults.length > 0 ? (
                allResults.map((action, index) => {
                  const isSelected = index === selectedIndex
                  const showCategory =
                    index === 0 || allResults[index - 1].category !== action.category

                  return (
                    <div key={action.id || action.label}>
                      {showCategory && action.category && (
                        <div className="command-palette-category">{action.category}</div>
                      )}
                      <motion.div
                        className={`command-item ${isSelected ? 'selected' : ''} type-${action.type || 'default'}`}
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
                          <div className="item-meta">
                            {action.shortcut && (
                              <div className="item-shortcut">{action.shortcut}</div>
                            )}
                            {action.difficulty && (
                              <span className={`diff-badge ${action.difficulty.toLowerCase()}`}>
                                {action.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )
                })
              ) : (
                <div className="no-results">
                  <Search size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <span>No results found for "{query}"</span>
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
                <kbd>{mode === 'command' ? 'BS' : '>'}</kbd>{' '}
                <span>{mode === 'command' ? 'Back to search' : 'Switch to Command Mode'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
