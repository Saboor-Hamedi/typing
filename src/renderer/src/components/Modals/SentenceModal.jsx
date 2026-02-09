import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Terminal, Scale, BookOpen } from 'lucide-react'
import './SentenceModal.css'

const SentenceModal = ({ isOpen, onClose, addToast }) => {
  const [text, setText] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [category, setCategory] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef(null)

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="sentence-modal glass-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Window Header */}
            <div className="window-header">
              <div className="header-left">
                <Terminal size={14} className="header-icon" />
                <span className="window-title">Add New Sentence</span>
              </div>
              <div className="header-controls">
                <button className="control-btn close" onClick={onClose}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label className="input-label">Sentence Content</label>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste your professional quote here..."
                  className="sentence-textarea"
                  maxLength={500}
                />
                <div className="char-count">{text.length}/500</div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="input-label">Difficulty</label>
                  <div className="difficulty-toggle-group">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`toggle-btn ${difficulty === d ? 'active' : ''}`}
                        onClick={() => setDifficulty(d)}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group flex-1">
                  <label className="input-label">Category</label>
                  <div className="input-with-icon">
                    <BookOpen size={14} className="field-icon" />
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. tech, philosophy"
                      className="category-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="footer-btn secondary" 
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="footer-btn primary" 
                  disabled={!text.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : (
                    <>
                      <Plus size={16} />
                      <span>Add to Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default SentenceModal
