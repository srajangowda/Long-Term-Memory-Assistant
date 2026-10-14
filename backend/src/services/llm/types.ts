import { ChatMessage } from '../../types/chat';
import { MemoryExtractionResult } from '../../types/memory';

export interface LLMProvider {
  getProviderName(): string;
  getModelName(): string;
  generateResponse(input: string | ChatMessage[]): Promise<string>;
  extractMemories(text: string): Promise<MemoryExtractionResult>;
}

