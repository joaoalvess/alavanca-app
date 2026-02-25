import { spawn, execFile } from 'child_process';

export function isCliInstalled(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('which', [command], { shell: true }, (error) => {
      resolve(!error);
    });
  });
}

export interface SpawnCliOptions {
  command: string;
  args: string[];
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  timeoutMs?: number;
}

export function spawnCli(options: SpawnCliOptions): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { command, args, onStdout, onStderr, timeoutMs = 120_000 } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      onStdout?.(text);
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      onStderr?.(text);
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`CLI process timed out after ${timeoutMs}ms`));
      } else {
        resolve({ exitCode: code ?? 1, stdout, stderr });
      }
    });
  });
}

export function createLineBuffer(onLine: (line: string) => void): (chunk: string) => void {
  let buffer = '';
  return (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        onLine(trimmed);
      }
    }
  };
}

export function parseJsonLine(line: string): unknown | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

/**
 * Extracts and parses a JSON object from an AI response that may contain
 * markdown code fences or surrounding text.
 */
export function extractJson<T = unknown>(raw: string): T {
  // 1. Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // continue to extraction
  }

  // 2. Try parsing individual JSONL lines (find largest valid JSON object)
  const lines = raw.split('\n');
  if (lines.length > 1) {
    let longest = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{')) {
        try {
          JSON.parse(trimmed);
          if (trimmed.length > longest.length) longest = trimmed;
        } catch { /* skip */ }
      }
    }
    if (longest) return JSON.parse(longest);
  }

  // 3. Try extracting from markdown code fence
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  // 3. Try extracting the first top-level JSON object
  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return JSON.parse(raw.slice(braceStart, braceEnd + 1));
  }

  throw new SyntaxError('Could not extract valid JSON from AI response');
}

export async function installCodexCli(
  onProgress?: (data: string) => void
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await spawnCli({
      command: 'npm',
      args: ['install', '-g', '@openai/codex'],
      onStdout: onProgress,
      onStderr: onProgress,
      timeoutMs: 300_000,
    });

    if (result.exitCode === 0) {
      return { success: true, message: 'Codex CLI instalado com sucesso.' };
    }
    return {
      success: false,
      message: result.stderr || `npm install falhou com codigo ${result.exitCode}`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao instalar Codex CLI.' };
  }
}

export async function loginCodexCli(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await spawnCli({
      command: 'codex',
      args: ['login'],
      timeoutMs: 120_000,
    });

    if (result.exitCode === 0) {
      return { success: true, message: 'Login realizado com sucesso.' };
    }
    return {
      success: false,
      message: result.stderr || `codex login falhou com codigo ${result.exitCode}`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao fazer login no Codex.' };
  }
}

export async function checkCodexAuthStatus(): Promise<{ authenticated: boolean }> {
  try {
    const result = await spawnCli({
      command: 'codex',
      args: ['login', 'status'],
      timeoutMs: 15_000,
    });
    return { authenticated: result.exitCode === 0 };
  } catch {
    return { authenticated: false };
  }
}
