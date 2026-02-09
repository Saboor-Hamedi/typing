import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Terminal, BookOpen, Quote } from 'lucide-react'
import '../Modals/LoginModal.css'
import '../Database/DatabaseView.css'

const SentenceModal = ({ isOpen, onClose, addToast }) => {
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [category, setCategory] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef(null)

  // Helper to get character limit based on difficulty
  const getCharLimit = (difficulty) => {
    if (difficulty === 'easy') return 100
    if (difficulty === 'medium') return 130
    return 150
  }

  // Truncate text if it exceeds new difficulty limit
  useEffect(() => {
    const limit = getCharLimit(difficulty)
    if (text.length > limit) {
      setText(text.slice(0, limit))
    }
  }, [difficulty])

  useEffect(() => {
    if (isOpen) {
      // Focus textarea when modal opens
      setTimeout(() => textareaRef.current?.focus(), 100)
    } else {
      // Reset state when closed
      setText('')
      setDifficulty('medium')
      setCategory('general')
    }
  }, [isOpen])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsSaving(true)
    try {
      if (window.api?.db) {
        const result = await window.api.db.addSentence(text.trim(), difficulty, category)
        if (result) {
          addToast?.('Sentence added successfully!', 'success')
          onClose()
        } else {
          addToast?.('Failed to save sentence.', 'error')
        }
      } else {
        addToast?.('Database not available.', 'error')
      }
    } catch (error) {
      console.error('Error saving sentence:', error)
      addToast?.('An error occurred.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="modal-content login-modal glass-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ width: '500px', maxWidth: '95vw' }}
          >
            {/* Header */}
            <div className="modal-top-bar">
              <div className="modal-header-title">
                <Terminal size={14} className="modal-app-icon" />
                <span>Add New Sentence</span>
              </div>
              <button className="close-btn" onClick={onClose} type="button">
                <X size={14} />
              </button>
            </div>

            <div className="modal-inner-content">
              <form onSubmit={handleSave} className="auth-form">
                <div className="input-group">
                  <label>Sentence Content</label>
                  <div className="input-container" style={{ height: 'auto', padding: '10px' }}>
                    <Quote size={16} style={{ marginTop: '4px', alignSelf: 'flex-start' }} />
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      required
                      placeholder="Type or paste sentence..."
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-color)',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem',
                        resize: 'none',
                        minHeight: '80px'
                      }}
                      maxLength={getCharLimit(difficulty)}
                    />
                  </div>
                  <div
                    style={{ fontSize: '0.75rem', color: 'var(--sub-color)', textAlign: 'right' }}
                  >
                    {text.length}/{getCharLimit(difficulty)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Difficulty</label>
                    <div className="segmented-control">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`segmented-btn ${difficulty === d ? 'active' : ''}`}
                          onClick={() => setDifficulty(d)}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <div className="input-container">
                      <BookOpen size={16} />
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. tech"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="submit-btn secondary no-glow"
                    onClick={onClose}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      margin: 0,
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--sub-color)',
                      fontSize: '0.9rem',
                      height: '48px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn no-glow"
                    disabled={!text.trim() || isSaving}
                    style={{
                      flex: 1,
                      margin: 0,
                      fontSize: '0.9rem',
                      height: '48px'
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Add to Database'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default SentenceModal
