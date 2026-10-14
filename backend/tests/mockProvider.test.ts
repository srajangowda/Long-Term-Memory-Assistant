import { MockLLMProvider } from '../src/services/llm/mockProvider';
import { LLMService } from '../src/services/llm/llmService';
import { ConfigurationError } from '../src/services/llm/errors';

describe('MockLLMProvider & LLMService', () => {
  describe('MockLLMProvider', () => {
    it('should identify as mock provider with custom model name', () => {
      const mockProvider = new MockLLMProvider('mock-v1');
      expect(mockProvider.getProviderName()).toBe('mock');
      expect(mockProvider.getModelName()).toBe('mock-v1');
    });

    it('should generate simulated responses clearly labelled as mock', async () => {
      const mockProvider = new MockLLMProvider('mock-test');
      const response = await mockProvider.generateResponse('What is AI?');

      expect(response).toContain('[Mock AI - mock-test]');
      expect(response).toContain('What is AI?');
    });

    it('should return mock memory extraction structure adhering to schema', async () => {
      const mockProvider = new MockLLMProvider();
      const result = await mockProvider.extractMemories('I am a software engineer');

      expect(result).toHaveProperty('memories');
      expect(Array.isArray(result.memories)).toBe(true);
      expect(result.memories[0]).toHaveProperty('type');
      expect(result.memories[0]).toHaveProperty('fact');
      expect(result.memories[0]).toHaveProperty('confidence');
    });
  });

  describe('LLMService Provider Switching', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should instantiate MockLLMProvider when LLM_PROVIDER=mock', () => {
      process.env.LLM_PROVIDER = 'mock';
      process.env.MOCK_MODEL = 'test-mock-agent';

      const service = new LLMService();
      expect(service.getProviderName()).toBe('mock');
      expect(service.getModelName()).toBe('test-mock-agent');
    });

    it('should throw ConfigurationError for unsupported provider', () => {
      process.env.LLM_PROVIDER = 'unsupported_ai';

      expect(() => {
        new LLMService();
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for future-planned provider without implementation', () => {
      process.env.LLM_PROVIDER = 'groq';

      expect(() => {
        new LLMService();
      }).toThrow('planned for future phases');
    });

    it('should not fallback to mock silently if custom provider throws', async () => {
      const failingProvider = {
        getProviderName: () => 'failing',
        getModelName: () => 'failing-model',
        generateResponse: jest.fn().mockRejectedValue(new Error('Provider failure')),
        extractMemories: jest.fn(),
      };

      const service = new LLMService(failingProvider);

      await expect(service.generateResponse('Hello')).rejects.toThrow('Provider failure');
      expect(service.getProviderName()).toBe('failing');
    });
  });
});

