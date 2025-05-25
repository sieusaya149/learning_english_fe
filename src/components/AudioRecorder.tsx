import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Save, Trash2, Play, Pause } from 'lucide-react';
import clsx from 'clsx';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  autoStart?: boolean;
  maxDuration?: number; // in seconds
  label?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  autoStart = false,
  maxDuration = 60,
  label = 'Record your voice',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Auto-start recording if prop is set
  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, [autoStart]);
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
        
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1;
          // Auto-stop if we hit max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  };
  
  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleReset = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);
  
  return (
    <div className={clsx('p-4 rounded-lg transition-all', isRecording ? 'recording' : 'bg-white shadow')}>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      )}
      
      <div className="mb-3">
        <h3 className="text-lg font-medium text-gray-800">{label}</h3>
        <div className="text-sm text-gray-500">
          {isRecording 
            ? `Recording: ${formatTime(recordingTime)}`
            : audioUrl 
              ? 'Recording complete'
              : 'Click to start recording'
          }
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!audioUrl ? (
          <>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-colors font-medium',
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              {isRecording ? (
                <>
                  <StopCircle size={18} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>Record</span>
                </>
              )}
            </button>
            
            {isRecording && (
              <div className="relative flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse" />
                <span className="text-red-500 font-medium">Recording...</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause size={18} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Play</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Discard recording"
            >
              <Trash2 size={18} />
            </button>
            
            <button
              onClick={() => audioUrl && onRecordingComplete?.(audioChunksRef.current[0])}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Save recording"
            >
              <Save size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;