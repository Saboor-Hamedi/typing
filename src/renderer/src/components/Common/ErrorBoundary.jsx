import React from 'react'
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react'
import './ErrorBoundary.css'

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Displays fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCopyError = () => {
    const { error, errorInfo } = this.state
    const errorText = `Error: ${error?.toString()}\n\nStack Trace:\n${errorInfo?.componentStack}`

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    })
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertTriangle size={32} />
            </div>

            <h1 className="error-title">Oops! Something went wrong</h1>
            <p className="error-message">
              The application encountered an unexpected error. Try refreshing the page or resetting
              the app.
            </p>

            <div className="error-actions">
              <button onClick={this.handleReset} className="error-btn primary">
                <Home size={16} />
                <span>Try Again</span>
              </button>
              <button onClick={this.handleReload} className="error-btn secondary">
                <RefreshCw size={16} />
                <span>Reload App</span>
              </button>
              {isDev && (
                <button
                  onClick={this.handleCopyError}
                  className="error-btn copy"
                  title="Copy error details"
                >
                  {this.state.copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{this.state.copied ? 'Copied!' : 'Copy Error'}</span>
                </button>
              )}
            </div>

            {isDev && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <br />
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
