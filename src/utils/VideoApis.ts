import { ApiClient, apiClient } from './ApiClient';
import { ApiPhrasesResponse, ApiPhrase } from './types';

// === CLASS-BASED API APPROACH (flexible versions) ===
export class VideoAPI {
  constructor(protected client: ApiClient) {}

  async getVideos(version: 'v1' | 'v2' = 'v1') {
    return this.client.get('videos', {
      apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
    });
  }

  async getTranscriptStatus(videoUrl: string, version: 'v1' | 'v2' = 'v1') {
    return this.client.get('transcript-status', {
      query: { video_url: videoUrl },
      apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
    });
  }

  async getTranscript(videoUrl: string, version: 'v1' | 'v2' = 'v1') {
    return this.client.get('transcript', {
      query: { video_url: videoUrl },
      apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
    });
  }

  async generateTranscript(videoUrl: string, version: 'v1' | 'v2' = 'v1') {
    return this.client.post('generate_transcript', 
      { video_url: videoUrl },
      { apiVersion: version === 'v1' ? '/v1/api' : '/v2/api' }
    );
  }
}

export class AuthenticatedVideoAPI extends VideoAPI {
  constructor(client: ApiClient) {
    super(client);
  }

  async getVideos(version: 'v1' | 'v2' = 'v1') {
    return this.client.get('/user/videos', { 
      authenticated: true,
      apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
    });
  }

  async getTranscriptStatus(videoUrl: string, version: 'v1' | 'v2' = 'v1') {
    return this.client.get('/video/transcript-status', {
      query: { video_url: videoUrl },
      authenticated: true,
      apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
    });
  }

  async getTranscript(videoUrl: string, version: 'v1' | 'v2' = 'v1') {
    return this.client.get('/video/transcript', {
      query: { video_url: videoUrl },
      authenticated: true,
      apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
    });
  }

  async generateTranscript(videoUrl: string, version: 'v1' | 'v2' = 'v1') {
    return this.client.post('/video/generate_transcript', 
      { video_url: videoUrl },
      { 
        authenticated: true,
        apiVersion: version === 'v1' ? '/v1/api' : '/v2/api'
      }
    );
  }

  // Additional authenticated methods (these might be v2 only)
  async getUserVideos() {
    return this.client.get('user/videos', { 
      authenticated: true,
      apiVersion: '/v1/api' // User endpoints might be v2 only
    });
  }

