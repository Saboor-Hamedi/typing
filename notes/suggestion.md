# 🚀 TypingZone: Technical Architecture & Suggestions

This document tracks fulfilled features and architectural improvements made to TypingZone.

---

## 🛠️ Implemented Features (Completed)

### ✅ **1. Smooth Caret & Spring Pacing**

- **Status**: Fully Implemented.
- **Tech**: `framer-motion` spring physics with user-toggleable "Instant" vs "Smooth" modes.
- **Impact**: Eliminates digital jitter and provides a fluid, high-end typing feel.

### ✅ **2. Local-First Nickname Persistence**

- **Status**: Fully Implemented.
- **Logic**: Reverts to a custom `localUsername` (stored in `settings.json`) upon sign-out instead of resetting to "Guest".
- **Impact**: Personalized offline experience that seamlessly bridges with cloud profiles.

### ✅ **3. Rapid Keyboard Workflow**

- **Status**: Fully Implemented.
- **Controls**: Results view now closes with <kbd>Enter</kbd> or <kbd>Esc</kbd>.
- **Impact**: Allows experts to maintain a high test-rate without using the mouse.

### ✅ **4. High-Contrast Typing Feedback**

- **Status**: Fully Implemented.
- **Colors**: Explicit Green (`#00ff80`) for correct inputs and Red (`#ff4444`) for errors.
- **Impact**: Immediate visual reinforcement for accuracy.

### ✅ **5. Chameleon Flow (V1)**

- **Status**: Fully Implemented.
- **Dynamic UI**: The main accent color shifts in real-time based on live WPM performance relative to PB.

### ✅ **6. Smart Jump-Back & Space Skip**

- **Status**: Fully Implemented & Robust.
- **Logic**: Precise caret-positioning engine that remembers typos even after skipping.
- **Impact**: Allows immediate correction of past errors with a single backspace, landing the user exactly at the point of failure.

---

## 🔬 Core Logic Breakdown: Smart Jump-Back & Space Skip

The typing engine in `useEngine.js` uses a high-precision state management system to handle word boundaries and corrections. If the system breaks in the future, check these three pillars:

### 1. Robust Word Indexing (`getWordAtPos`)

The engine doesn't just split text by spaces; it maps every absolute character index to a specific `{ index, start, end, word }` object.

- **Wait for Newlines**: It strips `\r\n` during calculation to ensure the "target" string exactly matches the physical text width.
- **Gaps**: Every character from the first letter of a word to the space separator belongs to that word's index.

### 2. The "Space Skip" Mechanic

When a user hits <kbd>Space</kbd> on an incorrect or incomplete word:

- **Validation**: It **must** check if any characters have been typed (`wordTyped.length > 0`). This prevents jumping from a fresh word start.
- **Padding**: The engine uses `.padEnd()` to fill the word with empty spaces in the `userInput` buffer.
- **Correction Preservation**: Crucially, it uses `userInput.slice` (not `targetText`) to rebuild the string. This ensures the "wrong" characters stay red and underlined in the UI history.

### 3. The "Smart Jump-Back" Backspace

This is the most sensitive part of the engine. It triggers when <kbd>Backspace</kbd> is hit while the caret is at a word boundary (moving from Word N back to Word N-1).

- **Discrepancy Search**: It loops through the preceding word to find the **first character** where `typedClean[j] !== prevWord[j]`.
- **Caret Precision**: It uses `setSelectionRange` inside `requestAnimationFrame`.
  - **Position**: It lands the cursor at `firstErrorOffset + 1`. This places the caret **to the right** (in front) of the incorrect character.
  - **Why?**: This follows the natural "Backspace" mental model. The user sees the mistake and hits backspace one more time to delete it.

### 🛠️ Troubleshooting & Maintenance

If the cursor starts landing in the wrong place or skipping behaves weirdly:

1. **Check Dependencies**: Ensure `userInput` is in the `handleInput` dependency array. Without it, the "state" inside the function will be stale, causing jumps to go to the wrong word.
2. **Double-Tick Logic**: Caret positioning requires the DOM to be ready. If the caret is stuck at the end of the text, verify `requestAnimationFrame` is wrapping the `setSelectionRange` call.
3. **Underline Gap**: If the red underline has a gap, check `TypingEngine.css`. It uses an `::after` pseudo-element with `bottom: 2px` to pull the line tight to the baseline, overriding the default `border-bottom`.

---

## 📈 Current Roadmap (Pending)

### 🔊 **Mechanical Audio Engine** (High Priority)

- **Concept**: Pre-loaded high-fidelity mechanical switch samples.
- **Goal**: Zero-latency tactile sound feedback for Blue, Brown, and Red switches.
- **Next Step**: Implement a `SoundContext` to manage audio pools without blocking the main thread.

### 👻 **Multi-Ghost Racing**

- **Concept**: Support for up to 3 simultaneous carets.
- **Goal**: Race against your Personal Best (PB), a 100 WPM "Grandmaster" goal, and the "Average" user.
- **Next Step**: Refine the `useGhostRacing` hook to interpolate multiple telemetry streams.

### 📊 **Keystroke Heatmaps & Finger Analytics**

- **Concept**: Analytical visualizer highlighting delay bottlenecks.
- **Goal**: Identify which specific finger transitions (e.g., 'cr', 'th', 'ow') are slowing you down.
- **Next Step**: Start logging per-key latency in the `telemetryBuffer`.

### 🧘 **Zen Practice Mode**

- **Concept**: A completely distraction-free interface.
- **Goal**: Hides all UI elements (WPM, Time, Sidebar) during the test, revealing results only at the very end.
- **Next Step**: Add a "Zen" toggle to the `ConfigBar`.

### 🏎️ **Live Speedometer Gauge**

- **Concept**: A dashboard-style needle that reacts to typing bursts.
- **Goal**: Provide immediate visual weight to "micro-bursts" of speed.

---

_Created by Antigravity for TypingZone._
