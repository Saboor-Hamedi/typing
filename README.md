# ⚡ TypingZone

**TypingZone** is a next-generation, high-performance typing speed trainer built with **Electron** and **React**. Designed for enthusiasts who demand aesthetics, responsiveness, and deep analytics.

## ✨ Key Features

### 🎨 Immersive Visuals

- **Chameleon Flow**: The UI color dynamically "heats up" from your theme's base color to a blazing hot red as you approach your Personal Best (PB).
- **Zen Mode**: Toggle a distraction-free environment that fades out everything except the active word.
- **Theme System**: Includes curated themes like **Carbon**, **Nord**, **Dracula**, **Serika Blue**, **Matrix**, and **Lavender**.

### 🎮 Gamified Mechanics

- **Ghost Caret**: Race against a visual "ghost" replay of your Personal Best speed in real-time.
- **Hall Effect Audio**: Toggle high-fidelity mechanical switch sounds with an optional "Hall Reverb" for a spacious, satisfying clack.

### 📊 Deep Analytics

- **Telemetry Graphs**: Real-time visual plotting of your WPM throughout the test duration.
- **Kinetic Heatmaps**: Track finger-specific bottlenecks and transition speeds (Coming Soon).
- **Comprehensive Stats**: Tracks WPM, Raw WPM, Accuracy, Consistency, and Error History.

### 💾 Robust Architecture

- **Dual-Layer Persistence**: Settings and User Data are logically separated into `settings.json` and `data.json`.
- **Zero-Flash Load**: State-of-the-art synchronous theme caching ensures your preferred theme loads instantly on startup—no white flashes.

---

## 🛠️ Technology Stack

- **Core**: Electron, React 19, Node.js
- **Styling**: Vanilla CSS (Variables & Glassmorphism), Framer Motion
- **State & Storage**: React Hooks, Electron-Store, LocalStorage sync
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Saboor-Hamedi/TypingZone.git

# Navigate to project
cd TypingZone

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server (Hot Reload enabled)
npm run dev
```

### Building for Production

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Saboor-Hamedi">Saboor Hamedi</a>
</p>
