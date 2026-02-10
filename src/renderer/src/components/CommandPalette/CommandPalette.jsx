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
import { HighlightedText } from '../Common'
import './CommandPalette.css'

const CommandPalette = ({
  isOpen,
  onClose,
  actions,
  theme,
  initialQuery = '',
  engine,
  onNavigate
}) => {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('search') // 'search' or 'command'
  const [dbResults, setDbResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const searchIdRef = useRef(0)

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
    const q = query.toLowerCase().trim()

    if (mode === 'command') {
      return uniqueActions.filter((a) => !q || a.label.toLowerCase().includes(q))
    }

    // Search mode: Include navigation items if they match the query
    // This UX allows users to find "Settings" or "History" without typing ">" first
    if (!q) return []
    return uniqueActions
      .filter((a) => a.category === 'Navigation' || a.category === 'System')
      .filter((a) => a.label.toLowerCase().includes(q))
  }, [uniqueActions, mode, query])

  const handleSentenceSelect = useCallback(
    (text) => {
      if (engine && engine.resetGame) {
        engine.resetGame({
          words: text.split(' '),
          isSentenceMode: true
        })

        // Robustness: Always navigate back to typing tab when a sentence is selected
        if (onNavigate) {
          onNavigate('typing')
        }
        onClose()
      }
    },
    [engine, onClose, onNavigate]
  )

  // Fetch Database results if in search mode
  const fetchDbResults = useCallback(
    async (q) => {
      const currentId = ++searchIdRef.current

      if (mode === 'command' || !isOpen) {
        setDbResults([])
        return
      }

      if (window.api?.db) {
        try {
          const trimmed = q.trim()
          let results = []

          if (!trimmed) {
            const difficulties = ['easy', 'medium', 'hard']
            const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)]
            const initial = await window.api.db.getSentences(randomDiff, 5)

            if (currentId !== searchIdRef.current) return

            const diffLabel =
              randomDiff === 'easy'
                ? 'Beginner'
                : randomDiff === 'hard'
                  ? 'Advanced'
                  : 'Intermediate'

            results = initial.map((text) => ({
              id: `db-${text}`,
              label: text,
              type: 'sentence',
              category: `Suggested (${diffLabel})`,
              icon: <Quote size={18} />,
              text: text,
              difficulty: diffLabel,
              onSelect: () => handleSentenceSelect(text)
            }))
          } else {
            const searchResults = await window.api.db.searchSentences(trimmed, 15)

            if (currentId !== searchIdRef.current) return

            results = searchResults.map((res) => {
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
          }
          setDbResults(results)
        } catch (err) {
          console.error('Failed to fetch DB results:', err)
          if (currentId === searchIdRef.current) setDbResults([])
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
  }, [query, mode, allResults.length])

  const handleKeyDown = (e) => {
    if (allResults.length === 0) {
      if (e.key === 'Escape') onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % allResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = allResults[selectedIndex]
      if (selected && selected.onSelect) {
        selected.onSelect()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Backspace' && query === '' && mode === 'command') {
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
              <AnimatePresence mode="popLayout" initial={false}>
                {allResults.length > 0 ? (
                  allResults.map((action, index) => {
                    const isSelected = index === selectedIndex
                    const showCategory =
                      index === 0 || allResults[index - 1].category !== action.category

                    return (
                      <div key={action.id || action.label + index}>
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
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          layout
                        >
                          <div className="item-icon">{action.icon}</div>
                          <div className="item-info">
                            <div className="item-label">
                              <HighlightedText text={action.label} query={query} />
                            </div>
                            <div className="item-meta">
                              {action.shortcut && (
                                <div className="item-shortcut">{action.shortcut}</div>
                              )}
                              {action.difficulty && (
                                <span className={`diff-badge ${action.difficulty.toLowerCase()}`}>
                                  <HighlightedText text={action.difficulty} query={query} />
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )
                  })
                ) : (
                  <motion.div
                    key="empty"
                    className="no-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Search
                      size={32}
                      style={{ opacity: 0.1, marginBottom: '1rem' }}
                      strokeWidth={1.5}
                    />
                    <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                      {query ? `No matches for "${query}"` : 'Type to start searching...'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
