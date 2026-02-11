import React from 'react'
import { motion } from 'framer-motion'
import {
  Book,
  Keyboard,
  Zap,
  Activity,
  Shield,
  Cpu,
  Trophy,
  Flame,
  Cloud,
  MousePointer2,
  Terminal,
  Settings as SettingsIcon,
  Navigation,
  Gamepad2,
  Info
} from 'lucide-react'
import './DocumentationView.css'

const DocumentationView = () => {
  const categories = [
    {
      title: 'Core Mechanics',
      icon: <Keyboard className="cat-icon" size={20} />,
      items: [
        {
          name: 'Time Mode',
          desc: "Test speed over 15, 30, or 60s with 'Soft Finish' logic."
        },
        { name: 'Words Mode', desc: 'Complete set word counts (25, 50, 100) at your own pace.' },
        {
          name: 'Sentence Mode',
          desc: 'Type real-world quotes and phrases for a natural typing feel.'
        }
      ]
    },
    {
      title: 'Advanced VFX',
      icon: <Flame className="cat-icon" size={20} />,
      items: [
        {
          name: 'Chameleon Flow',
          desc: 'The UI palette shifts dynamically based on your live WPM heat.'
        },
        { name: 'Ghost Racing', desc: 'Race against your Personal Best shadow in real-time.' },
        {
          name: 'Sound Engine',
          desc: 'Synthetic mechanical key sounds (Thocky, Creamy, ASMR).'
        }
      ]
    },
    {
      title: 'Progression',
      icon: <Trophy className="cat-icon" size={20} />,
      items: [
        {
          name: 'Leveling System',
          desc: 'Earn XP for every test. Higher accuracy/WPM yields more XP.'
        },
        { name: 'Wardrobe', desc: 'Unlock exclusive avatars as you climb through the Tiers.' },
        { name: 'Rank Tiers', desc: 'Progress from Initiate to Ascended based on your level.' }
      ]
    },
    {
      title: 'Cloud & Sync',
      icon: <Cloud className="cat-icon" size={20} />,
      items: [
        { name: 'Supabase Sync', desc: 'Sync scores, PBs, and unlocks across all your devices.' },
        {
          name: 'High-Water Mark',
          desc: 'Smart level logic ensures your progress never drops during sync.'
        }
      ]
    }
  ]

  const shortcutGroups = [
    {
      title: 'Game Control',
      icon: <Gamepad2 size={16} />,
      items: [
        { keys: ['Tab'], action: 'Restart Test' },
        { keys: ['Enter'], action: 'Quick Repeat (Result)' },
        { keys: ['Ctrl', 'Shift', 'Enter'], action: 'Toggle Pause' },
        { keys: ['Ctrl', 'Shift', 'S'], action: 'Standard ↔ Sentences' },
        { keys: ['Ctrl', 'Shift', 'U'], action: 'Time ↔ Words' }
      ]
    },
    {
      title: 'Difficulty',
      icon: <Activity size={16} />,
      items: [
        { keys: ['Ctrl', 'Shift', 'E'], action: 'Easy Mode' },
        { keys: ['Ctrl', 'Shift', 'M'], action: 'Medium Mode' },
        { keys: ['Ctrl', 'Shift', 'A'], action: 'Hard Mode' }
      ]
    },
    {
      title: 'Navigation',
      icon: <Navigation size={16} />,
      items: [
        { keys: ['Ctrl', 'Shift', 'D'], action: 'Toggle Documentation' },
        { keys: ['Ctrl', '\\'], action: 'Profile Menu' },
        { keys: ['Ctrl', 'Shift', 'C'], action: 'Config Menu' },
        { keys: ['Ctrl', 'P'], action: 'Command Search' },
        { keys: ['Ctrl', 'Shift', 'P'], action: 'Action Palette' },
        { keys: ['Esc'], action: 'Home / Close Menu' }
      ]
    },
    {
      title: 'Settings',
      icon: <SettingsIcon size={16} />,
      items: [
        { keys: ['Ctrl', 'T'], action: 'Themes Menu' },
        { keys: ['Ctrl', ','], action: 'App Settings' },
        { keys: ['Ctrl', 'Shift', 'R'], action: 'Reload App' },
        { keys: ['?'], action: 'Shortcut Help' }
      ]
    }
  ]

  return (
    <motion.div
      className="docs-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <header className="docs-header">
        <div className="header-info">
          <Book size={34} className="docs-brand-icon" />
          <div className="title-stack">
            <h1>System Documentation</h1>
            <div className="header-badges">
              <span className="version-badge">v1.2.0</span>
              <span className="status-badge">System Status: Active</span>
            </div>
          </div>
        </div>
      </header>

      <div className="docs-grid">
        <section className="docs-main-section">
          <div className="section-label">
            <Info size={14} />
            <span>Encyclopedia</span>
          </div>
          <div className="features-grid">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                className="doc-category glass-panel"
                whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <div className="category-header">
                  {cat.icon}
                  <h2>{cat.title}</h2>
                </div>
                <div className="category-items">
                  {cat.items.map((item, i) => (
                    <div key={i} className="doc-item">
                      <h3>{item.name}</h3>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <aside className="docs-sidebar-section">
          <div className="section-label">
            <Terminal size={14} />
            <span>Command Center</span>
          </div>

          <div className="shortcuts-grid">
            {shortcutGroups.map((group, idx) => (
              <div key={idx} className="shortcut-group glass-panel">
                <div className="card-header">
                  {group.icon}
                  <span>{group.title}</span>
                </div>
                <div className="shortcuts-list">
                  {group.items.map((s, i) => (
                    <div key={i} className="shortcut-row">
                      <span className="action">{s.action}</span>
                      <div className="keys">
                        {s.keys.map((k, ki) => (
                          <kbd key={ki}>{k}</kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="shortcut-group glass-panel">
            <div className="card-header">
              <Cpu size={18} />
              <span>System Internals</span>
            </div>
            <div className="tech-specs-grid">
              <div className="tech-spec-item">
                <div className="spec-icon-wrapper">
                  <Cpu size={14} />
                </div>
                <div className="spec-info">
                  <span className="spec-name">React 18</span>
                  <span className="spec-desc">Fiber-based UI Core</span>
                </div>
              </div>
              <div className="tech-spec-item">
                <div className="spec-icon-wrapper">
                  <Zap size={14} />
                </div>
                <div className="spec-info">
                  <span className="spec-name">Vite SDK</span>
                  <span className="spec-desc">Next-gen Build Logic</span>
                </div>
              </div>
              <div className="tech-spec-item">
                <div className="spec-icon-wrapper">
                  <Terminal size={14} />
                </div>
                <div className="spec-info">
                  <span className="spec-name">Electron</span>
                  <span className="spec-desc">Native OS Bridge</span>
                </div>
              </div>
              <div className="tech-spec-item">
                <div className="spec-icon-wrapper">
                  <Cloud size={14} />
                </div>
                <div className="spec-info">
                  <span className="spec-name">Supabase</span>
                  <span className="spec-desc">Cloud Persistence</span>
                </div>
              </div>
              <div className="tech-spec-item">
                <div className="spec-icon-wrapper">
                  <Activity size={14} />
                </div>
                <div className="spec-info">
                  <span className="spec-name">WebAudio</span>
                  <span className="spec-desc">DSP Sound Pipeline</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  )
}

export default DocumentationView
