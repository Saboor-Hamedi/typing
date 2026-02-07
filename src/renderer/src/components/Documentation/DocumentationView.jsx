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
  Terminal
} from 'lucide-react'
import './DocumentationView.css'

const DocumentationView = () => {
  const categories = [
    {
      title: 'Core Mechanics',
      icon: <Keyboard className="cat-icon" />,
      items: [
        {
          name: 'Time Mode',
          desc: "Test your speed over 15, 30, or 60 seconds with 'Soft Finish' logic."
        },
        { name: 'Words Mode', desc: 'Complete 10, 25, or 50 words at your own pace.' },
        {
          name: 'Sentence Mode',
          desc: 'Type real-world quotes and coherent sentences for a natural feel.'
        }
      ]
    },
    {
      title: 'Advanced Features',
      icon: <Zap className="cat-icon" />,
      items: [
        {
          name: 'Chameleon Flow',
          desc: 'The UI color shifts dynamically based on your typing speed (Heat).'
        },
        { name: 'Ghost Racing', desc: 'Compete against your Personal Best in real-time.' },
        {
          name: 'Sound Engine',
          desc: 'Custom-synthesized mechanical key sounds (Thocky, Creamy, ASMR).'
        }
      ]
    },
    {
      title: 'Progression System',
      icon: <Trophy className="cat-icon" />,
      items: [
        {
          name: 'Leveling',
          desc: 'Earn XP for every test. Higher accuracy and WPM yield more XP.'
        },
        { name: 'Wardrobe', desc: 'Unlock exclusive avatars as you climb through the Tiers.' },
        { name: 'Rank Tiers', desc: 'Progress from Initiate to Ascended based on your level.' }
      ]
    },
    {
      title: 'Sync & Cloud',
      icon: <Cloud className="cat-icon" />,
      items: [
        { name: 'Supabase Integration', desc: 'Sync your scores, PB, and unlocks across devices.' },
        {
          name: 'High-Water Mark',
          desc: 'Smart logic ensures your level never drops during sync delays.'
        }
      ]
    }
  ]

  const shortcuts = [
    { keys: ['Tab'], action: 'Restart Test' },
    { keys: ['Ctrl', 'P'], action: 'Command Palette' },
    { keys: ['Ctrl', 'T'], action: 'Themes Menu' },
    { keys: ['Ctrl', ','], action: 'Settings' },
    { keys: ['Esc'], action: 'Escape Menus / Home' },
    { keys: ['?'], action: 'View All Shortcuts' }
  ]

  return (
    <motion.div
      className="docs-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="docs-header">
        <div className="header-info">
          <Book size={32} className="docs-brand-icon" />
          <div>
            <h1>System Documentation</h1>
            <p>Master the typing experience with TypingZone v1.0.3</p>
          </div>
        </div>
      </header>

      <div className="docs-grid">
        <section className="docs-main-section">
          {categories.map((cat, idx) => (
            <div key={idx} className="doc-category glass-panel">
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
            </div>
          ))}
        </section>

        <aside className="docs-sidebar-section">
          <div className="shortcuts-card glass-panel">
            <div className="card-header">
              <Terminal size={18} />
              <span>Quick Shortcuts</span>
            </div>
            <div className="shortcuts-list">
              {shortcuts.map((s, i) => (
                <div key={i} className="shortcut-row">
                  <span className="action">{s.action}</span>
                  <div className="keys">
                    {s.keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tech-stack-card glass-panel">
            <div className="card-header">
              <Cpu size={18} />
              <span>Tech Stack</span>
            </div>
            <ul className="tech-list">
              <li>React + Vite</li>
              <li>Electron (Desktop Core)</li>
              <li>Supabase (Cloud & Auth)</li>
              <li>Framer Motion (VFX)</li>
              <li>Web Audio API (Sound)</li>
            </ul>
          </div>
        </aside>
      </div>
    </motion.div>
  )
}

export default DocumentationView
