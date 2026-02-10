import { createPortal } from 'react-dom'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Search as SearchIcon,
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
import './DatabaseView.css'
import ConfirmationModal from '../Modals/ConfirmationModal'
import DatabaseModal from './DatabaseModal'
import { HighlightedText } from '../Common'
import Tooltip from '../Common/Tooltip'

const SkeletonRow = () => (
  <div className="db-row skeleton">
    <div className="db-col id"><div className="skeleton-pulse" style={{ width: '20px', height: '14px' }} /></div>
    <div className="db-col text"><div className="skeleton-pulse" style={{ width: '100%', height: '14px' }} /></div>
    <div className="db-col difficulty"><div className="skeleton-pulse" style={{ width: '60px', height: '20px', borderRadius: '4px' }} /></div>
    <div className="db-col category"><div className="skeleton-pulse" style={{ width: '70px', height: '14px' }} /></div>
    <div className="db-col actions"><div className="skeleton-pulse" style={{ width: '60px', height: '28px', borderRadius: '14px' }} /></div>
  </div>
)

const DatabaseView = ({ addToast }) => {
  const [sentences, setSentences] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const limit = 50

  // Reset scroll on page/search change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [page, debouncedSearch])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce
    return () => clearTimeout(timer)
  }, [search])

  // Global shortcut for focusing search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

  // ... (keep existing loadData, cleanup, handlers)
  const loadData = useCallback(async () => {
    if (!window.api?.db?.getPaginated) return
    setIsLoading(true)
    try {
      const result = await window.api.db.getPaginated(page, limit, debouncedSearch)
      setSentences(result.data)
      setTotal(result.total)
      setTotalPages(Math.ceil(result.total / limit))
    } catch (error) {
      console.error('Failed to load sentences:', error)
      addToast('Failed to load data', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setIsLoading(true)
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
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleModalSave = () => {
    loadData()
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

        {/* Actions Section */}
        <div className="db-sidebar-actions">
          <Tooltip content="Reload database" direction="bottom" fullWidth>
            <button className="db-sidebar-btn" onClick={loadData}>
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </Tooltip>
          <Tooltip content="Create new sentence" direction="bottom" fullWidth>
            <button className="db-sidebar-btn primary" onClick={handleAdd}>
              <Plus size={14} />
              <span>Add Sentence</span>
            </button>
          </Tooltip>
        </div>

        {/* Stats Cards */}
        <div className="db-stats-grid">
          <Tooltip content="Total sentences in database" direction="top" fullWidth>
            <div className="stat-card">
              <div className="stat-value">{total}</div>
              <div className="stat-label">Total</div>
            </div>
          </Tooltip>
          <Tooltip content="Beginner-friendly sentences" direction="top" fullWidth>
            <div className="stat-card">
              <div className="stat-value">
                {sentences.filter((s) => s.difficulty === 'easy').length}
              </div>
              <div className="stat-label">Easy</div>
            </div>
          </Tooltip>
          <Tooltip content="Standard complexity" direction="top" fullWidth>
            <div className="stat-card">
              <div className="stat-value">
                {sentences.filter((s) => s.difficulty === 'medium').length}
              </div>
              <div className="stat-label">Medium</div>
            </div>
          </Tooltip>
          <Tooltip content="Advanced typing challenges" direction="top" fullWidth>
            <div className="stat-card">
              <div className="stat-value">
                {sentences.filter((s) => s.difficulty === 'hard').length}
              </div>
              <div className="stat-label">Hard</div>
            </div>
          </Tooltip>
        </div>

        {/* Import/Export Section */}
        <div className="db-import-export-section">
          <Tooltip content="Upload sentences in bulk from a JSON file" direction="right">
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
          </Tooltip>

          <Tooltip content="Save all your sentences to a local JSON file" direction="right">
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
          </Tooltip>

          <Tooltip content="Warning: This action cannot be undone" direction="right">
            <div className="import-export-card danger-card">
              <div className="card-header">
                <Trash2 size={16} />
                <span>Danger Zone</span>
              </div>
              <p>Clear entire database permanently</p>
              <button className="action-btn-large danger" onClick={() => setShowDeleteAllModal(true)}>
                <Trash2 size={14} />
                Delete All
              </button>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Main Content */}
      <div className="db-main-content">
        {/* Table Controls */}
        <div className="db-table-controls">
          {isLoading && <div className="db-loading-bar" />}
          <div className="db-search-wrapper">
            <div className="db-search-left-icon">
              <SearchIcon size={16} />
            </div>
            <input
              ref={searchRef}
              type="text"
              className="db-search"
              placeholder="Search sentences... (Ctrl+K)"
              value={search}
              onChange={handleSearch}
              spellCheck={false}
            />
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="db-search-status-icon loader spin"
                >
                  <RefreshCw size={14} strokeWidth={2.5} />
                </motion.div>
              ) : search ? (
                <motion.button
                  key="clear"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="db-search-status-icon clear-btn"
                  onClick={() => {
                    setSearch('')
                    setPage(1)
                    searchRef.current?.focus()
                  }}
                  title="Clear Search"
                >
                  <X size={14} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="db-table-container">
          <div className="db-table-header">
            <div className="db-col id">ID</div>
            <div className="db-col text">Content</div>
            <div className="db-col difficulty">Difficulty</div>
            <div className="db-col category">Category</div>
            <div className="db-col actions">Actions</div>
          </div>

          <div className="db-list" ref={listRef}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={`skeleton-${i}`} />
                ))
              ) : sentences.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="db-empty-state"
                >
                  <BookOpen
                    size={48}
                    strokeWidth={1.5}
                    style={{ opacity: 0.3, marginBottom: '16px' }}
                  />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>
                    {search ? 'No matching sentences found' : 'Loading sentences...'}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--sub-color)', fontSize: '0.9rem' }}>
                    {search
                      ? 'Try a different search term or add a new custom sentence'
                      : 'The database is being initialized with default sentences'}
                  </p>
                </motion.div>
              ) : (
                sentences.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="db-row"
                  >
                    <div className="db-col id">#{item.id}</div>
                    <div className="db-col text" title={item.text}>
                      <HighlightedText text={item.text} query={search} />
                    </div>
                    <div className="db-col difficulty">
                      <span className={`db-badge ${item.difficulty}`}>{item.difficulty}</span>
                    </div>
                    <div className="db-col category">{item.category}</div>
                    <div className="db-col actions">
                      <button className="action-btn" onClick={() => handleEdit(item)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
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

      <DatabaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        onSave={handleModalSave}
        addToast={addToast}
      />

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
