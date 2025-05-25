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