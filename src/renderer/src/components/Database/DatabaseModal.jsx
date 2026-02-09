import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X, Terminal, Quote, BookOpen } from 'lucide-react'
import './DatabaseModal.css'

/**
 * DatabaseModal
 * 
 * A standalone modal for adding or editing database sentences.
 * Integrated with the char limit system based on difficulty.
 */
const DatabaseModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingItem = null,
  addToast 
}) => {
  const [formData, setFormData] = useState({
    text: '',
    difficulty: 'medium',
    category: 'general'
  })

  // Initialize form when editingItem changes or modal opens
  useEffect(() => {
    if (editingItem) {
      setFormData({
        text: editingItem.text || '',
        difficulty: editingItem.difficulty || 'medium',
        category: editingItem.category || 'general'
      })
    } else {
      setFormData({
        text: '',
        difficulty: 'medium',
        category: 'general'
      })
    }
  }, [editingItem, isOpen])

  const getCharLimit = (difficulty) => {
    if (difficulty === 'easy') return 100
    if (difficulty === 'medium') return 130
    return 150
  }

  // Truncate text if it exceeds new difficulty limit
  useEffect(() => {
    const limit = getCharLimit(formData.difficulty)
    if (formData.text.length > limit) {
      setFormData((prev) => ({ ...prev, text: prev.text.slice(0, limit) }))
    }
  }, [formData.difficulty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let success = false
      if (editingItem) {
        success = await window.api.db.updateSentence(
          editingItem.id,
          formData.text,
          formData.difficulty,
          formData.category
        )
      } else {
        const id = await window.api.db.addSentence(
          formData.text,
          formData.difficulty,
          formData.category
        )
        success = !!id
      }

      if (success) {
        if (addToast) addToast(editingItem ? 'Sentence updated' : 'Sentence added', 'success')
        if (onSave) onSave()
        onClose()
      } else {
        if (addToast) addToast('Operation failed', 'error')
      }
    } catch (error) {
      console.error('Modal Submit Error:', error)
      if (addToast) addToast('An error occurred', 'error')
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="database-modal-wrapper" onClick={onClose}>
          <motion.div
            className="database-modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Robust Header - Locked Height */}
            <div className="db-modal-header">
              <div className="db-modal-title">
                <Terminal size={14} />
                <span>{editingItem ? 'Edit Content' : 'Add New Content'}</span>
              </div>
              <button className="db-modal-close" onClick={onClose}>
                <X size={14} />
              </button>
            </div>

            <div className="db-modal-body">
              <form onSubmit={handleSubmit}>
                {/* Content Textarea */}
                <div className="db-input-group">
                  <label className="db-label">Content Text</label>
                  <div className="db-field-container textarea">
                    <Quote size={14} style={{ marginTop: '4px', alignSelf: 'flex-start', opacity: 0.4 }} />
                    <textarea
                      className="db-textarea"
                      value={formData.text}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      required
                      placeholder="Type or paste your content here..."
                      maxLength={getCharLimit(formData.difficulty)}
                    />
                  </div>
                  <div className="db-char-count">
                    {formData.text.length} / {getCharLimit(formData.difficulty)}
                  </div>
                </div>

                {/* Difficulty & Category - Perfectly Aligned Row */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div className="db-input-group no-margin" style={{ flex: 1 }}>
                    <label className="db-label">Difficulty Tier</label>
                    <div className="db-segmented">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`db-seg-btn ${formData.difficulty === d ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, difficulty: d })}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="db-input-group no-margin" style={{ flex: 1 }}>
                    <label className="db-label">Category / Tag</label>
                    <div className="db-field-container">
                      <BookOpen size={14} style={{ opacity: 0.4 }} />
                      <input
                        className="db-input"
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. quotes"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="db-footer">
                  <button
                    type="button"
                    className="db-btn secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="db-btn primary"
                  >
                    {editingItem ? 'Save Changes' : 'Save Content'}
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

export default DatabaseModal
