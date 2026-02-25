<div align="center">

# 🚀 Alavanca

**Otimize seu currículo para cada vaga com inteligência artificial**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

## 💡 Sobre

Alavanca é um app desktop que usa IA para otimizar currículos para vagas específicas. Faça upload do seu currículo (PDF/DOCX), cole a descrição da vaga e receba um currículo otimizado com scoring e análise de keywords.

## ✨ Features

- 📄 **Upload de PDF/DOCX** — importe seu currículo em qualquer formato
- 🔗 **Scraping de vagas por URL** — extraia descrições de vagas automaticamente
- 🤖 **Pipeline de 3 etapas com IA** — estruturação → análise → otimização
- 🎯 **Scoring e análise de keywords** — saiba exatamente onde seu currículo pode melhorar
- 📥 **Exportação PDF/DOCX** — baixe o currículo otimizado pronto para enviar
- 🕓 **Histórico de otimizações** — acompanhe todas as versões geradas
- ⚡ **Suporte a Claude CLI e Codex CLI** — escolha seu provedor de IA preferido

## 🛠️ Tech Stack

| Tecnologia | Uso |
|---|---|
| [Electron](https://www.electronjs.org/) | App desktop multiplataforma |
| [React](https://react.dev/) | Interface do usuário |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização |
| [SQLite](https://github.com/WiseLibs/better-sqlite3) | Banco de dados local |
| [Vite](https://vitejs.dev/) | Build e HMR |
| [Zustand](https://zustand.docs.pmnd.rs/) | Gerenciamento de estado |

## 🏗️ Arquitetura

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

A comunicação entre Renderer e Main acontece via IPC através do `window.electronAPI`, definido no preload bridge.

## 🚀 Getting Started

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/)
- [Claude CLI](https://docs.anthropic.com/en/docs/claude-cli) ou [Codex CLI](https://github.com/openai/codex) instalado

### Instalação

```bash
git clone https://github.com/joaoalvess/alavanca.git
cd alavanca
npm install
npm start
```

## 📋 Scripts

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o app em modo desenvolvimento com HMR |
| `npm run lint` | Executa o ESLint |
| `npm run package` | Empacota o app para distribuição |
| `npm run make` | Gera instaladores nativos |

## 📁 Estrutura do Projeto

```
src/
├── main/                  # Processo principal (Node.js)
│   ├── db/                # Schema e acesso ao SQLite
│   ├── ipc/               # Handlers IPC (ai, resume, settings, history)
│   └── services/          # Serviços (AI providers, parsing, export)
├── preload/               # Bridge entre Main e Renderer
└── renderer/              # Interface React
    ├── components/        # Componentes reutilizáveis
    ├── pages/             # Dashboard, Optimize, History, Settings
    ├── stores/            # Zustand store
    └── types/             # Tipos TypeScript compartilhados
```

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
