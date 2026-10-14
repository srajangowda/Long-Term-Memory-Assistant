import { GeminiProvider } from '../src/services/llm/geminiProvider';
import {
  ConfigurationError,
  RateLimitError,
  AuthenticationError,
  ModelUnavailableError,
  LLMError,
} from '../src/services/llm/errors';

describe('GeminiProvider Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration & Initialization', () => {
    it('should throw ConfigurationError if GEMINI_API_KEY is missing', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => {
        new GeminiProvider();
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError if GEMINI_API_KEY has placeholder value', () => {
      expect(() => {
        new GeminiProvider({ apiKey: 'replace_with_your_api_key' });
      }).toThrow(ConfigurationError);
    });

    it('should initialize successfully with a mock client or valid key', () => {
      const mockClient = {
        models: {
          generateContent: jest.fn(),
        },
      };

      const provider = new GeminiProvider({
        apiKey: 'test-key',
        modelName: 'gemini-2.5-flash',
        client: mockClient,
      });

      expect(provider.getProviderName()).toBe('gemini');
      expect(provider.getModelName()).toBe('gemini-2.5-flash');
    });
  });

  describe('generateResponse', () => {
    it('should return trimmed text on successful API call', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValueOnce({
            text: '  Gemini response to question  \n',
          }),
        },
      };

      const provider = new GeminiProvider({
        apiKey: 'test-key',
        modelName: 'gemini-2.5-flash',
        client: mockClient,
      });

      const response = await provider.generateResponse('Hello Gemini');

      expect(response).toBe('Gemini response to question');
      expect(mockClient.models.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello Gemini' }],
          },
        ],
      });
    });

    it('should format multi-turn ChatMessage array properly (mapping assistant to model)', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValueOnce({
            text: 'I remember you like Python.',
          }),
        },
      };

      const provider = new GeminiProvider({
        apiKey: 'test-key',
        client: mockClient,
      });

      const conversation = [
        { role: 'user' as const, content: 'I like Python.' },
        { role: 'assistant' as const, content: 'Noted!' },
        { role: 'user' as const, content: 'What language do I like?' },
      ];

      const response = await provider.generateResponse(conversation);

      expect(response).toBe('I remember you like Python.');
      expect(mockClient.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [
            { role: 'user', parts: [{ text: 'I like Python.' }] },
            { role: 'model', parts: [{ text: 'Noted!' }] },
            { role: 'user', parts: [{ text: 'What language do I like?' }] },
          ],
        })
      );
    });

    it('should throw LLMError when input is empty', async () => {
      const mockClient = { models: { generateContent: jest.fn() } };
      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      await expect(provider.generateResponse([])).rejects.toThrow(LLMError);
      expect(mockClient.models.generateContent).not.toHaveBeenCalled();
    });

    it('should throw LLMError when model returns empty text', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValueOnce({ text: '   ' }),
        },
      };

      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      await expect(provider.generateResponse('Hello')).rejects.toThrow('Empty response received');
    });

    it('should map 429 / RESOURCE_EXHAUSTED errors to RateLimitError', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockRejectedValueOnce({
            status: 429,
            message: 'RESOURCE_EXHAUSTED: quota exceeded',
          }),
        },
      };

      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      await expect(provider.generateResponse('Hello')).rejects.toThrow(RateLimitError);
    });

    it('should map 401 / 403 / API_KEY_INVALID to AuthenticationError', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockRejectedValueOnce({
            status: 401,
            message: 'API_KEY_INVALID: API key not valid',
          }),
        },
      };

      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      await expect(provider.generateResponse('Hello')).rejects.toThrow(AuthenticationError);
    });

    it('should map 404 / NOT_FOUND to ModelUnavailableError', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockRejectedValueOnce({
            status: 404,
            message: 'NOT_FOUND: models/unknown-model is not found',
          }),
        },
      };

      const provider = new GeminiProvider({
        apiKey: 'test-key',
        modelName: 'unknown-model',
        client: mockClient,
      });

      await expect(provider.generateResponse('Hello')).rejects.toThrow(ModelUnavailableError);
    });

    it('should map network connectivity failures to 503 LLMError', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockRejectedValueOnce({
            code: 'ENOTFOUND',
            message: 'getaddrinfo ENOTFOUND generativelanguage.googleapis.com',
          }),
        },
      };

      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      await expect(provider.generateResponse('Hello')).rejects.toThrow(
        expect.objectContaining({
          statusCode: 503,
        })
      );
    });
  });

  describe('extractMemories (Phase 2 readiness)', () => {
    it('should extract structured memories and validate schema', async () => {
      const rawJsonResponse = JSON.stringify({
        memories: [
          {
            type: 'preference',
            fact: 'User prefers Python over Java',
            confidence: 0.95,
          },
          {
            type: 'skill',
            fact: 'Proficient in TypeScript and React',
            confidence: 0.88,
          },
          {
            type: 'invalid_type', // Should be filtered out
            fact: 'Noise',
            confidence: 0.5,
          },
        ],
      });

      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValueOnce({
            text: rawJsonResponse,
          }),
        },
      };

      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      const result = await provider.extractMemories('I write TypeScript and prefer Python.');

      expect(result.memories).toHaveLength(2);
      expect(result.memories[0]).toEqual({
        type: 'preference',
        fact: 'User prefers Python over Java',
        confidence: 0.95,
      });
      expect(result.memories[1]).toEqual({
        type: 'skill',
        fact: 'Proficient in TypeScript and React',
        confidence: 0.88,
      });
    });

    it('should safely return empty memories array if extraction output is invalid JSON', async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValueOnce({
            text: 'I could not format as json',
          }),
        },
      };

      const provider = new GeminiProvider({ apiKey: 'test-key', client: mockClient });

      const result = await provider.extractMemories('Random input');
      expect(result).toEqual({ memories: [] });
    });
  });
});

