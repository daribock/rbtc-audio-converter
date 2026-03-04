# RBTC Audio Converter - Electron App

A simple Electron application for audio file conversion with a clean, user-friendly interface.

## Features

- **File Upload**: Select multiple audio files (WAV, MP3, M4A, FLAC, OGG)
- **Input Fields**: Three configurable fields for conversion settings:
  - Subject (Fachkürzel): Subject abbreviation (e.g., BWL, RE, WI)
  - City: Location information (e.g., Berlin, Munich)
  - Teacher (Lehrerkürzel): Teacher abbreviation (e.g., MM, JS)
- **Modern UI**: Clean, responsive interface with custom CSS styling
- **File Management**: View selected files with size information and ability to remove individual files

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **TypeScript**: Type-safe JavaScript development
- **Webpack**: Module bundler for optimized builds
- **Vanilla JavaScript**: Simple, dependency-free frontend (no React or heavy frameworks)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Install dependencies from the monorepo root
npm install

# Or install from the electron package directory
cd packages/electron
npm install
```

### Development

```bash
# Start the Electron app in development mode
npm run start
```

### Building

```bash
# Package the application for distribution
npm run package

# Create distributable installers
npm run make
```

### Linting

```bash
# Run ESLint to check code quality
npm run lint
```

## Project Structure

```
src/
├── index.ts          # Main process (Electron backend)
├── preload.ts        # Preload script (secure IPC bridge)
├── renderer.ts       # Renderer process (UI logic)
├── index.html        # Application HTML structure
└── index.css         # Application styles
```

## Future Development

The current version provides the UI foundation with:
- Audio file selection functionality
- Three input fields for metadata
- File list display with size information

**Planned features:**
- Audio conversion implementation (WAV to MP3, etc.)
- Progress tracking during conversion
- Advanced audio processing options
- Batch conversion support
- Custom output folder selection

## Notes

- Conversion logic is not yet implemented - the "Convert Files" button shows a placeholder message
- The app is designed to be simple and easy to extend with conversion functionality
- No heavy frontend frameworks are used, making the app lightweight and fast
