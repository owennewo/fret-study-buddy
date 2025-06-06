# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fret Study Buddy is a guitar tab editor built with Vue 3, TypeScript, and PixiJS (canvas rendering). It's a web-based application for creating, editing, and managing guitar tablature scores with features like multi-track support, different voice elements, and data synchronization between local storage and Google Drive.

## Development Commands

```bash
# Development server (HTTPS with self-signed certs)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Generate SSL certificates for local development
npm run generate-cert
```

**Important**: The development server uses HTTPS with self-signed certificates (localhost.crt/localhost.key). This is required for Google Drive API integration in development.

## Architecture Overview

### Core Data Models
- **Score**: Root entity containing metadata, tempo, time signature, and tracks
- **Track**: Container for bars representing a single instrument/voice line
- **Bar**: Container for voice elements within a single measure
- **Voice/VoiceElement**: Individual musical elements (notes, rests, etc.)
- **Note**: Guitar-specific note with string/fret information

### Key Composables Structure
- **useCursor**: Central state management for current selection (score, track, bar, note, etc.)
- **useCanvas**: PixiJS rendering orchestration and reactive canvas management
- **useDataStore**: Unified interface for local/remote data persistence
- **Renderers** (`src/composables/renderers/`): Modular PixiJS rendering system
  - `useTrackRenderer`: Main track layout and rendering
  - `useBarRenderer`: Individual bar rendering
  - `useNoteRenderer`: Guitar-specific note/fret rendering

### Data Storage
The application uses a dual-store pattern:
- **Local Storage**: IndexedDB via `useLocalDataStore`
- **Remote Storage**: Google Drive API via `useGDriveDataStore`
- **Unified Interface**: `useDataStore` merges and syncs between local/remote

### Rendering System
PixiJS-based canvas rendering with reactive Vue integration:
- Canvas automatically redraws on score/selection changes
- Modular renderer system for different musical elements
- Dark/light mode color scheme support
- Responsive canvas sizing

### UI Framework
- **PrimeVue**: Component library with Aura theme
- **Tailwind CSS**: Utility-first styling
- **Dialog System**: Dynamic dialogs for score management, note editing

## Development Notes

### File Naming Conventions
- Vue components: PascalCase (e.g., `CanvasFrame.vue`)
- Composables: camelCase with `use` prefix (e.g., `useCanvas.ts`)
- Models: PascalCase (e.g., `Score.ts`)

### State Management
- Uses Vue 3 Composition API throughout
- Global reactive state managed via composables (not Pinia stores currently)
- Heavy use of `watchEffect` for reactive canvas rendering

### Canvas Rendering
- PixiJS Application instance managed in `useCanvas`
- Prevents multiple simultaneous redraws with `isDrawing` flag
- Hot reload support for development
- Responsive sizing based on container dimensions

### Data Persistence
- Automatic versioning and conflict resolution between local/remote
- SHA-256 hashing for change detection
- Metadata includes client ID, version, and modification timestamps