  async getUserPracticeStats() {
    return this.client.get('user/practice-stats', { 
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async updateUserPreferences(preferences: any) {
    return this.client.put('user/preferences', preferences, { 
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async deleteUserVideo(videoId: string) {
    return this.client.delete(`user/videos/${videoId}`, { 
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }
}

// === PHRASE API CLASS ===
export class PhraseAPI {
  constructor(protected client: ApiClient) {}

  async getAllPhrases(): Promise<ApiPhrasesResponse> {
    return this.client.get('phrase/all-phrases', {
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async getPhraseById(phraseId: string): Promise<ApiPhrase> {
    return this.client.get(`phrase/${phraseId}`, {
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async getPhrasesByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<ApiPhrasesResponse> {
    return this.client.get('phrase/by-level', {
      query: { level },
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async getPhrasesByTopic(topic: string): Promise<ApiPhrasesResponse> {
    return this.client.get('phrase/by-topic', {
      query: { topic },
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async getPhrasesFiltered(filters: {
    level?: string;
    topic?: string;
    language_code?: string;
  }): Promise<ApiPhrasesResponse> {
    const query: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) query[key] = value;
    });

    return this.client.get('phrase/filtered', {
      query,
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  // Audio-related methods
  async getAudioFile(phraseId: string, languageCode: string = 'en', voiceType: 'male' | 'female' = 'female') {
    return this.client.get(`phrase/${phraseId}/audio`, {
      query: { language_code: languageCode, voice_type: voiceType },
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  // Translation methods
  async getTranslations(phraseId: string, targetLanguage?: string) {
    const query: Record<string, string> = {};
    if (targetLanguage) query.language_code = targetLanguage;

    return this.client.get(`phrase/${phraseId}/translations`, {
      query,
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }
}

export class AuthenticatedPhraseAPI extends PhraseAPI {
  constructor(client: ApiClient) {
    super(client);
  }

  // Practice-related authenticated methods
  async submitPracticeRecording(phraseId: string, audioBlob: Blob, metadata?: any) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'practice-recording.wav');
    formData.append('phrase_id', phraseId);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.client.request({
      endpoint: 'phrase/practice/recording',
      method: 'POST',
      body: formData,
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async evaluatePronunciation(phraseId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'pronunciation-test.wav');
    formData.append('phrase_id', phraseId);

    return this.client.request({
      endpoint: 'phrase/evaluate/pronunciation',
      method: 'POST',
      body: formData,
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async savePhraseToFavorites(phraseId: string) {
    return this.client.post('user/favorites/phrase', 
      { phrase_id: phraseId },
      { 
        authenticated: true,
        apiVersion: '/v1/api'
      }
    );
  }

  async removePhraseFromFavorites(phraseId: string) {
    return this.client.delete(`user/favorites/phrase/${phraseId}`, { 
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async getUserFavoritePhrases(): Promise<ApiPhrasesResponse> {
    return this.client.get('user/favorites/phrases', { 
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }
}

// === FACTORY FUNCTIONS ===
export const createVideoAPI = (client: ApiClient) => new VideoAPI(client);
export const createAuthenticatedVideoAPI = (client: ApiClient) => new AuthenticatedVideoAPI(client);
export const createPhraseAPI = (client: ApiClient) => new PhraseAPI(client);
export const createAuthenticatedPhraseAPI = (client: ApiClient) => new AuthenticatedPhraseAPI(client);

// === SPECIALIZED API CLASSES (with mixed versions) ===

export class UserAPI {
  constructor(private client: ApiClient) {}

  async getProfile() {
    return this.client.get('user/profile', { 
      authenticated: true,
      apiVersion: '/v2/api' // User APIs might be newer
    });
  }

  async updateProfile(profile: any) {
    return this.client.put('user/profile', profile, { 
      authenticated: true,
      apiVersion: '/v2/api'
    });
  }

  async getPreferences() {
    return this.client.get('user/preferences', { 
      authenticated: true,
      apiVersion: '/v1/api' // Maybe this one is still v1
    });
  }

  async updatePreferences(preferences: any) {
    return this.client.put('user/preferences', preferences, { 
      authenticated: true,
      apiVersion: '/v1/api'
    });
  }

  async getPracticeHistory() {
    return this.client.get('user/practice-history', { 
      authenticated: true,
      apiVersion: '/v2/api' // Newer analytics endpoint
    });
  }

  async getAchievements() {
    return this.client.get('user/achievements', { 
      authenticated: true,
      apiVersion: '/v2/api'
    });
  }
}

export class PracticeAPI {
  constructor(private client: ApiClient) {}

  async getPhrases(level?: string, topic?: string) {
    const query: Record<string, string> = {};
    if (level) query.level = level;
    if (topic) query.topic = topic;
    
    return this.client.get('practice/phrases', {
      query,
      authenticated: true,
      apiVersion: '/v1/api' // Legacy phrases endpoint
    });
  }

  async getPhrasesV2(level?: string, topic?: string, difficulty?: string) {
    const query: Record<string, string> = {};
    if (level) query.level = level;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    
    return this.client.get('practice/phrases', {
      query,
      authenticated: true,
      apiVersion: '/v2/api' // New phrases endpoint with more features
    });
  }

  async recordPracticeSession(sessionData: any) {
    return this.client.post('practice/sessions', sessionData, { 
      authenticated: true,
      apiVersion: '/v2/api' // Analytics endpoints are v2
    });
  }

  async getProgress() {
    return this.client.get('practice/progress', { 
      authenticated: true,
      apiVersion: '/v2/api'
    });
  }

  async submitRecording(recordingData: any) {
    return this.client.post('practice/recordings', recordingData, { 
      authenticated: true,
      apiVersion: '/v1/api' // Recording submission still v1
    });
  }

  async submitRecordingV2(recordingData: any, analysisOptions?: any) {
    return this.client.post('practice/recordings', 
      { ...recordingData, analysisOptions }, 
      { 
        authenticated: true,
        apiVersion: '/v2/api' // Enhanced recording analysis
      }
    );
  }
}

// === FACTORY FUNCTIONS FOR ALL APIS ===

export const createUserAPI = (client: ApiClient) => new UserAPI(client);
export const createPracticeAPI = (client: ApiClient) => new PracticeAPI(client);

// === READY-TO-USE API INSTANCES ===
// Public video API (no authentication required)
export const videoApi = new VideoAPI(apiClient);

// Helper function to create authenticated video API with Auth0 token
export const createAuthenticatedVideoApi = (getAccessToken: () => Promise<string | null>) => {
  const authClient = new ApiClient();
  authClient.setAuthTokenGetter(getAccessToken);
  return new AuthenticatedVideoAPI(authClient);
};

// Helper function to create authenticated phrase API with Auth0 token
export const createAuthenticatedPhraseApi = (getAccessToken: () => Promise<string | null>) => {
  const authClient = new ApiClient();
  authClient.setAuthTokenGetter(getAccessToken);
  return new AuthenticatedPhraseAPI(authClient);
};