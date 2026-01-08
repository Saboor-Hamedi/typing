import './SettingsView.css'
import { motion } from 'framer-motion'
import { Trophy, Volume2, CloudRain, Trash2, ShieldCheck, Github, Zap, Map, Palette } from 'lucide-react'

const SettingsView = ({ 
  isGhostEnabled, 
  setIsGhostEnabled,
  isSoundEnabled,
  setIsSoundEnabled,
  isHallEffect,
  setIsHallEffect,
  isChameleonEnabled,
  setIsChameleonEnabled,
  isKineticEnabled,
  setIsKineticEnabled,
  onClearHistory,
  openThemeModal
}) => {
  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your typing environment</p>
      </div>

      <div className="settings-sections">
        {/* Appearance Section */}
        <section className="settings-section glass-panel">
          <div className="section-title">
            <Palette size={18} />
            <span>Appearance</span>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Application Theme</div>
              <p className="setting-description">Change the overall look and feel of TypingZone.</p>
            </div>
            <button className="config-btn active" onClick={openThemeModal} style={{ padding: '8px 16px' }}>
              Select Theme
            </button>
          </div>
        </section>

        {/* Gameplay Section */}
        <section className="settings-section glass-panel">
          <div className="section-title">
            <ShieldCheck size={18} />
            <span>Gameplay</span>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Trophy size={16} />
                <span>Ghost Caret (PB Race)</span>
              </div>
              <p className="setting-description">Race against your personal best speed during the test.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isGhostEnabled} 
                onChange={() => setIsGhostEnabled(!isGhostEnabled)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Zap size={16} />
                <span>Chameleon Flow</span>
              </div>
              <p className="setting-description">UI colors react to your speed. "Heat up" as you approach your PB.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isChameleonEnabled} 
                onChange={() => setIsChameleonEnabled(!isChameleonEnabled)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Map size={16} color="#00ff80" />
                <span style={{ color: '#00ff80' }}>Kinetic Heatmaps</span>
              </div>
              <p className="setting-description">Track finger bottlenecks and transition speeds per key.</p>
            </div>
            <label className="toggle-switch specialized">
              <input 
                type="checkbox" 
                checked={isKineticEnabled} 
                onChange={() => setIsKineticEnabled(!isKineticEnabled)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </section>

        {/* Audio Section */}
        <section className="settings-section glass-panel">
          <div className="section-title">
            <Volume2 size={18} />
            <span>Acoustics</span>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Volume2 size={16} />
                <span>Mechanical Sound</span>
              </div>
              <p className="setting-description">High-fidelity mechanical switch feedback on every keypress.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isSoundEnabled} 
                onChange={() => setIsSoundEnabled(!isSoundEnabled)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <CloudRain size={16} />
                <span>Hall Reverb Effect</span>
              </div>
              <p className="setting-description">Add a spacious hall-like atmosphere to the keyboard sounds.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isHallEffect} 
                onChange={() => setIsHallEffect(!isHallEffect)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </section>

        {/* Data Section */}
        <section className="settings-section glass-panel danger">
          <div className="section-title">
            <Trash2 size={18} />
            <span>Data Management</span>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Danger Zone</div>
              <p className="setting-description">This will permanently delete all your saved test history and PBs.</p>
            </div>
            <button className="danger-btn" onClick={onClearHistory}>
              <Trash2 size={14} /> Clear All Data
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="settings-section links">
           <a href="https://github.com/Saboor-Hamedi" target="_blank" rel="noreferrer" className="link-item">
             <Github size={18} />
             <span>View on GitHub</span>
           </a>
        </section>
      </div>
    </div>
  )
}

export default SettingsView
