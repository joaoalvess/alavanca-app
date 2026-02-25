import { contextBridge, ipcRenderer } from 'electron';
import type { StreamChunk } from '../renderer/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Resume
  parseResume: (filePath: string) =>
    ipcRenderer.invoke('resume:parse', filePath),
  selectResumeFile: () =>
    ipcRenderer.invoke('resume:select-file'),

  // AI
  structureResume: (text: string) =>
    ipcRenderer.invoke('ai:structure-resume', text),
  extractJobRequirements: (description: string) =>
    ipcRenderer.invoke('ai:extract-job', description),
  optimizeResume: (resume: unknown, job: unknown) =>
    ipcRenderer.invoke('ai:optimize', resume, job),
  testApiConnection: () =>
    ipcRenderer.invoke('ai:test-connection'),
  checkCodexInstalled: () =>
    ipcRenderer.invoke('ai:check-codex-installed'),
  onStreamChunk: (callback: (chunk: StreamChunk) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: StreamChunk) =>
      callback(chunk);
    ipcRenderer.on('ai:stream-chunk', handler);
    return () => {
      ipcRenderer.removeListener('ai:stream-chunk', handler);
    };
  },
  installCodex: () =>
    ipcRenderer.invoke('ai:install-codex'),
  loginCodex: () =>
    ipcRenderer.invoke('ai:login-codex'),
  checkCodexAuth: () =>
    ipcRenderer.invoke('ai:check-codex-auth'),
  onInstallProgress: (callback: (data: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: string) =>
      callback(data);
    ipcRenderer.on('ai:install-progress', handler);
    return () => {
      ipcRenderer.removeListener('ai:install-progress', handler);
    };
  },

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) =>
    ipcRenderer.invoke('settings:save', settings),

  // History
  saveResume: (filename: string, rawText: string, structured: unknown) =>
    ipcRenderer.invoke('history:save-resume', filename, rawText, structured),
  saveJob: (title: string, company: string, description: string, requirements: unknown) =>
    ipcRenderer.invoke('history:save-job', title, company, description, requirements),
  saveOptimization: (resumeId: number, jobId: number, result: unknown) =>
    ipcRenderer.invoke('history:save-optimization', resumeId, jobId, result),
  getOptimizations: () =>
    ipcRenderer.invoke('history:get-optimizations'),
  getOptimization: (id: number) =>
    ipcRenderer.invoke('history:get-optimization', id),
  deleteOptimization: (id: number) =>
    ipcRenderer.invoke('history:delete-optimization', id),

  // Export
  exportPdf: (resume: unknown) =>
    ipcRenderer.invoke('history:export-pdf', resume),
  exportDocx: (resume: unknown) =>
    ipcRenderer.invoke('history:export-docx', resume),

  // Scraping
  scrapeJobUrl: (url: string) =>
    ipcRenderer.invoke('history:scrape-job-url', url),
});
