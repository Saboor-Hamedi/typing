import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, CheckCircle2 } from 'lucide-react'
import './ThemeModal.css'

const THEMES = [
  { id: 'carbon', name: 'Carbon', bg: '#111111', main: '#e2b714', text: '#d1d0c5' },
  { id: 'nord', name: 'Nord', bg: '#323437', main: '#e2b714', text: '#d1d0c5' },
  { id: 'dracula', name: 'Dracula', bg: '#1e1f29', main: '#bd93f9', text: '#f8f8f2' },
  { id: 'serika_blue', name: 'Serika Blue', bg: '#0d1117', main: '#58a6ff', text: '#c9d1d9' },
  { id: 'matrix', name: 'Matrix', bg: '#000000', main: '#ffffff', text: '#ffffff' },
  { id: 'lavender', name: 'Lavender', bg: '#11111b', main: '#cba6f7', text: '#cdd6f4' },
  { id: 'rose_pine', name: 'Rose Pine', bg: '#191724', main: '#ebbcba', text: '#e0def4' },
  { id: 'cyberpunk', name: 'Cyberpunk', bg: '#000000', main: '#f6019d', text: '#ffffff' },
  { id: 'synthwave', name: 'Synthwave', bg: '#2b213a', main: '#ff7edb', text: '#f2e6ff' }
]

const ThemeModal = ({ isOpen, onClose, currentTheme, onSelect }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="theme-modal-overlay" onClick={onClose}>
          <motion.div 
            className="theme-modal glass-panel"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="theme-modal-header window-like-header">
              <div className="header-title">
                <Palette size={12} className="header-icon"/>
                <span>Select Theme</span>
              </div>
              <button className="header-close-btn" onClick={onClose}>
                <X size={12} />
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
