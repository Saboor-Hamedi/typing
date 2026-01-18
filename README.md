# TypingZone

A minimalistic, high-performance typing application built with Electron and React.

## Features

- **Fast & Clean Interface**: Minimalistic design focused on typing performance
- **Multiple Test Modes**: Time-based (15s, 30s, 60s, 120s) and word-based (10, 25, 50 words)
- **Real-time Feedback**: Visual feedback for correct/incorrect characters
- **Smooth Caret Animation**: Configurable smooth or instant caret movement
- **Zen Mode**: Distraction-free typing experience
- **Cloud Sync**: Sync scores and progress with Supabase (optional)
- **Local-First**: Works offline, syncs when online
- **Accessibility**: Full keyboard navigation and screen reader support

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts (bridge)
└── renderer/       # React application
    ├── components/ # React components
    ├── contexts/   # React contexts (Theme, Settings, User)
    ├── engine/    # Typing engine (useEngine, TypingEngine)
    ├── hooks/     # Custom React hooks
    ├── utils/     # Utility functions
    └── assets/     # Static assets
```

## Key Components

- **TypingEngine**: Main typing interface component
- **useEngine**: Core typing logic hook
- **AppLayout**: Main application layout orchestrator
- **ConfigBar**: Test configuration controls
- **UserDropdown**: User profile and account management

## Testing

```bash
# Run tests (when implemented)
npm test
```

## Documentation

- Component documentation is available via JSDoc comments
- Run `npm run build` to generate type definitions (if using TypeScript)

## License

MIT
