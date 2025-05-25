import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Play, Volume2 } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

export interface Phrase {
  id: string;
  text: string;
  translation?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  audioUrl?: string;
  saved?: boolean;
}

interface PhraseCardProps {
  phrase: Phrase;
  onSave: (phraseId: string, saved: boolean) => void;
  onRecordingComplete?: (phraseId: string, blob: Blob) => void;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ 
  phrase, 
  onSave,
  onRecordingComplete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const handleToggleSave = () => {
    onSave(phrase.id, !phrase.saved);
  };
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleStartRecording = () => {
    setIsRecording(true);
  };
  
  const handleRecordingComplete = (blob: Blob) => {
    setIsRecording(false);
    if (onRecordingComplete) {
      onRecordingComplete(phrase.id, blob);
    }
  };
  
  const handlePlayAudio = () => {
    if (phrase.audioUrl) {
      const audio = new Audio(phrase.audioUrl);
      audio.play();
    }
  };
  
  // Determine badge color based on level
  const levelColor = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }[phrase.level];
  
  return (
    <div className="card hover:shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${levelColor}`}>
                {phrase.level}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                {phrase.topic}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-800">{phrase.text}</h3>
            {phrase.translation && (
              <p className="text-gray-600 mt-1 italic">{phrase.translation}</p>
            )}
          </div>
          
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
        
        <div className="flex gap-2 mt-4">
          {phrase.audioUrl && (
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Volume2 size={16} />
              <span>Listen</span>
            </button>
          )}
          
          <button
            onClick={isRecording ? undefined : handleStartRecording}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              isRecording 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isRecording}
          >
            <Play size={16} />
            <span>Practice</span>
          </button>
          
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors ml-auto"
          >
            {isExpanded ? 'Hide' : 'More'}
          </button>
        </div>
      </div>
      
      {(isExpanded || isRecording) && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <AudioRecorder 
            onRecordingComplete={handleRecordingComplete}
            autoStart={isRecording}
            maxDuration={30}
            label="Record your practice"
          />
        </div>
      )}
    </div>
  );
};

export default PhraseCard;