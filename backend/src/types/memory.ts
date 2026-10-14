export type MemoryType = 'preference' | 'skill' | 'goal' | 'project' | 'fact' | 'other';

export interface MemoryItem {
  type: MemoryType;
  fact: string;
  confidence: number;
}

export interface MemoryExtractionResult {
  memories: MemoryItem[];
}

