# TypingZone Architecture & Documentation

## 1. Introduction

TypingZone is a modern, performance-oriented typing application designed for enthusiasts and developers. It combines the aesthetic polish of a web app with the power of a native desktop application. The project is built on **Electron** + **React** (via Vite) and emphasizes a **DRY (Don't Repeat Yourself)** architecture.

## 2. Technical Stack

- **Runtime**: Electron (Windows/Linux/macOS)
- **Frontend Framework**: React 19
- **Build Tool**: Electron-Vite
- **Styling**: Plain CSS (Variables) + Tailwind CSS (Utility classes) + Framer Motion (Animations)
- **State Management**: React Context + Hooks
- **Data Persistence**: Electron-Store (Local JSON) + Supabase (Cloud SQL)
- **Icons**: Lucide React

## 3. Installation & Setup

1. **Prerequisites**: Node.js (v18+ recommended)
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Development**:
   ```bash
   npm run dev
   ```
   This launches the Electron app with Hot Module Replacement (HMR).
4. **Build**:
   ```bash
   npm run build:win  # or :mac, :linux
   ```

## 4. Architecture Overview

Key principles driving the codebase:

### 4.1 Separation of Concerns

The application is split into three distinct layers:
1. **Main Process (`src/main`)**: Handles the OS lifecycle, file system access, and window management. It acts as the "Server" side of the desktop app.
2. **Renderer Process (`src/renderer`)**: The UI layer. It contains all React code and visual logic.
3. **Bridge (`src/preload`)**: A secure channel that exposes specific capabilities (like "save settings" or "minimize window") to the Renderer without giving full Node.js access.

### 4.2 The "Engine" Pattern

To avoid bloating UI components with logic, the core typing mechanics are abstracted into `src/renderer/src/engine`.

- **`useEngine.js`**: A custom React Hook that acts as the controller. It owns the state (words, input, timer) and logic (calculation, validation).
  - *Why it's DRY*: Any component can become a typing interface by consuming this hook. It doesn't care *how* it's rendered, only *what* the state is.
- **`TypingEngine.jsx`**: A pure presentational component that consumes `useEngine`. It focuses solely on efficiently rendering the DOM nodes for the game.

### 4.3 Context-Based State

Global application state is managed via React Context providers in `src/renderer/src/contexts`:
- **`SettingsContext`**: Loads, validates, and saves user themes, difficulty modes, and preferences. It handles the synchronization between `localStorage` (fast read) and `electron-store` (permanent disk).
- **`ThemeContext`**: Manages CSS variables for theming (Chameleon mode, etc.).
- **`UserContext`**: Handles Supabase authentication and user profiles.

## 5. Component Hierarchy

```text
App (Root)
├── ErrorBoundary (Crash protection)
├── ThemeProvider (Visuals)
├── SettingsProvider (Logic config)
└── UserProvider (Auth)
    └── AppLayout (Main Grid)
        ├── TitleBar (Draggable window controls)
        ├── NavBar (Navigation)
        ├── MainContent
        │   ├── TypingEngine (The Game)
        │   ├── ResultsView (Stats)
        │   └── Dashboard/Settings (Views)
        └── Footer / Notifications
```

## 6. Key Modules & Files

### **Word Generation (`src/renderer/src/utils/words.js`)**

Handles the content generation. It supports:
- **Complexity Modifiers**: Can inject punctuation, numbers, or capitalization into any word set.
- **Dictionaries**: Segregated by difficulty (Beginner/Intermediate/Advanced).
- **Mode Logic**: Handles `generateWords` vs `generateBaseWords`, distinguishing between "Sentence Mode" (coherent quotes) and "Word Mode" (random tokens).

### **Sound Engine (`src/renderer/src/utils/SoundEngine.js`)**

A singleton class that manages audio playback.
- **Profiles**: Specific key-switch sounds (Mechanical, Cherry Blue, Typewriter).
- **Performance**: Uses distinct `Audio` instances to allow rapid-fire overlapping sounds without cutting off previous keystrokes (Low latency).

### **Persistence Layer**

Data is saved in two places:
1. **Local**: `electron-store` saves `pb` (Personal Best) and `history`. This ensures the app works perfectly offline.
2. **Cloud**: `Supabase` is updated asynchronously after every test. If the user is offline, the cloud sync fails silently (non-blocking) while local data remains accurate.

## 7. DRY Compliance Report

The codebase demonstrates strong adherence to DRY:

- **IPC Bridge**: The `api` object in `preload/index.js` abstracts `ipcRenderer.invoke` calls. Instead of writing `ipcRenderer.invoke('settings-get', 'theme')` in every component, developers use `window.api.settings.get('theme')`.
- **Shared CSS**: `index.css` and `main.css` define global variables for colors (`--main-color`, `--bg-color`). Components use these variables rather than hardcoding hex values, making theming instantaneous.
- **Utilities**: Time formatting and WPM calculations are centralized in `src/renderer/src/utils/timer.js` and `helpers.js`.

## 8. Development Guidelines

- **Do not modify `useEngine.js` directly for UI changes.** If you need to change how the caret looks, edit `TypingEngine.jsx` or CSS. Only edit `useEngine.js` if the *rules of the game* change.
- **Always use `window.api` for file/settings operations.** Never try to import `fs` or `electron` directly in React components.
- **Keep Components Small.** If a component exceeds 200 lines, check if sub-components (like `Letter` inside `TypingEngine`) can be extracted.
