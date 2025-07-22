import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth0';
import { createAuthenticatedPhraseApi } from '../utils/VideoApis';
import { ApiPhrasesResponse, Phrase, ApiPhrase } from '../utils/types';

// Helper function to detect language from text
const detectLanguage = (text: string): 'en' | 'th' => {
  // Simple detection: if text contains Thai characters, it's Thai
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text) ? 'th' : 'en';
};

// Convert API phrase to UI phrase
const convertApiPhraseToPhrase = (apiPhrase: ApiPhrase): Phrase => {
  return {
    id: apiPhrase.id,
    text: apiPhrase.text,
    level: apiPhrase.level,
    topic: apiPhrase.topic,
    pronunciation: apiPhrase.pronunciation,
    romanize: apiPhrase.romanize,
    phonetic: apiPhrase.phonetic,
    audio_files: apiPhrase.audio_files,
    translations: apiPhrase.translations,
    language: detectLanguage(apiPhrase.text),
    saved: false // Will be determined by checking user favorites
  };
};

export const usePhraseApi = () => {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [favoritePhrasesIds, setFavoritePhrasesIds] = useState<Set<string>>(new Set());

  // Create authenticated phrase API instance
  const authPhraseApi = useMemo(() => {
    if (isAuthenticated) {
      return createAuthenticatedPhraseApi(getAccessToken);
    }
    return null;
  }, [isAuthenticated, getAccessToken]);

  // Fetch all phrases
  const fetchAllPhrases = async () => {
    if (!authPhraseApi) {
      setError('Authentication required to fetch phrases');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response: ApiPhrasesResponse = await authPhraseApi.getAllPhrases();
      const phrasesArray = Object.values(response).map(convertApiPhraseToPhrase);
      setPhrases(phrasesArray);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch phrases');
      console.error('Error fetching phrases:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user favorite phrases (if authenticated)
  const fetchFavoritePhrases = async () => {
    if (!authPhraseApi) return;
    
    try {
      const response: ApiPhrasesResponse = await authPhraseApi.getUserFavoritePhrases();
      const favoriteIds = new Set(Object.keys(response));
      setFavoritePhrasesIds(favoriteIds);
      
      // Update phrases with saved status
      setPhrases(prev => prev.map(phrase => ({
        ...phrase,
        saved: favoriteIds.has(phrase.id)
      })));
    } catch (err: any) {
      console.error('Error fetching favorite phrases:', err);
    }
  };

  // Save/unsave phrase
  const togglePhraseSave = async (phraseId: string, save: boolean) => {
    if (!authPhraseApi) return;

    try {
      if (save) {
        await authPhraseApi.savePhraseToFavorites(phraseId);
        setFavoritePhrasesIds(prev => new Set([...prev, phraseId]));
      } else {
        await authPhraseApi.removePhraseFromFavorites(phraseId);
        setFavoritePhrasesIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(phraseId);
          return newSet;
        });
      }

      // Update local state
      setPhrases(prev => prev.map(phrase => 
        phrase.id === phraseId ? { ...phrase, saved: save } : phrase
      ));
    } catch (err: any) {
      console.error('Error toggling phrase save:', err);
      setError(err.message || 'Failed to save/unsave phrase');
    }
  };

  // Submit practice recording
  const submitPracticeRecording = async (phraseId: string, audioBlob: Blob, metadata?: any) => {
    if (!authPhraseApi) throw new Error('Authentication required');

    try {
      const response = await authPhraseApi.submitPracticeRecording(phraseId, audioBlob, metadata);
      return response;
    } catch (err: any) {
      console.error('Error submitting practice recording:', err);
      throw err;
    }
  };

  // Evaluate pronunciation
  const evaluatePronunciation = async (phraseId: string, audioBlob: Blob) => {
    if (!authPhraseApi) throw new Error('Authentication required');

    try {
      const response = await authPhraseApi.evaluatePronunciation(phraseId, audioBlob);
      return response;
    } catch (err: any) {
      console.error('Error evaluating pronunciation:', err);
      throw err;
    }
  };

  // Get audio URL for phrase
  const getAudioUrl = (phrase: Phrase, languageCode?: string, voiceType: 'male' | 'female' = 'female') => {
    const targetLanguage = languageCode || phrase.language;
    const audioFile = phrase.audio_files.find(
      file => file.language_code === targetLanguage && file.voice_type === voiceType
    );
    
    if (!audioFile?.file_url) return undefined;
    
    // Transform local file paths to proper URLs
    let audioUrl = audioFile.file_url;
    
    // Check if it's a local Windows path and transform it
    if (audioUrl.match(/^[A-Z]:\\/)) {
      // Extract filename from local path
      const filename = audioUrl.split('\\').pop() || audioUrl.split('/').pop();
      
      // Use environment variable for audio server URL
      const audioServerUrl = import.meta.env.VITE_AUDIO_SERVER_URL || 'http://localhost:8000/api/audio';
      audioUrl = `${audioServerUrl}/phrases/${filename}`;
      
      console.warn('Transformed local path to URL:', audioFile.file_url, '->', audioUrl);
    }
    
    return audioUrl;
  };

  // Get translations for phrase in specific languages
  const getTranslations = (phrase: Phrase, targetLanguages: string[]) => {
    return phrase.translations.filter(
      translation => targetLanguages.includes(translation.language_code)
    );
  };

  // Filter phrases by criteria
  const filterPhrases = (criteria: {
    level?: string;
    topic?: string;
    language?: 'en' | 'th';
    savedOnly?: boolean;
    searchQuery?: string;
  }) => {
    return phrases.filter(phrase => {
      if (criteria.level && phrase.level !== criteria.level) return false;
      if (criteria.topic && phrase.topic !== criteria.topic) return false;
      if (criteria.language && phrase.language !== criteria.language) return false;
      if (criteria.savedOnly && !phrase.saved) return false;
      if (criteria.searchQuery) {
        const query = criteria.searchQuery.toLowerCase();
        const matchesText = phrase.text.toLowerCase().includes(query);
        const matchesTranslation = phrase.translations.some(
          t => t.translation_text.toLowerCase().includes(query)
        );
        if (!matchesText && !matchesTranslation) return false;
      }
      return true;
    });
  };

  // Load phrases when authenticated
  useEffect(() => {
    if (isAuthenticated && authPhraseApi) {
      fetchAllPhrases();
    }
  }, [isAuthenticated, authPhraseApi]);

  // Load favorites when phrases are loaded
  useEffect(() => {
    if (isAuthenticated && authPhraseApi && phrases.length > 0) {
      fetchFavoritePhrases();
    }
  }, [isAuthenticated, authPhraseApi, phrases.length]);

  return {
    // Data
    phrases,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    fetchAllPhrases,
    togglePhraseSave,
    submitPracticeRecording,
    evaluatePronunciation,
    
    // Utilities
    getAudioUrl,
    getTranslations,
    filterPhrases,
    
    // API instances (for advanced usage)
    authPhraseApi
  };
}; 