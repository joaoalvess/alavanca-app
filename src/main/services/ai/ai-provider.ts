export interface AIProvider {
  chat(systemPrompt: string, userMessage: string): Promise<string>;
  chatStream(
    systemPrompt: string,
    userMessage: string,
    onChunk: (text: string) => void
  ): Promise<string>;
  testConnection(): Promise<boolean>;
}
