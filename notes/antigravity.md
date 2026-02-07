# Antigravity Analysis: Project Structure & Architecture

## 1. Project Overview

**TypingZone** is a high-performance, desktop-first typing application built with **Electron** and **React**. It focuses on a premium user experience (UX) with fluid animations (`framer-motion`), kinetic typography, and a robust offline-first architecture synchronized with **Supabase** for cloud features.

The project strictly follows the **DRY (Don't Repeat Yourself)** principle by modularizing core logic into hooks (e.g., `useEngine`) and UI into reusable components.

---

## 2. File Structure & Key Addresses

### **Core Engine (`src/renderer/src/engine`)**

The heart of the application. This module isolates the typing game logic from the UI.

- **`useEngine.js`**
  - **Address**: `src/renderer/src/engine/useEngine.js`
  - **Purpose**: The "Brain" of the typing test. It manages the state machine (idle, typing, finished), input handling, timer logic, WPM calculation, and replay system. It exposes a clean API to the UI.
  - **Key Features**: Circular telemetry buffer, replay recording, and integration with `SoundEngine`.

- **`TypingEngine.jsx`**
  - **Address**: `src/renderer/src/engine/TypingEngine.jsx`
  - **Purpose**: The "View" layer. It renders the active words, letters, and caret based on the state provided by `useEngine`.
  - **Key Features**: Memoized `Letter` and `Word` components for high-performance rendering (60fps+), kinetic animations.

### **Main Process (`src/main`)**

Handles the operating system integration.

- **`index.js`**
  - **Address**: `src/main/index.js`
  - **Purpose**: Entry point for Electron. Manages window creation, deep linking (`typingzone://`), and IPC event handlers.
  - **Key Features**: Electron-Store integration for persistent data, auto-updater, and single-instance locking.

### **Preload Scripts (`src/preload`)**

The bridge between Node.js and the browser environment.

- **`index.js`**
  - **Address**: `src/preload/index.js`
  - **Purpose**: Securely exposes specific APIs to the renderer via `contextBridge`.
  - **Key Features**: Exposes `window.api` for settings, data (pb/history), and system controls (close/minimize).

### **Renderer / Frontend (`src/renderer/src`)**

The React application.

- **`App.jsx`**
  - **Address**: `src/renderer/src/App.jsx`
  - **Purpose**: Root component. Sets up global providers (`Theme`, `Settings`, `User`) and the main layout.

- **`contexts/SettingsContext.jsx`**
  - **Address**: `src/renderer/src/contexts/SettingsContext.jsx`
  - **Purpose**: Single source of truth for user preferences. Synchronizes state between React and `electron-store`.

- **`utils/words.js`**
  - **Address**: `src/renderer/src/utils/words.js`
  - **Purpose**: Word generation logic. Handles different dictionaries (beginner, advanced, technical) and complexity modifiers (punctuation, numbers).

- **`components/Header/ConfigBar.jsx`**
  - **Address**: `src/renderer/src/components/Header/ConfigBar.jsx`
  - **Purpose**: A UI component that allows users to change test modes (Time/Words) and difficulty.
  - **DRY Highlight**: It does not manage state locally; instead, it consumes `useSettings()` from `SettingsContext` to update global preferences, ensuring the engine updates automatically.

---

## 3. DRY Architecture Analysis

The codebase adheres to DRY principles through specific patterns:

1.  **Logic Abstraction**:
    - The typing logic is **not** embedded in the UI component (`TypingEngine.jsx`). Instead, it is extracted into a custom hook `useEngine.js`. This allows the logic to be tested independently or reused if a different UI view were created (e.g., a minimal CLI mode).

2.  **Reusable Components**:
    - Common UI elements like `Tooltip`, `Loader`, and `OfflineBanner` are located in `src/renderer/src/components/Common`.
    - The `Letter` and `Word` components in `TypingEngine` are memoized to prevent redundant renders, sharing the same render logic for every character in the game.

3.  **Centralized Data Management**:
    - `SettingsContext` centralizes all read/write operations for settings. Components do not access `localStorage` or `electron-store` directly; they consume the context values.
    - `window.api` (Preload) provides a unified way to access backend services, preventing scattered IPC calls.

4.  **Utility Libraries**:
    - Complex logic like timer management (`timer.js`) and sound playback (`SoundEngine.js`) are isolated in `src/renderer/src/utils` to be imported wherever needed without duplication.

---

## 4. Deep Dive: `useEngine.js` Workflow

1.  **Initialization**: Accepts `testMode` and `testLimit`. Resets state arrays.
2.  **Word Generation**: Calls `generateWords()` from `utils/words.js` to create the text buffer.
3.  **Input Loop**:
    - Captures input via `handleInput`.
    - Starts `elapsedTimer` on first keypress.
    - Pushes to `keystrokesRef` for replay capability.
    - Updates `telemetryBuffer` for real-time graphs.
4.  **Completion**:
    - Triggers `finishTest`.
    - Calculates WPM/Accuracy.
    - Persists data to `window.api.data` (Local) and `supabase` (Cloud).
