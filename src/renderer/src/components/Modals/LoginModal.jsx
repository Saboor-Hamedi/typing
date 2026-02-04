/**
 * LoginModal
 *
 * Purpose:
 * - Handles credential login and OAuth-in-browser (deep link back to Electron).
 *
 * UX Details:
 * - Shows processing state per action; resets loading/error when modal closes.
 * - Password flow closes modal immediately on success and calls `onLogin` with display name.
 * - OAuth flow opens system browser; AppLayout observes `isLoggedIn` and auto-closes the modal
 *   once the deep link establishes the Supabase session.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Github, AlertCircle, Globe, AppWindow } from 'lucide-react'
import { useState, useEffect } from 'react'
import './LoginModal.css'

import { supabase } from '../../utils/supabase'

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [formData, setFormData] = useState({ 
    email: localStorage.getItem('lastEmail') || '', 
    password: localStorage.getItem('lastPassword') || '', 
    username: '' 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Reset transient state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLoading(false)
      setError(null)
    }
  }, [isOpen])

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
        setLoading(false)
        if (error) throw error

        // Save credentials for 'auto-completion' effect
        localStorage.setItem('lastEmail', formData.email)
        localStorage.setItem('lastPassword', formData.password)

        if (onLogin) onLogin(formData.username)
        onClose()
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        // Signal success immediately
        setLoading(false)
        if (error) throw error

        // Save credentials for 'auto-completion' effect
        localStorage.setItem('lastEmail', formData.email)
        localStorage.setItem('lastPassword', formData.password)

        // Handle success
        onClose()
        const user = data?.user
        const displayName = user?.user_metadata?.username || user?.email || 'User'
        if (onLogin) onLogin(displayName)
      }
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }

  const handleBrowserLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      // Construction of the redirect URL that Supabase will use to send the tokens back to Electron
      const redirectTo = 'typingzone://auth'
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
          skipBrowserRedirect: true
        }
      })

      if (error) throw error
      
      // Open the returned URL in the system browser
      if (data?.url) {
        window.api.openExternal(data.url)
      }
      
      setLoading(false)
    } catch (err) {
      setLoading(false)
      setError(err.message)
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
            onClick={(e) => e.stopPropagation()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-top-bar">
                <div className="modal-header-title">
                  <AppWindow size={12} className="modal-app-icon" />
                  <span>{mode === 'login' ? 'Authentication' : 'Registration'}</span>
                </div>
              <button 
                className="close-btn" 
                onClick={onClose} 
                type="button"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            <div className="modal-inner-content">
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
              >
              <AnimatePresence mode="popLayout" initial={false}>
                {mode === 'signup' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="input-group"
                  >
                    <label>Username</label>
                    <div className="input-container">
                      <User size={18} />
                      <input 
                        type="text" 
                        placeholder="Choose a typing name" 
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        required 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-container">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-container">
                  <Lock size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required 
                  />
                </div>
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

            <motion.button 
              layout 
              className="social-btn browser" 
              type="button" 
              onClick={handleBrowserLogin}
              disabled={loading}
            >
              <Globe size={16} />
              <span>Continue in Browser</span>
            </motion.button>

              <motion.p layout className="auth-footer">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <span className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </span>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginModal
