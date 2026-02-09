import { createPortal } from 'react-dom'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Download,
  X,
  RefreshCw,
  Terminal,
  BookOpen,
  Quote,
  BarChart2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import '../Modals/LoginModal.css' // Use LoginModal styles for consistency
import './DatabaseView.css'
import ConfirmationModal from '../Modals/ConfirmationModal'

const DatabaseView = ({ addToast }) => {
  const [sentences, setSentences] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const limit = 50

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    text: '',
    difficulty: 'medium',
    category: 'general'
  })

  // Helper to get character limit based on difficulty
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

  // ... (keep existing loadData, cleanup, handlers)
  const loadData = useCallback(async () => {
    if (!window.api?.db?.getPaginated) return
    setIsLoading(true)
    try {
      const result = await window.api.db.getPaginated(page, limit, search)
      setSentences(result.data)
      setTotal(result.total)
      setTotalPages(Math.ceil(result.total / limit))
    } catch (error) {
      console.error('Failed to load sentences:', error)
      addToast('Failed to load data', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sentence?')) return
    try {
      const success = await window.api.db.deleteSentence(id)
      if (success) {
        addToast('Sentence deleted', 'success')
        loadData()
      } else {
        addToast('Failed to delete', 'error')
      }
    } catch (error) {
      addToast('Error deleting sentence', 'error')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      text: item.text,
      difficulty: item.difficulty,
      category: item.category || 'general'
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      text: '',
      difficulty: 'medium',
      category: 'general'
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        // Update
        const success = await window.api.db.updateSentence(
          editingItem.id,
          formData.text,
          formData.difficulty,
          formData.category
        )
        if (success) {
          addToast('Sentence updated', 'success')
          setIsModalOpen(false)
          loadData()
        } else {
          addToast('Failed to update', 'error')
        }
      } else {
        // Add
        const id = await window.api.db.addSentence(
          formData.text,
          formData.difficulty,
          formData.category
        )
        if (id) {
          addToast('Sentence added', 'success')
          setIsModalOpen(false)
          loadData()
        } else {
          addToast('Failed to add', 'error')
        }
      }
    } catch (error) {
      console.error(error)
      addToast('Operation failed', 'error')
    }
  }

  const handleExport = async () => {
    try {
      const data = await window.api.db.export()
      console.log('Export data:', data)
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sentences-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        addToast(`Exported ${data.count} sentences`, 'success')
      } else {
        addToast('No data to export', 'error')
      }
    } catch (error) {
      console.error('Export error:', error)
      addToast(`Export failed: ${error.message}`, 'error')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        // Validate format
        let sentences = []
        if (Array.isArray(data)) {
          sentences = data
        } else if (data.sentences && Array.isArray(data.sentences)) {
          sentences = data.sentences
        } else {
          throw new Error('Invalid format')
        }

        setIsLoading(true)
        const result = await window.api.db.bulkImport(sentences, true)

        if (result.success) {
          addToast(
            `Imported ${result.imported} sentences (${result.skipped} duplicates skipped)`,
            'success'
          )
          loadData()
        } else {
          addToast(result.error || 'Import failed', 'error')
        }
      } catch (error) {
        addToast('Invalid JSON file', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    input.click()
  }

  const handleDeleteAll = async () => {
    try {
      const success = await window.api.db.deleteAll()
      if (success) {
        addToast('All sentences deleted', 'success')
        loadData()
      } else {
        addToast('Failed to delete sentences', 'error')
      }
    } catch (error) {
      console.error('Delete all error:', error)
      addToast(`Delete failed: ${error.message}`, 'error')
    }
  }

  return (
    <div className="database-view">
      {/* Sidebar */}
      <div className="db-sidebar">
        <div className="db-dashboard-header">
          <div className="db-title">
            <h1>Content Manager</h1>
            <p>Database Overview</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="db-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {sentences.filter((s) => s.difficulty === 'easy').length}
            </div>
            <div className="stat-label">Easy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {sentences.filter((s) => s.difficulty === 'medium').length}
            </div>
            <div className="stat-label">Medium</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {sentences.filter((s) => s.difficulty === 'hard').length}
            </div>
            <div className="stat-label">Hard</div>
          </div>
        </div>

        {/* Import/Export Section */}
        <div className="db-import-export-section">
          <div className="import-export-card">
            <div className="card-header">
              <Upload size={16} />
              <span>Import</span>
            </div>
            <p>Bulk import from JSON</p>
            <button className="action-btn-large" onClick={handleImport}>
              <Upload size={14} />
              Choose File
            </button>
          </div>

          <div className="import-export-card">
            <div className="card-header">
              <Download size={16} />
              <span>Export</span>
            </div>
            <p>Download as JSON</p>
            <button className="action-btn-large" onClick={handleExport}>
              <Download size={14} />
              Download
            </button>
          </div>

          <div className="import-export-card danger-card">
            <div className="card-header">
              <Trash2 size={16} />
              <span>Delete All</span>
            </div>
            <p>Clear entire database</p>
            <button className="action-btn-large danger" onClick={() => setShowDeleteAllModal(true)}>
              <Trash2 size={14} />
              Delete All
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="db-main-content">
        {/* Table Controls */}
        <div className="db-table-controls">
          <input
            type="text"
            className="db-search"
            placeholder="Search sentences..."
            value={search}
            onChange={handleSearch}
          />
          <button className="db-add-btn" onClick={loadData}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            {/* Refresh */}
          </button>
          <button className="db-add-btn primary" onClick={handleAdd}>
            <Plus size={16} />
            {/* Add New */}
          </button>
        </div>

        <div className="db-table-container">
          <div className="db-table-header">
            <div>ID</div>
            <div>Content</div>
            <div>Difficulty</div>
            <div>Category</div>
            <div>Actions</div>
          </div>

          <div className="db-list">
            {isLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--sub-color)' }}>
                Loading...
              </div>
            ) : sentences.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--sub-color)' }}>
                No records found.
              </div>
            ) : (
              sentences.map((item) => (
                <div key={item.id} className="db-row">
                  <div className="db-col id">#{item.id}</div>
                  <div className="db-col text" title={item.text}>
                    {item.text}
                  </div>
                  <div className="db-col">
                    <span className={`db-badge ${item.difficulty}`}>{item.difficulty}</span>
                  </div>
                  <div className="db-col">{item.category}</div>
                  <div className="db-col actions">
                    <button className="action-btn" onClick={() => handleEdit(item)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="db-pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-info">
              Page {page} of {totalPages || 1} ({total} items)
            </span>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
              <motion.div
                className="modal-content login-modal glass-panel"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{ width: '500px', maxWidth: '95vw' }}
              >
                {/* Header */}
                <div className="modal-top-bar">
                  <div className="modal-header-title">
                    <Terminal size={14} className="modal-app-icon" />
                    <span>{editingItem ? 'Edit Sentence' : 'Add New Sentence'}</span>
                  </div>
                  <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                    <X size={14} />
                  </button>
                </div>

                <div className="modal-inner-content">
                  <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                      <label>Sentence Content</label>
                      <div className="input-container" style={{ height: 'auto', padding: '10px' }}>
                        <Quote size={16} style={{ marginTop: '4px', alignSelf: 'flex-start' }} />
                        <textarea
                          value={formData.text}
                          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                          required
                          placeholder="Type or paste sentence..."
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-color)',
                            fontFamily: 'inherit',
                            fontSize: '0.95rem',
                            resize: 'none',
                            minHeight: '80px'
                          }}
                          maxLength={getCharLimit(formData.difficulty)}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--sub-color)',
                          textAlign: 'right'
                        }}
                      >
                        {formData.text.length}/{getCharLimit(formData.difficulty)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div className="input-group" style={{ flex: 1 }}>
                        <label>Difficulty</label>
                        <div className="segmented-control">
                          {['easy', 'medium', 'hard'].map((d) => (
                            <button
                              key={d}
                              type="button"
                              className={`segmented-btn ${formData.difficulty === d ? 'active' : ''}`}
                              onClick={() => setFormData({ ...formData, difficulty: d })}
                            >
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="input-group" style={{ flex: 1 }}>
                        <label>Category</label>
                        <div className="input-container">
                          <BookOpen size={16} />
                          <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g. tech"
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                      <button
                        type="button"
                        className="submit-btn secondary no-glow"
                        onClick={() => setIsModalOpen(false)}
                        style={{
                          flex: 1,
                          margin: 0,
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--sub-color)',
                          fontSize: '0.9rem',
                          height: '48px'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-btn no-glow"
                        style={{
                          flex: 1,
                          margin: 0,
                          fontSize: '0.9rem',
                          height: '48px'
                        }}
                      >
                        {editingItem ? 'Update' : 'Add to Database'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <ConfirmationModal
          isOpen={showDeleteAllModal}
          onClose={() => setShowDeleteAllModal(false)}
          onConfirm={handleDeleteAll}
          title="Delete All Sentences?"
          message="This will permanently delete all sentences from the database. This action cannot be undone."
          confirmText="Delete All"
        />,
        document.body
      )}
    </div>
  )
}

export default DatabaseView
