export interface NutritionalData {
  foodName: string;
  calories: number;
  gi: number; // Glycemic Index
  gl: number; // Glycemic Load
  carbs: number; // Total Carbs in g
  protein: number; // Protein in g
  summary: string; // A short spoken-style summary
}

export enum MessageType {
  USER_TEXT = 'USER_TEXT',
  USER_IMAGE = 'USER_IMAGE',
  AI_TEXT = 'AI_TEXT',
  AI_CARD = 'AI_CARD', // For displaying the nutritional data widget
}

export interface Message {
  id: string;
  type: MessageType;
  content?: string;
  data?: NutritionalData;
  imageData?: string; // base64
  timestamp: number;
  isSaved?: boolean; // For saving recipes/text to history
}

export enum AppState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  ANALYZING = 'ANALYZING',
  SPEAKING = 'SPEAKING',
}