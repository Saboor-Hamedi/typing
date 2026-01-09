import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Github, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import './LoginModal.css'

import { supabase } from '../../utils/supabase'

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [formData, setFormData] = useState({ email: '', password: '', username: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { username: formData.username }
          }
        })
        if (error) throw error
        if (onLogin) onLogin(formData.username)
        onClose()
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        if (error) throw error
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Simplified: clicking overlay closes
        >
          <motion.div 
            layout
            className="modal-content login-modal glass-panel"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <motion.h2 layout="position">
                {mode === 'login' ? 'Welcome Back' : 'Join TypingZone'}
              </motion.h2>
              <button 
                className="close-btn" 
                onClick={onClose} 
                type="button"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <motion.div layout className="auth-tabs">
              <button 
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >
                Log In
              </button>
              <button 
                type="button"
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >
                Sign Up
              </button>
            </motion.div>

            <motion.form 
              layout
              className="auth-form" 
              onSubmit={handleSubmit}
              style={{ minHeight: '300px' }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {mode === 'signup' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="input-group"
                  >
                    <User size={18} />
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      required 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="input-group">
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>

              <div className="input-group">
                <Lock size={18} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="error-message" 
                  style={{ color: '#ff4444', fontSize: '0.85rem', background: 'rgba(255, 68, 68, 0.1)', padding: '10px', borderRadius: '4px', marginTop: '5px' }}
                >
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-2px' }}/>
                  {error}
                </motion.div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
              </button>
            </motion.form>

            <motion.div layout className="auth-divider">
              <span>OR</span>
            </motion.div>

            <motion.button layout className="social-btn github" type="button">
              <Github size={18} />
              <span>Continue with GitHub</span>
            </motion.button>

            <motion.p layout className="auth-footer">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <span className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </span>
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginModal
