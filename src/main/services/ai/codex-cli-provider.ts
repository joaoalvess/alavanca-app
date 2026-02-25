import type { AIProvider } from './ai-provider';
import { spawnCli, createLineBuffer, parseJsonLine } from './cli-utils';

export class CodexCliProvider implements AIProvider {
  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    // Codex doesn't have a -s flag, so prepend system prompt to user message
    const prompt = `${systemPrompt}\n\n${userMessage}`;

    const { exitCode, stdout, stderr } = await spawnCli({
      command: 'codex',
      args: ['exec', '--json', JSON.stringify(prompt), '--skip-git-repo-check'],
      timeoutMs: 300_000,
    });

    if (exitCode !== 0) {
      throw new Error(`Codex CLI failed (exit ${exitCode}): ${stderr}`);
    }

    // Try to parse JSONL output — take the last result line
    const lines = stdout.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const parsed = parseJsonLine(lines[i]);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        // Codex exec --json: response in item.text where item.type === "agent_message"
        const item = obj.item as Record<string, unknown> | undefined;
        if (item && item.type === 'agent_message' && typeof item.text === 'string') {
          return item.text;
        }
        // Legacy/fallback field names
        if (typeof obj.output === 'string') return obj.output;
        if (typeof obj.result === 'string') return obj.result;
        if (typeof obj.text === 'string') return obj.text;
      }
    }

    // Fallback: return raw stdout
    return stdout.trim();
  }

  async chatStream(
    systemPrompt: string,
    userMessage: string,
    onChunk: (text: string) => void
  ): Promise<string> {
    const prompt = `${systemPrompt}\n\n${userMessage}`;
    let fullResponse = '';

    const lineHandler = createLineBuffer((line) => {
      const parsed = parseJsonLine(line);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        // Codex exec --json: item events
        const item = obj.item as Record<string, unknown> | undefined;
        if (item && item.type === 'agent_message' && typeof item.text === 'string') {
          fullResponse += item.text;
          onChunk(item.text);
        }
        // Legacy/fallback
        else if (typeof obj.content === 'string') { fullResponse += obj.content; onChunk(obj.content); }
        else if (typeof obj.text === 'string') { fullResponse += obj.text; onChunk(obj.text); }
        else if (typeof obj.delta === 'string') { fullResponse += obj.delta; onChunk(obj.delta); }
      }
    });

    const { exitCode, stdout, stderr } = await spawnCli({
      command: 'codex',
      args: ['exec', '--json', JSON.stringify(prompt), '--skip-git-repo-check'],
      onStdout: lineHandler,
      timeoutMs: 300_000,
    });

    if (exitCode !== 0 && !fullResponse) {
      throw new Error(`Codex CLI streaming failed (exit ${exitCode}): ${stderr}`);
    }

    // If streaming didn't produce chunks, parse final output
    if (!fullResponse && stdout) {
      const lines = stdout.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const parsed = parseJsonLine(lines[i]);
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>;
          // Codex exec --json: item events
          const item = obj.item as Record<string, unknown> | undefined;
          if (item && item.type === 'agent_message' && typeof item.text === 'string') {
            fullResponse = item.text;
            onChunk(item.text);
            break;
          }
          const text = (obj.output ?? obj.result ?? obj.text) as string | undefined;
          if (text) {
            fullResponse = text;
            onChunk(text);
            break;
          }
        }
      }
      if (!fullResponse) {
        fullResponse = stdout.trim();
        onChunk(fullResponse);
      }
    }

    return fullResponse;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { exitCode } = await spawnCli({
        command: 'codex',
        args: ['exec', '--json', '"respond ok"', '--skip-git-repo-check'],
        timeoutMs: 30_000,
      });
      return exitCode === 0;
    } catch {
      return false;
    }
  }
}
