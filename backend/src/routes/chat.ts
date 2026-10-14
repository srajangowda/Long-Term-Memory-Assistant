import { Router, Request, Response } from 'express';
import { llmService } from '../services/llm/llmService';
import { LLMError } from '../services/llm/errors';
import { ChatRequest, ChatResponse, ErrorResponse, HealthResponse, ChatMessage } from '../types/chat';

export const chatRouter = Router();

// Maximum permitted characters per single message to avoid runaway requests
const MAX_MESSAGE_LENGTH = 10000;

/**
 * GET /api/health
 * Health check endpoint for verifying service availability.
 */
chatRouter.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  try {
    const provider = llmService.getProviderName();
    res.status(200).json({ status: 'ok', provider });
  } catch {
    res.status(200).json({ status: 'ok' });
  }
});

/**
 * POST /api/chat
 * Handles user chat input and forwards conversation to configured LLM provider.
 */
chatRouter.post('/chat', async (req: Request<unknown, unknown, ChatRequest>, res: Response<ChatResponse | ErrorResponse>) => {
  const { message, messages } = req.body;

  // Validate presence of input
  if (!message && (!messages || !Array.isArray(messages))) {
    return res.status(400).json({
      error: 'Message cannot be empty',
    });
  }

  // Handle single message payload
  if (typeof message === 'string') {
    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({
        error: 'Message cannot be empty',
      });
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    try {
      const reply = await llmService.generateResponse(trimmed);
      return res.status(200).json({ message: reply, reply });
    } catch (error: unknown) {
      return handleRouteError(error, res);
    }
  }

  // Handle conversation history payload
  if (Array.isArray(messages)) {
    if (messages.length === 0) {
      return res.status(400).json({
        error: 'Message cannot be empty',
      });
    }

    // Validate structure of messages array
    const isValid = messages.every(
      (m: ChatMessage) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0 &&
        m.content.length <= MAX_MESSAGE_LENGTH
    );

    if (!isValid) {
      return res.status(400).json({
        error: 'Message cannot be empty',
      });
    }

    try {
      const reply = await llmService.generateResponse(messages);
      return res.status(200).json({ message: reply, reply });
    } catch (error: unknown) {
      return handleRouteError(error, res);
    }
  }

  return res.status(400).json({
    error: 'Message cannot be empty',
  });
});

/**
 * Maps internal errors to safe, user-friendly HTTP responses without leaking keys or stack traces.
 */
function handleRouteError(error: unknown, res: Response<ErrorResponse>) {
  const err = error as any;
  const statusCode = err?.statusCode || (err instanceof LLMError ? err.statusCode : 500);

  let safeMessage = 'Unable to generate a response. Please try again.';

  if (statusCode === 429) {
    safeMessage = 'Rate limit or quota exceeded. Please wait a moment and try again.';
  } else if (statusCode === 401 || statusCode === 403) {
    safeMessage = 'AI provider authentication failed. Please verify API key configuration.';
  } else if (statusCode === 503) {
    safeMessage = 'AI service is temporarily unavailable. Please try again shortly.';
  } else if (err?.message && !err?.message.includes('key') && !err?.message.includes('Bearer')) {
    safeMessage = err.message;
  }

  return res.status(statusCode).json({
    error: safeMessage,
  });
}
