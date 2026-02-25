import type { AIProvider } from './ai-provider';
import { spawnCli, createLineBuffer, parseJsonLine } from './cli-utils';

export class ClaudeCliProvider implements AIProvider {
  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const prompt = `${systemPrompt}\n\n${userMessage}`;

    const { exitCode, stdout, stderr } = await spawnCli({
      command: 'claude',
      args: ['-p', JSON.stringify(prompt), '--output-format', 'json'],
      timeoutMs: 300_000,
    });

    if (exitCode !== 0) {
      throw new Error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
    }

    const parsed = parseJsonLine(stdout.trim());
    if (parsed && typeof parsed === 'object' && 'result' in (parsed as Record<string, unknown>)) {
      return (parsed as { result: string }).result;
    }

    // If not wrapped in JSON envelope, return raw stdout
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
        // stream-json format: {"type":"content_block_delta","delta":{"text":"..."}}
        if (obj.type === 'content_block_delta') {
          const delta = obj.delta as { text?: string } | undefined;
          if (delta?.text) {
            fullResponse += delta.text;
            onChunk(delta.text);
          }
        } else if (obj.type === 'result') {
          // Final result message
          if (typeof obj.result === 'string') {
            // If we haven't accumulated anything from deltas, use the result
            if (!fullResponse) {
              fullResponse = obj.result;
              onChunk(obj.result);
            }
          }
        }
      }
    });

    const { exitCode, stderr } = await spawnCli({
      command: 'claude',
      args: ['-p', JSON.stringify(prompt), '--output-format', 'stream-json'],
      onStdout: lineHandler,
      timeoutMs: 300_000,
    });

    if (exitCode !== 0 && !fullResponse) {
      throw new Error(`Claude CLI streaming failed (exit ${exitCode}): ${stderr}`);
    }

    return fullResponse;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { exitCode } = await spawnCli({
        command: 'claude',
        args: ['-p', '"respond ok"', '--output-format', 'json'],
        timeoutMs: 30_000,
      });
      return exitCode === 0;
    } catch {
      return false;
    }
  }
}
