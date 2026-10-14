import request from 'supertest';
import { app } from '../src/app';
import { llmService } from '../src/services/llm/llmService';
import { RateLimitError, AuthenticationError, LLMError } from '../src/services/llm/errors';

// Mock the llmService so tests do not make external API calls
jest.mock('../src/services/llm/llmService', () => ({
  llmService: {
    generateResponse: jest.fn(),
    extractMemories: jest.fn(),
    getProviderName: jest.fn().mockReturnValue('gemini'),
    getModelName: jest.fn().mockReturnValue('gemini-2.5-flash'),
  },
}));

describe('Backend API - Chat & Health Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return status ok with 200 status code and active provider', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', provider: 'gemini' });
    });
  });

  describe('POST /api/chat', () => {
    it('should return 200 and AI response for a valid single message (preserving message & reply contract)', async () => {
      const mockAiResponse = 'Hello! I am your AI assistant.';
      (llmService.generateResponse as jest.Mock).mockResolvedValueOnce(mockAiResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello, who are you?' });

      expect(response.status).toBe(200);
      // Preserves frontend compatibility (message) and new contract (reply)
      expect(response.body.message).toBe(mockAiResponse);
      expect(response.body.reply).toBe(mockAiResponse);
      expect(llmService.generateResponse).toHaveBeenCalledWith('Hello, who are you?');
    });

    it('should return 200 and AI response for a valid conversation history payload', async () => {
      const mockAiResponse = 'Your name is Alex.';
      (llmService.generateResponse as jest.Mock).mockResolvedValueOnce(mockAiResponse);

      const messages = [
        { role: 'user', content: 'My name is Alex.' },
        { role: 'assistant', content: 'Nice to meet you, Alex.' },
        { role: 'user', content: 'What is my name?' },
      ];

      const response = await request(app)
        .post('/api/chat')
        .send({ messages });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(mockAiResponse);
      expect(response.body.reply).toBe(mockAiResponse);
      expect(llmService.generateResponse).toHaveBeenCalledWith(messages);
    });

    it('should return 400 when message is empty string or whitespace', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message cannot be empty' });
      expect(llmService.generateResponse).not.toHaveBeenCalled();
    });

    it('should return 400 when message exceeds max character limit', async () => {
      const longMessage = 'a'.repeat(10001);
      const response = await request(app)
        .post('/api/chat')
        .send({ message: longMessage });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Message exceeds maximum allowed length');
      expect(llmService.generateResponse).not.toHaveBeenCalled();
    });

    it('should return 400 when request body is empty object', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message cannot be empty' });
      expect(llmService.generateResponse).not.toHaveBeenCalled();
    });

    it('should return 400 when messages array is empty', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ messages: [] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message cannot be empty' });
      expect(llmService.generateResponse).not.toHaveBeenCalled();
    });

    it('should return 400 when messages array contains invalid items', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ messages: [{ role: 'unknown', content: '' }] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message cannot be empty' });
      expect(llmService.generateResponse).not.toHaveBeenCalled();
    });

    it('should return 429 when rate limit is exceeded', async () => {
      (llmService.generateResponse as jest.Mock).mockRejectedValueOnce(
        new RateLimitError('Rate limit or quota exceeded. Please wait a moment and try again.')
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Can you summarize this?' });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Rate limit');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should return 401 when AI authentication fails', async () => {
      (llmService.generateResponse as jest.Mock).mockRejectedValueOnce(
        new AuthenticationError('Invalid API key')
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Test message' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('authentication failed');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should return 503 when AI service is unavailable or network fails', async () => {
      (llmService.generateResponse as jest.Mock).mockRejectedValueOnce(
        new LLMError('Network connection to Gemini API failed', 503)
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('AI service is temporarily unavailable');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should return 500 without leaking stack traces on unexpected error', async () => {
      (llmService.generateResponse as jest.Mock).mockRejectedValueOnce(
        new Error('Unexpected unhandled error with secret https://generativelanguage.googleapis.com?key=AIzaSySecret123')
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Trigger internal error' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unable to generate a response. Please try again.');
      expect(response.body).not.toHaveProperty('stack');
      expect(JSON.stringify(response.body)).not.toContain('AIzaSySecret123');
    });
  });
});
