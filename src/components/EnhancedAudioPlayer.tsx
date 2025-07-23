import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface EnhancedAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  showSpeedControl?: boolean;
  showVolumeControl?: boolean;
  compact?: boolean;
}

const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  src,
  title,
  className = '',
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  showSpeedControl = true,
  showVolumeControl = false,
  compact = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Failed to load audio');
      setIsPlaying(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Unable to play audio');
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (compact) {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <audio ref={audioRef} src={src} preload="metadata" />
        
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-full transition-all',
            isLoading || error
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {error ? (
          <span className="text-xs text-red-500">Error</span>
        ) : (
          <div className="flex-1 min-w-0">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
            >
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {showSpeedControl && !error && (
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="text-xs bg-transparent border-none focus:outline-none text-gray-600"
          >
            {speedOptions.map(speed => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg p-4 shadow-sm', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {title && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <VolumeX className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm text-red-600">Failed to load audio</span>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden group"
            >
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />
              <div className="absolute inset-0 bg-blue-700 opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className={clsx(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-all',
                  isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Restart Button */}
              <button
                onClick={restart}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume Control */}
              {showVolumeControl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Speed Control */}
            {showSpeedControl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Speed:</span>
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {speedOptions.map(speed => (
                    <option key={speed} value={speed}>
                      {speed}x
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedAudioPlayer; 