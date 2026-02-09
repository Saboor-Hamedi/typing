# TypingZone ⚡

A high-performance, feature-rich typing application built with Electron and React. TypingZone combines a minimalistic design with powerful customization options to help you improve your typing speed and accuracy.

![Version](https://img.shields.io/badge/version-1.0.12-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)

## ✨ Features

### 🎯 Core Typing Experience
- **Multiple Test Modes**: Time-based (15s, 30s, 60s, 120s) and word-based (10, 25, 50, 100 words)
- **Difficulty Levels**: Beginner, Intermediate, and Advanced modes
- **Real-time Feedback**: Instant visual feedback for correct/incorrect characters
- **Live WPM Tracking**: Monitor your typing speed with the BurstGauge display
- **Personal Best Tracking**: Track and beat your personal records

### 🎨 Visual Customization
- **Chameleon Flow**: Dynamic color transitions that respond to your typing
- **Kinetic Feedback**: Visual effects that react to your typing rhythm
- **Caret Styles**: Multiple caret options (bar, block, underline)
- **Fire Caret**: Animated flame effect for your caret
- **Smooth Caret**: Configurable smooth or instant caret movement
- **Error Feedback**: Visual indicators for typing mistakes
- **Zen Mode**: Distraction-free typing experience

### 🔊 Audio Experience
- **Sound Profiles**: Multiple keyboard sound options (ASMR, Thocky, Creamy, Clicky, etc.)
- **Hall Effect**: Enhanced audio feedback simulation
- **Volume Control**: Adjustable sound levels

### 📊 Analytics & Progress
- **Detailed Statistics**: WPM, accuracy, consistency tracking
- **Performance Graphs**: Visual representation of your typing speed over time
- **Test History**: Review past test results and track improvement
- **Telemetry**: In-depth analysis of your typing patterns
- **Leaderboard**: Compare your scores with others
- **Achievements**: Unlock achievements as you improve

### 🎮 Advanced Features
- **Ghost Racing**: Race against your previous performances
- **Custom Content**: Create and practice with your own text
- **Command Palette**: Quick access to all features (Ctrl+K)
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Replay Mode**: Review and replay your typing tests
- **Database Management**: Import/export your typing history

### ☁️ Cloud & Sync
- **Cloud Sync**: Sync scores and progress with Supabase (optional)
- **Local-First**: Works offline, syncs when online
- **Account Management**: Create an account to sync across devices
- **Privacy-Focused**: All data stored locally by default

### 🎯 Content Customization
- **Punctuation Toggle**: Practice with or without punctuation
- **Numbers Mode**: Include numbers in your typing tests
- **Capitalization**: Practice with capital letters
- **Sentence Mode**: Type complete sentences
- **Custom Sentences**: Import your own practice text

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/typingzone.git

# Navigate to the project directory
cd typingzone

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# The app will open automatically in development mode
```

### Building

```bash
# Build for production
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Build without packaging (for testing)
npm run build:unpack
```

### Publishing

```bash
# Build and publish to GitHub releases
npm run dist:publish
```

## 🏗️ Project Structure

```
typingzone/
├── src/
│   ├── main/                 # Electron main process
│   │   └── index.js          # Main process entry point
│   ├── preload/              # Preload scripts (IPC bridge)
│   │   └── index.js          # Preload script
│   └── renderer/             # React application
│       └── src/
│           ├── components/   # React components
│           │   ├── Achievements/    # Achievement system
│           │   ├── Analytics/       # Performance analytics
│           │   ├── CommandPalette/  # Quick command access
│           │   ├── Common/          # Shared UI components
│           │   ├── Dashboard/       # User dashboard
│           │   ├── Database/        # Data management
│           │   ├── Documentation/   # Help & docs
│           │   ├── Effects/         # Visual effects (BurstGauge, etc.)
│           │   ├── Header/          # App header & config
│           │   ├── History/         # Test history
│           │   ├── Layout/          # App layout orchestration
│           │   ├── Leaderboard/     # Global rankings
│           │   ├── Modals/          # Modal dialogs
│           │   ├── Notification/    # Toast notifications
│           │   ├── Results/         # Test results display
│           │   ├── Settings/        # Settings panel
│           │   ├── Sidebar/         # Navigation sidebar
│           │   ├── TitleBar/        # Custom title bar
│           │   └── Views/           # Main view components
│           ├── contexts/     # React contexts
│           │   ├── ThemeContext.jsx      # Theme management
│           │   ├── SettingsContext.jsx   # App settings
│           │   └── UserContext.jsx       # User state
│           ├── engine/       # Typing engine
│           │   ├── useEngine.js          # Core typing logic
│           │   └── TypingEngine.jsx      # Typing UI component
│           ├── hooks/        # Custom React hooks
│           ├── utils/        # Utility functions
│           │   ├── SoundEngine.js        # Audio synthesis
│           │   ├── words.js              # Word generation
│           │   ├── supabase.js           # Cloud sync
│           │   └── helpers.js            # Helper functions
│           └── assets/       # Static assets
├── package.json
└── README.md
```

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+Shift+P` | Open Command Palette |
| `Tab` | Restart Test |
| `Esc` | Reset Test |
| `Ctrl+Shift+Enter` | Pause/Resume Test |
| `Ctrl+Shift+C` | Copy Results |
| `Ctrl+Shift+R` | Replay Test |

## 🔧 Configuration

### Settings

All settings are accessible through the Settings panel or Command Palette:

- **Test Configuration**: Mode, duration/word count, difficulty
- **Visual Effects**: Chameleon, Kinetic, Caret styles
- **Audio Settings**: Sound profiles, volume, hall effect
- **Content Modifiers**: Punctuation, numbers, capitalization
- **Advanced**: Ghost racing, smooth scrolling, error feedback

### Environment Variables

For cloud sync functionality, create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🎨 Code Quality

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint
```

## 🏆 Key Technologies

- **Electron** - Cross-platform desktop framework
- **React 19** - UI library with latest features
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Smooth animations
- **Supabase** - Cloud sync and authentication
- **Better SQLite3** - Local database
- **Electron Store** - Settings persistence
- **Lucide React** - Icon library
- **Vitest** - Testing framework

## 📦 Dependencies

### Core Dependencies
- `@supabase/supabase-js` - Cloud sync
- `better-sqlite3` - Local database
- `electron-store` - Settings storage
- `electron-updater` - Auto-updates
- `framer-motion` - Animations
- `lucide-react` - Icons

### Development Dependencies
- `electron-vite` - Build tooling
- `electron-builder` - App packaging
- `vitest` - Testing
- `prettier` - Code formatting
- `eslint` - Code linting

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron Vite](https://electron-vite.org/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by modern typing applications

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for typing enthusiasts**
