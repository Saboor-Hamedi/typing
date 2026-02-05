import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, X, BookOpen, Plus } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import './CustomContentModal.css'

const CustomContentModal = ({ isOpen, onClose, editingSentence = null }) => {
  const { dictionary, updateSentences } = useSettings()
  const [localSentences, setLocalSentences] = useState([])
  const [newSentence, setNewSentence] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef(null)

  // Sync with dictionary when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSentences([...dictionary.content])
      if (editingSentence) {
        setNewSentence(editingSentence)
      } else {
        setNewSentence('')
      }
      
      // Auto-focus textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          // Place cursor at end of input
          textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
        }
      }, 50)
    }
  }, [isOpen, dictionary.content, editingSentence])

  const handleAddSentence = async () => {
    if (newSentence.trim()) {
      let updated;
      
      // If editing mode and we can find the original, replace it
      if (editingSentence) {
         const idx = localSentences.indexOf(editingSentence);
         if (idx !== -1) {
             updated = [...localSentences];
             updated[idx] = newSentence.trim();
         } else {
             // Fallback: If original not found (e.g. modified by randomizer), just add new? 
             // Or try to fuzzy match? For now, let's just add it to avoid data loss.
             updated = [...localSentences, newSentence.trim()];
         }
      } else {
          updated = [...localSentences, newSentence.trim()];
      }

      setLocalSentences(updated)
      setNewSentence('')
      await updateSentences(updated)
      onClose() // Auto-close after adding content
    }
  }



  const handleKeyPress = (e) => {
    // Escape should always close
    if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
    }

    // Allow Ctrl+Enter or Cmd+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-modal-header">
              <div className="cc-header-title">
                <BookOpen size={12} className="cc-header-icon" />
                <span>{editingSentence ? 'Edit Sentence' : 'Add Custom Content'}</span>
              </div>
              <button className="cc-header-close-btn" onClick={onClose}>
                <X size={12} />
              </button>
            </div>

            <div className="cc-modal-body">
                <div className="cc-sentence-input-wrapper">
                  <textarea
                    ref={textareaRef}
                    placeholder="Enter a new sentence or quote..."
                    value={newSentence}
                    onChange={(e) => setNewSentence(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={5}
                  />
                </div>
            </div>

            <div className="cc-modal-footer">
              <button className="cc-cancel-btn" onClick={onClose}>Cancel</button>
              <div className="cc-footer-right">
                  <button 
                    className="cc-add-btn" 
                    onClick={handleAddSentence}
                    disabled={!newSentence.trim()}
                  >
                    {editingSentence ? <Edit2 size={14} /> : <Plus size={16} />}
                    <span>{editingSentence ? 'Update' : 'Add'}</span>
                  </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CustomContentModal
