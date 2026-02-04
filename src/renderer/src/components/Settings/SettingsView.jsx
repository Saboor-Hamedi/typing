import './SettingsView.css'
import { motion } from 'framer-motion'
import { Trophy, Volume2, CloudRain, Trash2, ShieldCheck, Github, Zap, Map, Palette, Type, AlertCircle, Play, Hash, CaseSensitive, Quote, Flame } from 'lucide-react'
import { useSettings } from '../../contexts'

/**
 * Settings View Component
 * Allows users to customize app behavior and appearance
 */
const SettingsView = ({ onClearHistory, openThemeModal }) => {
  const {
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
    isSmoothCaret,
    setIsSmoothCaret,
    ghostSpeed,
    setGhostSpeed,
    caretStyle,
    setCaretStyle,
    isErrorFeedbackEnabled,
    setIsErrorFeedbackEnabled,
    isZenMode,
    setIsZenMode,
    soundProfile,
    setSoundProfile,
    isCenteredScrolling,
    setIsCenteredScrolling,
    difficulty,
    setDifficulty,
    hasPunctuation,
    setHasPunctuation,
    hasNumbers,
    setHasNumbers,
    hasCaps,
    setHasCaps
  } = useSettings()
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
            <button className="settings-action-btn" onClick={openThemeModal}>
              Select Theme
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Type size={16} />
                <span>Thin Caret</span>
              </div>
              <p className="setting-description">Use a standard 2px vertical bar.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={caretStyle === 'bar'} 
                onChange={() => setCaretStyle('bar')} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Type size={16} />
                <span>Thick Caret</span>
              </div>
              <p className="setting-description">Use a 7px block that inverts colors.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={caretStyle === 'block'} 
                onChange={() => setCaretStyle('block')} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Flame size={16} color="#ff4500" />
                <span>Flame Caret</span>
              </div>
              <p className="setting-description">High-performance animated fire effect (GPU).</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={caretStyle === 'fire'} 
                onChange={() => setCaretStyle('fire')} 
              />
              <span className="slider"></span>
            </label>
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

          <motion.div 
            initial={false}
            animate={{ height: isGhostEnabled ? 'auto' : 0, opacity: isGhostEnabled ? 1 : 0 }}
            className="setting-sub-item"
            style={{ overflow: 'hidden' }}
          >
            <div className="slider-container" style={{ padding: '10px 0 10px 20px', borderLeft: '2px solid var(--sub-alt-color)', marginTop: '10px' }}>
              <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--sub-color)' }}>Ghost Intensity</span>
                <span style={{ color: 'var(--main-color)', fontWeight: 'bold' }}>{Math.round(ghostSpeed * 100)}% of PB</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.05" 
                value={ghostSpeed} 
                onChange={(e) => setGhostSpeed(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--main-color)', cursor: 'pointer' }}
              />
            </div>
          </motion.div>

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
                <Map size={16} className="kinetic-accent" />
                <span className="kinetic-accent">Kinetic Heatmaps</span>
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

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Zap size={16} />
                <span>Smooth Caret</span>
              </div>
              <p className="setting-description">Enable smooth animation for the typing caret movement.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isSmoothCaret} 
                onChange={() => setIsSmoothCaret(!isSmoothCaret)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <ShieldCheck size={16} />
                <span>Centered Line Scrolling</span>
              </div>
              <p className="setting-description">Keep the active line locked in the vertical center for better focus.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isCenteredScrolling} 
                onChange={() => setIsCenteredScrolling(!isCenteredScrolling)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <AlertCircle size={16} />
                <span>Error Feedback</span>
              </div>
              <p className="setting-description">Visual red glow and shake animation when you mistype.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isErrorFeedbackEnabled} 
                onChange={() => setIsErrorFeedbackEnabled(!isErrorFeedbackEnabled)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Play size={16} />
                <span>Zen Mode</span>
              </div>
              <p className="setting-description">Hide unnecessary UI elements while typing for maximum focus.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isZenMode} 
                onChange={() => setIsZenMode(!isZenMode)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </section>

        {/* Complexity & Training Section */}
        <section className="settings-section glass-panel">
          <div className="section-title">
            <Zap size={18} />
            <span>Complexity & Training</span>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <ShieldCheck size={16} />
                <span>Difficulty Level</span>
              </div>
              <p className="setting-description">Choose word list complexity (Short vs. Technical).</p>
            </div>
            <select 
              className="settings-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="beginner">Beginner (1-4 letters)</option>
              <option value="intermediate">Intermediate (Mixed)</option>
              <option value="advanced">Advanced (Long Words)</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Quote size={16} />
                <span>Punctuation</span>
              </div>
              <p className="setting-description">Inject periods, commas, and question marks.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={hasPunctuation} 
                onChange={() => setHasPunctuation(!hasPunctuation)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <Hash size={16} />
                <span>Numbers</span>
              </div>
              <p className="setting-description">Add numerals 0-9 to the word stream.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={hasNumbers} 
                onChange={() => setHasNumbers(!hasNumbers)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">
                <CaseSensitive size={16} />
                <span>Capitalization</span>
              </div>
              <p className="setting-description">Practice using the SHIFT key (Aa).</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={hasCaps} 
                onChange={() => setHasCaps(!hasCaps)} 
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
              <p className="setting-description">Enable or disable high-fidelity mechanical switch feedback.</p>
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
                <Volume2 size={16} />
                <span>Sound Profile</span>
              </div>
              <p className="setting-description">Choose your preferred mechanical switch acoustic profile.</p>
            </div>
            <select 
              className="settings-select"
              value={soundProfile}
              onChange={(e) => setSoundProfile(e.target.value)}
            >
              <option value="thocky">Thocky (Deep)</option>
              <option value="creamy">Creamy (Marble)</option>
              <option value="clicky">Clicky (Crisp)</option>
              <option value="raindrop">Raindrop (Soft)</option>
              <option value="wood">Wood Block (Warm)</option>
            </select>
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
