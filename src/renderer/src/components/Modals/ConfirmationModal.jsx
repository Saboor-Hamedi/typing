import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import '../Modals/Modal.css'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="modal-content glass-panel small-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', textAlign: 'center' }}
          >
            <div className="modal-header center">
              <AlertTriangle size={20} color="#ea3232" style={{ marginBottom: '0.75rem' }} />
              <h2 style={{ fontSize: '1.2rem' }}>{title}</h2>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{message}</p>
            </div>

            <div className="modal-footer center-gap">
              <button className="modal-btn secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="modal-btn primary danger"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationModal
