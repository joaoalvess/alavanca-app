# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alavanca is an Electron desktop app that optimizes resumes for specific job descriptions using AI (Claude CLI or Codex CLI). Users upload a resume (PDF/DOCX), paste a job description, and the app produces an optimized resume with scoring and keyword analysis. Built with Electron Forge + Vite + React + TypeScript.

## Commands

- **Dev:** `npm start` (runs `electron-forge start` with Vite HMR)
- **Lint:** `npm run lint`
- **Package:** `npm run package`
- **Build installers:** `npm run make`

No test framework is configured.

## Architecture

### Process Separation (Electron)

```
src/main/         → Main process (Node.js)
src/preload/      → Preload bridge (contextBridge)
src/renderer/     → Renderer process (React SPA)
```

All renderer↔main communication goes through IPC via `window.electronAPI`, defined in `src/preload/preload.ts`. The `ElectronAPI` interface in `src/renderer/types/index.ts` is the single source of truth for the API surface.

### IPC Modules

Each IPC domain is registered in `src/main/index.ts` on app ready:
- `src/main/ipc/ai.ipc.ts` — AI structuring, optimization, streaming, connection testing
- `src/main/ipc/resume.ipc.ts` — File selection and parsing
- `src/main/ipc/settings.ipc.ts` — Persisted settings (active AI provider)
- `src/main/ipc/history.ipc.ts` — CRUD for resumes/jobs/optimizations, export, job URL scraping

### AI Provider System

`src/main/services/ai/ai-provider.ts` defines the `AIProvider` interface (`chat`, `chatStream`, `testConnection`). Two implementations exist:
- `ClaudeCliProvider` — shells out to the `claude` CLI
- `CodexCliProvider` — shells out to the `codex` CLI

Provider selection is stored in settings and resolved at call time. Streaming optimization results are sent to the renderer via `ai:stream-chunk` IPC events.

### Data Layer

SQLite via `better-sqlite3` stored in Electron's `userData` directory. Schema in `src/main/db/database.ts`. Tables: `settings`, `resumes`, `jobs`, `optimizations`.

### Renderer

- **Routing:** HashRouter with 4 pages — Dashboard, Optimize, History, Settings
- **State:** Zustand store (`src/renderer/stores/app-store.ts`)
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Path alias:** `@/*` maps to `src/renderer/*`

### Types

Shared types are defined in `src/renderer/types/index.ts` and re-exported from `src/main/types.ts`. Key domain types: `StructuredResume`, `JobRequirements`, `OptimizationResult`.

### Native Module

`better-sqlite3` is externalized in `vite.main.config.ts` since it's a native Node addon that can't be bundled by Vite.
