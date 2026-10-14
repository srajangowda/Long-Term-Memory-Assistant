export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  message?: string;
  messages?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  reply?: string;
}

export interface ErrorResponse {
  error: string;
}

export interface HealthResponse {
  status: 'ok';
  provider?: string;
}
