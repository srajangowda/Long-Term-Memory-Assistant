export class LLMError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'LLM_ERROR') {
    super(message);
    this.name = 'LLMError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthenticationError extends LLMError {
  constructor(message = 'Invalid or missing AI API key. Please check your server configuration.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends LLMError {
  constructor(message = 'Rate limit exceeded. Please wait a moment and try again.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ConfigurationError extends LLMError {
  constructor(message: string) {
    super(message, 500, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class ModelUnavailableError extends LLMError {
  constructor(message = 'The configured AI model is currently unavailable or not found.') {
    super(message, 503, 'MODEL_UNAVAILABLE');
    this.name = 'ModelUnavailableError';
  }
}

