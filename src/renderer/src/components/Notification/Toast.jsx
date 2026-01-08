import './Toast.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react'

const Toast = ({ message, type = 'info', onRemove }) => {
  const icons = {
    info: <Info size={18} />,
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />
  }

  return (
    <motion.div 
      className={`toast-notification ${type}`}
      initial={{ y: -50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="toast-icon">
        {icons[type]}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onRemove}>
        <X size={14} />
      </button>
    </motion.div>
  )
}

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onRemove={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
