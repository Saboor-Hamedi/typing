import { Minus, Square, X, AppWindow } from 'lucide-react'
import './TitleBar.css'

const TitleBar = () => {
  const handleMinimize = () => {
    window.api?.window?.minimize()
  }

  const handleMaximize = () => {
    window.api?.window?.maximize()
  }

  const handleClose = () => {
    window.api?.window?.close()
  }

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
        <div className="titlebar-title">
           <AppWindow size={14} className="app-icon" />
           <span>TypingZone</span>
        </div>
      </div>
      
      <div className="titlebar-controls">
        <button onClick={handleMinimize} className="control-btn minimize" title="Minimize">
          <Minus size={14} />
        </button>
        <button onClick={handleMaximize} className="control-btn maximize" title="Maximize">
          <Square size={12} />
        </button>
        <button onClick={handleClose} className="control-btn close" title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
