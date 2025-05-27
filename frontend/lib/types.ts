export interface WordScore {
  text: string;
  value: number;
}

export interface BlockContentResponse {
  layer: number;
  block: number;
  content: string;
  error?: string;
}

export interface BlockData {
  layer: number;
  block: number;
  content: string;
}

export interface BlockId {
  layer: number;
  block: number;
}
