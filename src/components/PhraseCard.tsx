import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Play, Volume2, Mic, CheckCircle, Headphones, Globe, Maximize2 } from 'lucide-react';
import clsx from 'clsx';
import AudioRecorder from './AudioRecorder';
import EnhancedAudioPlayer from './EnhancedAudioPlayer';
import { Phrase, ApiTranslation } from '../utils/types';

interface PhraseCardProps {
  phrase: Phrase;
  onSave: (phraseId: string, saved: boolean) => void;
  onRecordingComplete?: (phraseId: string, blob: Blob) => void;
  onEvaluate?: (phraseId: string, blob: Blob) => Promise<any>;
  getAudioUrl?: (phrase: Phrase, languageCode?: string, voiceType?: 'male' | 'female') => string | undefined;
  getTranslations?: (phrase: Phrase, targetLanguages: string[]) => ApiTranslation[];
  showZoomButton?: boolean;
  onZoom?: () => void;
  compact?: boolean;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ 
  phrase, 
  onSave,
  onRecordingComplete,
  onEvaluate,
  getAudioUrl,
  getTranslations,
  showZoomButton = false,
  onZoom,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  const handleToggleSave = () => {
    onSave(phrase.id, !phrase.saved);
  };
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setEvaluationResult(null);
  };
  
  const handleRecordingComplete = (blob: Blob) => {
    setIsRecording(false);
    if (onRecordingComplete) {
      onRecordingComplete(phrase.id, blob);
    }
  };

  const handleEvaluate = async (blob: Blob) => {
    if (!onEvaluate) return;
    
    setIsEvaluating(true);
    try {
      const result = await onEvaluate(phrase.id, blob);
      setEvaluationResult(result);
    } catch (error) {
      console.error('Evaluation failed:', error);
      setEvaluationResult({ error: 'Evaluation failed. Please try again.' });
    } finally {
      setIsEvaluating(false);
    }
  };
  
  const handlePlayAudio = (languageCode?: string, voiceType: 'male' | 'female' = 'female') => {
    if (!getAudioUrl) return;
    
    let audioUrl = getAudioUrl(phrase, languageCode, voiceType);
    if (audioUrl) {
      setPlayingAudio(audioUrl);
    }
  };

  // Get relevant translations based on phrase language
  const getRelevantTranslations = () => {
    if (!getTranslations) return [];
    
    if (phrase.language === 'en') {
      // For English phrases, show Vietnamese and Thai translations
      return getTranslations(phrase, ['vi', 'th']);
    } else if (phrase.language === 'th') {
      // For Thai phrases, show English and Vietnamese translations
      return getTranslations(phrase, ['en', 'vi']);
    }
    return [];
  };

  const relevantTranslations = getRelevantTranslations();
  
  // Determine badge color based on level
  const levelColor = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }[phrase.level];

  // Language flag helper
  const getLanguageFlag = (langCode: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'th': '🇹🇭',
      'vi': '🇻🇳'
    };
    return flags[langCode] || '🌐';
  };
  
  return (
    <div className={clsx(
      "card hover:shadow-lg transition-shadow",
      compact ? "hover:shadow-md" : "hover:shadow-lg"
    )}>
      <div className={clsx(
        compact ? "p-3" : "p-4"
      )}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${levelColor}`}>
                {phrase.level}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                {phrase.topic}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {getLanguageFlag(phrase.language)} {phrase.language.toUpperCase()}
              </span>
            </div>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">{phrase.text}</h3>
            
            {/* Pronunciation and Romanization */}
            {(phrase.pronunciation || phrase.romanize) && (
              <div className="space-y-1 mb-3">
                {phrase.pronunciation && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pronunciation:</span> /{phrase.pronunciation}/
                  </p>
                )}
                {phrase.romanize && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Romanization:</span> {phrase.romanize}
                  </p>
                )}
              </div>
            )}

            {/* Translations */}
            {relevantTranslations.length > 0 && (
              <div className="space-y-2 mb-3">
                {relevantTranslations.map((translation) => (
                  <div key={translation.id} className="flex items-start gap-2">
                    <span className="text-sm">
                      {getLanguageFlag(translation.language_code)}
                    </span>
                    <p className="text-gray-600 italic text-sm flex-1">
                      {translation.translation_text}
                      {translation.is_verified && (
                        <CheckCircle className="inline ml-1 w-3 h-3 text-green-500" />
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {showZoomButton && onZoom && (
              <button
                onClick={onZoom}
                className="text-gray-500 hover:text-blue-600 p-2 transition-colors"
                aria-label="View in fullscreen"
                title="Fullscreen mode (F)"
              >
                <Maximize2 size={20} />
              </button>
            )}
            
            <button
              onClick={handleToggleSave}
              className="text-gray-500 hover:text-blue-600 p-2 transition-colors"
              aria-label={phrase.saved ? 'Unsave phrase' : 'Save phrase'}
            >
              {phrase.saved ? (
                <BookmarkCheck className="text-blue-600" size={20} />
              ) : (
                <Bookmark size={20} />
              )}
            </button>
          </div>
        </div>
        
        {/* Enhanced Audio Players */}
        {getAudioUrl && phrase.audio_files.length > 0 && (
          <div className="space-y-3 mt-4">
            {/* Main phrase audio */}
            {getAudioUrl(phrase, phrase.language) && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {getLanguageFlag(phrase.language)} {phrase.language.toUpperCase()} Audio
                </p>
                <EnhancedAudioPlayer
                  src={getAudioUrl(phrase, phrase.language) || ''}
                  title={phrase.text}
                  compact={true}
                  showSpeedControl={true}
                  onPlay={() => setPlayingAudio(getAudioUrl(phrase, phrase.language) || '')}
                  onPause={() => setPlayingAudio(null)}
                  onEnded={() => setPlayingAudio(null)}
                />
              </div>
            )}

            {/* Translation audio */}
            {relevantTranslations.map((translation) => {
              const audioUrl = getAudioUrl(phrase, translation.language_code);
              if (!audioUrl || translation.language_code === phrase.language) return null;
              
              return (
                <div key={`audio-${translation.id}`}>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    {getLanguageFlag(translation.language_code)} {translation.language_code.toUpperCase()} Audio
                  </p>
                  <EnhancedAudioPlayer
                    src={audioUrl}
                    title={translation.translation_text}
                    compact={true}
                    showSpeedControl={true}
                    onPlay={() => setPlayingAudio(audioUrl)}
                    onPause={() => setPlayingAudio(null)}
                    onEnded={() => setPlayingAudio(null)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          
          {/* Recording Button */}
          <button
            onClick={isRecording ? undefined : handleStartRecording}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              isRecording 
                ? 'bg-red-200 text-red-700 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isRecording}
          >
            <Mic size={16} />
            <span>{isRecording ? 'Recording...' : 'Record'}</span>
          </button>
          
          {/* Evaluation Result */}
          {evaluationResult && !evaluationResult.error && (
            <div className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md">
              <CheckCircle size={16} />
              <span>Score: {evaluationResult.score || 'Evaluated'}</span>
            </div>
          )}
          
          {evaluationResult?.error && (
            <div className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-md">
              <span>{evaluationResult.error}</span>
            </div>
          )}
          
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors ml-auto"
          >
            {isExpanded ? 'Hide' : 'More'}
          </button>
        </div>
      </div>
      
      {(isExpanded || isRecording) && (
        <div className={clsx(
          "border-t border-gray-200 bg-gray-50",
          compact ? "p-3" : "p-4"
        )}>
          <AudioRecorder 
            onRecordingComplete={(blob) => {
              handleRecordingComplete(blob);
              // Auto-evaluate if evaluation function is available
              if (onEvaluate && !isEvaluating) {
                handleEvaluate(blob);
              }
            }}
            autoStart={isRecording}
            maxDuration={30}
            label="Record your practice pronunciation"
          />
          
          {isEvaluating && (
            <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Evaluating your pronunciation...</span>
            </div>
          )}

          {/* Extended phrase information */}
          {isExpanded && (
            <div className="mt-4 space-y-3 border-t pt-3">
              {phrase.phonetic && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Phonetic:</span>
                  <p className="text-sm text-gray-600 mt-1">{phrase.phonetic}</p>
                </div>
              )}
              
              {phrase.audio_files.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Available Audio:</span>
                  <div className="mt-2 space-y-1">
                    {phrase.audio_files.map((audioFile) => (
                      <div key={audioFile.id} className="flex items-center gap-2 text-xs">
                        <span>{getLanguageFlag(audioFile.language_code)}</span>
                        <span className="text-gray-600">
                          {audioFile.language_code.toUpperCase()} • {audioFile.voice_type} • {audioFile.speed}
                        </span>
                        <button
                          onClick={() => handlePlayAudio(audioFile.language_code, audioFile.voice_type)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={playingAudio !== null}
                        >
                          <Play size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhraseCard;