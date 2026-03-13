<div align="center">

# Alavanca

**Optimize your resume for every job posting with AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

## About

Alavanca is a desktop app that uses AI to tailor your resume for specific job postings. Upload your resume (PDF/DOCX), paste the job description, and get back an optimized resume with scoring and keyword analysis.

## Features

- **PDF/DOCX Upload** — import your resume in any format
- **Job URL Scraping** — automatically extract job descriptions from URLs
- **3-Step AI Pipeline** — structuring → analysis → optimization
- **Scoring & Keyword Analysis** — know exactly where your resume can improve
- **PDF/DOCX Export** — download the optimized resume ready to submit
- **Optimization History** — track all generated versions
- **Claude CLI & Codex CLI Support** — choose your preferred AI provider

## Tech Stack

| Technology | Usage |
|---|---|
| [Electron](https://www.electronjs.org/) | Cross-platform desktop app |
| [React](https://react.dev/) | User interface |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [SQLite](https://github.com/WiseLibs/better-sqlite3) | Local database |
| [Vite](https://vitejs.dev/) | Build & HMR |
| [Zustand](https://zustand.docs.pmnd.rs/) | State management |

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Electron                    │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   Main   │──│ Preload  │──│ Renderer  │  │
│  │ (Node.js)│  │ (Bridge) │  │ (React)   │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│       │                            │         │
│  ┌──────────┐              ┌───────────┐     │
│  │  SQLite  │              │  Zustand   │    │
│  │ Services │              │   Store    │    │
│  │ AI (CLI) │              │  Tailwind  │    │
│  └──────────┘              └───────────┘     │
└─────────────────────────────────────────────┘
```

Communication between Renderer and Main happens via IPC through `window.electronAPI`, defined in the preload bridge.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/)
- [Claude CLI](https://docs.anthropic.com/en/docs/claude-cli) or [Codex CLI](https://github.com/openai/codex) installed

### Installation

```bash
git clone https://github.com/joaoalvess/alavanca.git
cd alavanca
npm install
npm start
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the app in dev mode with HMR |
| `npm run lint` | Run ESLint |
| `npm run package` | Package the app for distribution |
| `npm run make` | Generate native installers |

## Project Structure

```
src/
├── main/                  # Main process (Node.js)
│   ├── db/                # SQLite schema & access
│   ├── ipc/               # IPC handlers (ai, resume, settings, history)
│   └── services/          # Services (AI providers, parsing, export)
├── preload/               # Bridge between Main and Renderer
└── renderer/              # React UI
    ├── components/        # Reusable components
    ├── pages/             # Dashboard, Optimize, History, Settings
    ├── stores/            # Zustand store
    └── types/             # Shared TypeScript types
```

## License

This project is licensed under the [MIT License](LICENSE).
