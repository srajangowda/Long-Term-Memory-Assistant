import { LLMProvider } from './types';
import { GeminiProvider } from './geminiProvider';
import { MockLLMProvider } from './mockProvider';
import { ChatMessage } from '../../types/chat';
import { MemoryExtractionResult } from '../../types/memory';
import { ConfigurationError } from './errors';

export class LLMService {
  private provider: LLMProvider;

  constructor(customProvider?: LLMProvider) {
    if (customProvider) {
      this.provider = customProvider;
    } else {
      this.provider = this.createProvider();
    }
  }

  private createProvider(): LLMProvider {
    const providerType = (process.env.LLM_PROVIDER || 'gemini').toLowerCase().trim();

    switch (providerType) {
      case 'mock':
        return new MockLLMProvider(process.env.MOCK_MODEL || 'mock-model');
      case 'gemini':
        return new GeminiProvider();
      case 'groq':
      case 'ollama':
        throw new ConfigurationError(
          `Provider "${providerType}" is planned for future phases and is not yet configured. Use "gemini" or "mock".`
        );
      default:
        throw new ConfigurationError(
          `Unsupported LLM_PROVIDER: "${providerType}". Supported values are "gemini" and "mock".`
        );
    }
  }

  /**
   * Generates a conversational response using the configured provider.
   * Does NOT fallback to mock mode if Gemini fails, preventing silent mask of errors.
   */
  public async generateResponse(input: string | ChatMessage[]): Promise<string> {
    return this.provider.generateResponse(input);
  }

  /**
   * Phase 2 readiness: Extracts structured user memories from conversation text.
   */
  public async extractMemories(text: string): Promise<MemoryExtractionResult> {
    return this.provider.extractMemories(text);
  }

  public getProviderName(): string {
    return this.provider.getProviderName();
  }

  public getModelName(): string {
    return this.provider.getModelName();
  }

  public setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }
}

// Lazy-initialized singleton to avoid failing on import if environment variables aren't set during test loading
let _instance: LLMService | null = null;

export const getLLMService = (): LLMService => {
  if (!_instance) {
    _instance = new LLMService();
  }
  return _instance;
};

// Export singleton proxy that delegates to the lazy instance
export const llmService: LLMService = {
  generateResponse: (input: string | ChatMessage[]) => getLLMService().generateResponse(input),
  extractMemories: (text: string) => getLLMService().extractMemories(text),
  getProviderName: () => getLLMService().getProviderName(),
  getModelName: () => getLLMService().getModelName(),
  setProvider: (provider: LLMProvider) => getLLMService().setProvider(provider),
} as unknown as LLMService;
