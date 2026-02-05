import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Save, Trash2, Plus, Quote } from 'lucide-react'
import { useSettings } from '../../contexts'
import './CustomContentModal.css'

const CustomContentModal = ({ isOpen, onClose }) => {
  const { dictionary, updateSentences } = useSettings()
  const [localSentences, setLocalSentences] = useState([])
  const [newSentence, setNewSentence] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Sync with dictionary when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSentences([...dictionary.sentences])
    }
  }, [isOpen, dictionary.sentences])

  const handleAddSentence = async () => {
    if (newSentence.trim()) {
      const updated = [...localSentences, newSentence.trim()]
      setLocalSentences(updated)
      setNewSentence('')
      await updateSentences(updated)
    }
  }

  const handleDeleteSentence = async (index) => {
    const updated = localSentences.filter((_, i) => i !== index)
    setLocalSentences(updated)
    await updateSentences(updated)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await updateSentences(localSentences)
    setIsSaving(false)
    onClose()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddSentence()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="custom-content-overlay" onClick={onClose}>
          <motion.div
            className="custom-content-modal glass-panel"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-modal-header">
              <div className="cc-header-title">
                <BookOpen size={12} className="cc-header-icon" />
                <span>Custom Typing Content</span>
              </div>
              <button className="cc-header-close-btn" onClick={onClose}>
                <X size={12} />
              </button>
            </div>

            <div className="cc-modal-body">
              <div className="cc-content-section">
                <h3>Custom Sentences</h3>
                <p className="cc-subtitle">These will be used in Intermediate and Advanced modes.</p>
                
                <div className="cc-sentence-input-wrapper">
                  <textarea
                    placeholder="Enter a new sentence or quote..."
                    value={newSentence}
                    onChange={(e) => setNewSentence(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={2}
                  />
                  <button 
                    className="cc-add-btn" 
                    onClick={handleAddSentence}
                    disabled={!newSentence.trim()}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                <div className="cc-sentence-list">
                  {localSentences.length === 0 ? (
                    <div className="cc-empty-state">
                      <Quote size={32} opacity={0.2} />
                      <p>No custom sentences yet.</p>
                    </div>
                  ) : (
                    localSentences.map((s, idx) => (
                      <div key={idx} className="cc-sentence-item">
                        <div className="cc-sentence-text">{s}</div>
                        <button 
                          className="cc-delete-btn" 
                          onClick={() => handleDeleteSentence(idx)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="cc-modal-footer">
              <button className="cc-cancel-btn" onClick={onClose}>Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CustomContentModal
