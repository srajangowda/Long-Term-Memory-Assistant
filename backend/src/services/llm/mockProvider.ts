import { LLMProvider } from './types';
import { ChatMessage } from '../../types/chat';
import { MemoryExtractionResult } from '../../types/memory';

export class MockLLMProvider implements LLMProvider {
  private modelName: string;

  constructor(modelName: string = 'mock-model') {
    this.modelName = modelName;
  }

  public getProviderName(): string {
    return 'mock';
  }

  public getModelName(): string {
    return this.modelName;
  }

  public async generateResponse(input: string | ChatMessage[]): Promise<string> {
    const lastUserPrompt = typeof input === 'string'
      ? input
      : [...input].reverse().find((m) => m.role === 'user')?.content || 'Hello';

    return `[Mock AI - ${this.modelName}]: This is a simulated response for prompt: "${lastUserPrompt.slice(0, 80)}"`;
  }

  public async extractMemories(text: string): Promise<MemoryExtractionResult> {
    // Return mock structured memory output for testing
    return {
      memories: [
        {
          type: 'fact',
          fact: `Mock extracted fact from: "${text.slice(0, 50)}"`,
          confidence: 0.9,
        },
      ],
    };
  }
}

