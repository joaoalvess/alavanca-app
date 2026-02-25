import { ipcMain, BrowserWindow } from 'electron';
import { CodexCliProvider } from '../services/ai/codex-cli-provider';
import { isCliInstalled, installCodexCli, loginCodexCli, checkCodexAuthStatus, extractJson } from '../services/ai/cli-utils';
import {
  STRUCTURE_RESUME_PROMPT,
  EXTRACT_JOB_PROMPT,
  OPTIMIZE_RESUME_PROMPT,
} from '../services/ai/prompts';
import type { StructuredResume, JobRequirements, OptimizationResult } from '../../renderer/types';

export function registerAiIpc(): void {
  ipcMain.handle('ai:check-codex-installed', async (): Promise<{ installed: boolean }> => {
    const installed = await isCliInstalled('codex');
    return { installed };
  });

  ipcMain.handle('ai:structure-resume', async (_event, rawText: string): Promise<StructuredResume> => {
    const provider = new CodexCliProvider();
    const response = await provider.chat(STRUCTURE_RESUME_PROMPT, rawText);
    const structured: StructuredResume = extractJson<StructuredResume>(response);
    return structured;
  });

  ipcMain.handle('ai:extract-job', async (_event, description: string): Promise<JobRequirements> => {
    const provider = new CodexCliProvider();
    const response = await provider.chat(EXTRACT_JOB_PROMPT, description);
    const requirements: JobRequirements = extractJson<JobRequirements>(response);
    return requirements;
  });

  ipcMain.handle(
    'ai:optimize',
    async (_event, resume: StructuredResume, job: JobRequirements): Promise<OptimizationResult> => {
      const provider = new CodexCliProvider();
      const userMessage = JSON.stringify({ resume, jobRequirements: job });

      const mainWindow = BrowserWindow.getAllWindows()[0];

      const fullResponse = await provider.chatStream(
        OPTIMIZE_RESUME_PROMPT,
        userMessage,
        (chunk: string) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ai:stream-chunk', {
              type: 'content',
              content: chunk,
            });
          }
        }
      );

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ai:stream-chunk', {
          type: 'done',
        });
      }

      const result: OptimizationResult = extractJson<OptimizationResult>(fullResponse);
      return result;
    }
  );

  ipcMain.handle('ai:test-connection', async (): Promise<boolean> => {
    try {
      const provider = new CodexCliProvider();
      return await provider.testConnection();
    } catch {
      return false;
    }
  });

  ipcMain.handle('ai:install-codex', async (): Promise<{ success: boolean; message: string }> => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const result = await installCodexCli((data: string) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ai:install-progress', data);
      }
    });
    return result;
  });

  ipcMain.handle('ai:login-codex', async (): Promise<{ success: boolean; message: string }> => {
    return loginCodexCli();
  });

  ipcMain.handle('ai:check-codex-auth', async (): Promise<{ authenticated: boolean }> => {
    return checkCodexAuthStatus();
  });
}
