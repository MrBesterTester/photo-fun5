export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  image?: string;
  timestamp: number;
}

export interface Preset {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  description: string;
}

export type LoadingState = 'idle' | 'uploading' | 'processing' | 'error';