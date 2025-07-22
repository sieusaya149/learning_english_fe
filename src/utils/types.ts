export interface UserProgress {
  completedVideos: string[];
  completedPhrases: string[];
  savedPhrases: string[];
  practiceSessions: PracticeSession[];
}

export interface PracticeSession {
  id: string;
  date: Date;
  type: 'repeat' | 'phrase' | 'shadow';
  contentId: string;
  durationSeconds: number;
}

export interface Recording {
  id: string;
  sessionId: string;
  contentId: string;
  blob: Blob;
  url: string;
  durationSeconds: number;
  createdAt: Date;
}

// New types for phrase API integration
export interface ApiAudioFile {
  id: string;
  phrase_id: string;
  language_code: string;
  voice_type: 'male' | 'female';
  speed: 'slow' | 'normal' | 'fast';
  quality: 'standard' | 'premium';
  file_url: string;
  file_format: string;
  duration_seconds: number;
  accent?: string;
  created_at: string;
}

export interface ApiTranslation {
  id: string;
  phrase_id: string;
  language_code: string;
  translation_text: string;
  quality_score: number;
  is_verified: boolean;
  translator_notes?: string;
  created_at: string;
}

export interface ApiPhrase {
  id: string;
  text: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  pronunciation?: string;
  romanize?: string;
  phonetic?: string;
  difficulty_score?: number;
  usage_context?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  audio_files: ApiAudioFile[];
  translations: ApiTranslation[];
}

export interface ApiPhrasesResponse {
  [phraseId: string]: ApiPhrase;
}

// Enhanced phrase type for UI
export interface Phrase {
  id: string;
  text: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  pronunciation?: string;
  romanize?: string;
  phonetic?: string;
  audio_files: ApiAudioFile[];
  translations: ApiTranslation[];
  saved?: boolean;
  language: 'en' | 'th'; // Detected from text or specified
}