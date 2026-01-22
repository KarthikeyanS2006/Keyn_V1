export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  WIDE = '4:3',
  TALL = '3:4'
}

export type ImageStyle = 
  | 'None' 
  | 'Cinematic' 
  | 'Photorealistic' 
  | 'Anime' 
  | 'Fantasy' 
  | '3D Render' 
  | 'Cyberpunk' 
  | 'Abstract'
  | 'Oil Painting'
  | 'Minimalist';

export interface GenerationResult {
  imageUrl: string | null;
  originalUrl: string | null;
  textResponse: string | null;
  warning?: string;
}

export interface ImageConfig {
  aspectRatio: AspectRatio;
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt: string | null;
  aspectRatio: AspectRatio;
  style: ImageStyle;
  timestamp: number;
}