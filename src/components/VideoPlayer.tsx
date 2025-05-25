import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  onPause?: () => void;
  onPlay?: () => void;
  initialTime?: number;
  seekTime?: number | null; // ← new prop
  onSeekHandled?: () => void; // optional callback to reset seekTime
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onTimeUpdate,
  onPause,
  onPlay,
  initialTime = 0,
  seekTime = null,
  onSeekHandled,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);


  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && playerRef.current) {
        // Use sync method from event.target (playerRef.current)
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, onTimeUpdate]);

  useEffect(() => {
    if (seekTime != null && playerRef.current) {
      playerRef.current.seekTo(seekTime, true);
      onSeekHandled?.(); // tell parent to clear the seekTime
    }
  }, [seekTime]);

  const handleReady = (event: any) => {
    playerRef.current = event.target;
    // event.target.getDuration().then((duration: number) => {
    // });
    const duration = event.target.getDuration();
    setDuration(duration);
    if (initialTime > 0) {
      event.target.seekTo(initialTime);
    }
    playerRef.current.playVideo();
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 5);
    playerRef.current?.seekTo(newTime);
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    playerRef.current?.seekTo(newTime);
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    playerRef.current?.seekTo(time);
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  return (
    <div className="video-player-container card flex flex-col">
      <div className="relative aspect-video">
        <YouTube
          videoId={videoId}
          className="w-full h-full"
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
          }}
          onReady={handleReady}
          onPlay={handlePlay}
          onPause={handlePause}
        />
      </div>
      
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3B82F6 ${(currentTime / duration) * 100}%, #E5E7EB ${(currentTime / duration) * 100}%)`
            }}
          />
          <span className="text-sm text-gray-600">{formatTime(duration)}</span>
        </div>
        
        <div className="flex justify-center items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={handleSkipBack}
            aria-label="Skip back 5 seconds"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={handleSkipForward}
            aria-label="Skip forward 5 seconds"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;