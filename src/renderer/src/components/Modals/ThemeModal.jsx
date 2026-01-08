import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, CheckCircle2 } from 'lucide-react'
import './ThemeModal.css'

const THEMES = [
  { id: 'carbon', name: 'Carbon', bg: '#111111', main: '#e2b714', text: '#d1d0c5' },
  { id: 'nord', name: 'Nord', bg: '#2e3440', main: '#88c0d0', text: '#d8dee9' },
  { id: 'dracula', name: 'Dracula', bg: '#282a36', main: '#bd93f9', text: '#f8f8f2' },
  { id: 'serika_blue', name: 'Serika Blue', bg: '#15202b', main: '#1da1f2', text: '#ffffff' },
  { id: 'matrix', name: 'Matrix', bg: '#000000', main: '#15ff00', text: '#15ff00' },
  { id: 'lavender', name: 'Lavender', bg: '#1a1b26', main: '#bb9af7', text: '#cfc9c2' }
]

const ThemeModal = ({ isOpen, onClose, currentTheme, onSelect }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="theme-modal-overlay">
          <motion.div 
            className="theme-modal-overlay-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="theme-modal glass-panel"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="theme-modal-header">
              <h2><Palette size={24} /> Select Theme</h2>
              <button className="close-modal" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="theme-grid">
              {THEMES.map((t) => (
                <div 
                  key={t.id} 
                  className={`theme-item ${currentTheme === t.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelect(t.id)
                    // Optional: keep open or close
                  }}
                >
                  <div className="theme-preview" style={{ background: t.bg }}>
                    <div className="preview-top">
                      <div className="preview-dot" style={{ background: t.main }} />
                      <div className="preview-text" style={{ color: t.text, fontSize: '10px' }}>text</div>
                    </div>
                    <div className="preview-line" style={{ background: t.main }} />
                    <div className="preview-line" style={{ background: t.text, opacity: 0.3, width: '60%' }} />
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">{t.name}</span>
                    {currentTheme === t.id && <CheckCircle2 size={16} className="active-check" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="theme-modal-footer">
              <p>Themes update the entire UI instantly. Choose your aesthetic.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ThemeModal
