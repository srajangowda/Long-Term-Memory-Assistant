import { GoogleGenAI } from '@google/genai';
import { LLMProvider } from './types';
import { ChatMessage } from '../../types/chat';
import { MemoryExtractionResult, MemoryItem, MemoryType } from '../../types/memory';
import {
  LLMError,
  AuthenticationError,
  RateLimitError,
  ConfigurationError,
  ModelUnavailableError,
} from './errors';

interface GeminiProviderOptions {
  apiKey?: string;
  modelName?: string;
  client?: any;
}

export class GeminiProvider implements LLMProvider {
  private client: any;
  private modelName: string;
  private apiKey?: string;

  constructor(options?: GeminiProviderOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
    this.modelName = options?.modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (options?.client) {
      this.client = options.client;
    } else {
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey.startsWith('replace_with')) {
        throw new ConfigurationError(
          'Gemini API key is missing or unconfigured. Please set GEMINI_API_KEY in backend/.env'
        );
      }
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  public getProviderName(): string {
    return 'gemini';
  }

  public getModelName(): string {
    return this.modelName;
  }

  public async generateResponse(input: string | ChatMessage[]): Promise<string> {
    const messages: ChatMessage[] = typeof input === 'string'
      ? [{ role: 'user', content: input }]
      : input;

    if (!messages || messages.length === 0) {
      throw new LLMError('Message input cannot be empty', 400);
    }

    try {
      // Map ChatMessage format to Gemini contents format
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents,
      });

      const responseText = response?.text;

      if (!responseText || responseText.trim().length === 0) {
        throw new LLMError('Empty response received from Gemini model', 500);
      }

      return responseText.trim();
    } catch (error: unknown) {
      throw this.handleError(error, 'generateResponse');
    }
  }

  public async extractMemories(text: string): Promise<MemoryExtractionResult> {
    if (!text || text.trim().length === 0) {
      return { memories: [] };
    }

    const extractionPrompt = `You are an AI assistant designed to extract long-term user memories from conversations.
Extract permanent or long-term facts about the user such as:
- Stable preferences (e.g., favorite programming language, diet, habits) -> type: "preference"
- Technical or professional skills (e.g., Python, React, Cloud) -> type: "skill"
- Education and career goals -> type: "goal"
- Ongoing projects or ventures -> type: "project"
- Other persistent personal facts -> type: "fact"

Ignore transient statements, greetings, temporary moods, and conversational noise.
Assign a confidence score between 0.0 and 1.0 representing certainty.

Conversation text to analyze:
"${text}"

Return JSON matching this exact structure:
{
  "memories": [
    {
      "type": "preference" | "skill" | "goal" | "project" | "fact" | "other",
      "fact": "concise description of the fact",
      "confidence": 0.95
    }
  ]
}`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: extractionPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawJson = response?.text;
      if (!rawJson) {
        return { memories: [] };
      }

      const parsed = JSON.parse(rawJson);
      return this.validateMemoryExtraction(parsed);
    } catch (error: unknown) {
      // Log extraction failure safely and return safe empty result so conversation isn't broken
      console.warn('[GeminiProvider] Memory extraction failed safely:', (error as Error).message);
      return { memories: [] };
    }
  }

  private validateMemoryExtraction(data: any): MemoryExtractionResult {
    if (!data || !Array.isArray(data.memories)) {
      return { memories: [] };
    }

    const validTypes: MemoryType[] = ['preference', 'skill', 'goal', 'project', 'fact', 'other'];

    const validMemories: MemoryItem[] = data.memories
      .filter((item: any) => {
        return (
          item &&
          typeof item.fact === 'string' &&
          item.fact.trim().length > 0 &&
          validTypes.includes(item.type) &&
          typeof item.confidence === 'number' &&
          item.confidence >= 0 &&
          item.confidence <= 1
        );
      })
      .map((item: any) => ({
        type: item.type,
        fact: item.fact.trim(),
        confidence: Math.round(item.confidence * 100) / 100,
      }));

    return { memories: validMemories };
  }

  private handleError(error: unknown, action: string): Error {
    const err = error as any;
    const errorMessage = err?.message || 'Unknown error occurred';
    const status = err?.status || err?.statusCode || 500;

    // Mask API key if accidentally included in error text
    const maskedMessage = this.apiKey
      ? errorMessage.replace(new RegExp(this.apiKey, 'g'), '***REDACTED_KEY***')
      : errorMessage;

    console.error(`[GeminiProvider] Error in ${action}:`, {
      name: err?.name || 'Error',
      message: maskedMessage,
      status,
      model: this.modelName,
    });

    // Check for rate limits / quota exceeded
    if (
      status === 429 ||
      maskedMessage.includes('RESOURCE_EXHAUSTED') ||
      maskedMessage.toLowerCase().includes('rate limit') ||
      maskedMessage.toLowerCase().includes('quota')
    ) {
      return new RateLimitError('Rate limit or quota exceeded. Please wait a moment and try again.');
    }

    // Check for authentication failures
    if (
      status === 401 ||
      status === 403 ||
      maskedMessage.includes('API_KEY_INVALID') ||
      maskedMessage.includes('UNAUTHENTICATED') ||
      maskedMessage.toLowerCase().includes('api key not valid')
    ) {
      return new AuthenticationError('Invalid or unauthorized Gemini API key.');
    }

    // Check for model not found / unavailable
    if (status === 404 || maskedMessage.includes('NOT_FOUND') || maskedMessage.toLowerCase().includes('model not found')) {
      return new ModelUnavailableError(`Configured Gemini model "${this.modelName}" was not found or is unavailable.`);
    }

    // Check for network connectivity failures
    if (
      err?.code === 'ECONNREFUSED' ||
      err?.code === 'ENOTFOUND' ||
      err?.code === 'ETIMEDOUT' ||
      maskedMessage.toLowerCase().includes('fetch failed') ||
      maskedMessage.toLowerCase().includes('network')
    ) {
      return new LLMError('Network connection to Gemini API failed. Please check internet connection.', 503);
    }

    if (err instanceof LLMError) {
      return err;
    }

    return new LLMError('Failed to generate response from Gemini AI provider.', 500);
  }
}

