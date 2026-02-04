/**
 * KeyboardShortcutsModal Component
 * 
 * Displays a modal with all available keyboard shortcuts
 * 
 * @component
 */
import { memo, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import './KeyboardShortcutsModal.css'

/**
 * KeyboardShortcutsModal
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 */
const KeyboardShortcutsModal = memo(({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Test Controls',
      items: [
        { keys: ['Tab'], description: 'Restart test' },
        { keys: ['Enter', 'Esc'], description: 'Close results view' },
        { keys: ['Ctrl', 'R'], description: 'Restart test (alternative)' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', ','], description: 'Open settings' },
        { keys: ['Ctrl', 'T'], description: 'Open themes' },
        { keys: ['Ctrl', 'P'], description: 'Command Palette' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['Esc'], description: 'Close modals/dropdowns' },
        { keys: ['Enter', 'Space'], description: 'Activate buttons' },
      ]
    }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="keyboard-shortcuts-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Keyboard size={20} />
            <span>Keyboard Shortcuts</span>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shortcuts-content">
          {shortcuts.map((category, idx) => (
            <div key={idx} className="shortcut-category">
              <h3 className="category-title">{category.category}</h3>
              <div className="shortcut-list">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="shortcut-item">
                    <div className="shortcut-keys">
                      {item.keys.map((key, keyIdx) => (
                        <span key={keyIdx}>
                          <kbd>{key}</kbd>
                          {keyIdx < item.keys.length - 1 && <span className="key-separator">+</span>}
                        </span>
                      ))}
                    </div>
                    <span className="shortcut-description">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-primary" onClick={onClose} type="button">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
})

KeyboardShortcutsModal.displayName = 'KeyboardShortcutsModal'

export default KeyboardShortcutsModal
