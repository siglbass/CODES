export interface Document {
  id: string;
  title: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  imageUrl?: string; // New: Optional URL for generated images
}

export interface HighlightedText {
  documentId: string;
  text: string;
}

// New interface for window.aistudio, to be used consistently across files
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}