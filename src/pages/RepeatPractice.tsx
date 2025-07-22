import React, { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptDisplay, { TranscriptLine } from '../components/TranscriptDisplay';
import AudioRecorder from '../components/AudioRecorder';
import { YoutubeIcon, ChevronLeft, ChevronRight, Save, Link } from 'lucide-react';
import clsx from 'clsx';
import { useVideoApi } from '../hooks/useVideoApi';


interface VideoItem {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  url: string;
}

interface RecordingState {
  lineId: string;
  blob?: Blob;
  url?: string;
}

enum TranscriptStatus {
  READY = 'ready',
  GENERATING = 'generating',
  FAILED = 'failed',
  ERROR = 'error'
}

const extractVideoId = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      return urlObj.searchParams.get('v');
    }
  } catch (error) {
    return null;
  }
  return null;
};



const RepeatPractice: React.FC = () => {
  const { authVideoApi } = useVideoApi();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(true);
  const [isSelectingVideo, setIsSelectingVideo] = useState(true);
  const [recordings, setRecordings] = useState<Record<string, RecordingState>>({});
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptLine[]>([]);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [existingVideos, setExistingVideos] = useState<VideoItem[]>([]); // For future use
  const [isTranscriptLoaded, setIsTranscriptLoaded] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [isPollingTranscript, setIsPollingTranscript] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);


  async function CheckTranscriptStatus(video_url: string): Promise<{status: 'ready' | 'generating' | 'failed' | 'error', data?: any, message?: string}> {
    let transcriptStatus: TranscriptStatus = TranscriptStatus.ERROR;
    try {
      console.log('HVH CheckTranscriptStatus called with video_url:', video_url);
      const responseData = await authVideoApi?.getTranscriptStatus(video_url);
  
      if(responseData.message.includes('Transcript is being generated')) {
        transcriptStatus = TranscriptStatus.GENERATING;
      }
      else if(responseData.message.includes('Transcript is ready')) {
        transcriptStatus = TranscriptStatus.READY;
      }
      else {
        transcriptStatus = TranscriptStatus.FAILED;
      }
  
      console.log('HVH transcript status:', transcriptStatus);
  
      return {
        status: transcriptStatus,
        message: responseData.message
      };
    }
    catch (error: any) {
      console.error('HVH error in CheckTranscriptStatus:', error);
      return {
        status: 'error',
        message: "An unexpected error occurred while checking transcript status"
      };
    }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId);
      }
    };
  }, [pollingTimeoutId]);

  // Polling mechanism with exponential backoff
  const getPollingDelay = (attempts: number): number => {
    const baseDelays = [10, 30, 60]; // seconds
    const delayIndex = attempts % baseDelays.length;
    return baseDelays[delayIndex] * 1000; // convert to milliseconds
  };

  const startPollingTranscript = async (videoUrl: string, attempts: number = 0) => {
    console.log(`HVH Starting polling attempt ${attempts + 1} for video: ${videoUrl}`);
    
    try {
      const result = await CheckTranscriptStatus(videoUrl);
      // turn to switch case with enum TranscriptStatus
      switch (result.status) {
        case TranscriptStatus.READY:
          const transcriptResponse = await authVideoApi?.getTranscript(videoUrl);
          console.log('HVH fetched transcript:', transcriptResponse);
          setActiveTranscript(transcriptResponse["transcript"] || []);
          setTranscriptError(null);
          setIsPollingTranscript(false);
          setIsLoadingTranscript(false);
          setIsTranscriptLoaded(true);
          setPollingAttempts(0);
          break;
        case TranscriptStatus.FAILED:
          console.log('HVH Transcript generation failed permanently');
          setTranscriptError(result.message || "Transcript failed to generate, please try again");
          setActiveTranscript([]);
          setIsPollingTranscript(false);
          setIsLoadingTranscript(false);
          setIsTranscriptLoaded(true);
          setPollingAttempts(0);
          break;
        case TranscriptStatus.GENERATING:
          const nextAttempts = attempts + 1;
          const delay = getPollingDelay(attempts);
          
          console.log(`HVH Transcript still generating, waiting ${delay/1000}s before next attempt`);
          setPollingAttempts(nextAttempts);
          setTranscriptError(`Transcript is being generated... (attempt ${nextAttempts}, retrying in ${delay/1000}s)`);
          
          const timeoutId = setTimeout(() => {
            startPollingTranscript(videoUrl, nextAttempts);
          }, delay);
          
          setPollingTimeoutId(timeoutId);
          break;
        case TranscriptStatus.ERROR:
          console.log('HVH Error checking transcript status');
          setTranscriptError(result.message || "An error occurred while checking transcript status");
          setActiveTranscript([]);
          setIsPollingTranscript(false);
          setIsLoadingTranscript(false);
          setIsTranscriptLoaded(true);
          setPollingAttempts(0);
          break;
      }
    } catch (error) {
      console.error('HVH Error in polling:', error);
      setTranscriptError("An unexpected error occurred while checking transcript status");
      setActiveTranscript([]);
      setIsPollingTranscript(false);
      setIsLoadingTranscript(false);
      setIsTranscriptLoaded(true);
      setPollingAttempts(0);
    }
  };

  // Default Effect to fetch initial videos
  useEffect(() => {
      authVideoApi?.getVideos()
      .then(response => {
        console.log('HVH fetched videos:', response);
        const videos = response.videos?.map((video: any) => {
          const videoId = extractVideoId(video.video_url);
          const level = video.level || 'beginner';
          const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          return {
            id: video.id,
            title: video.title,
            videoId: videoId,
            thumbnail: thumbnail,
            level: level as 'beginner' | 'intermediate' | 'advanced',
            url: video.video_url || `https://www.youtube.com/watch?v=${videoId}`,
          } as VideoItem;
        });
        setExistingVideos(videos);
      })
      .catch(error => {
        console.error('HVH error fetching videos:', error);
      });
  }, []);


  
  const handleVideoSelect = async (video: VideoItem) => {
    // Clear any existing polling
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }

    setSelectedVideo(video);
    setIsSelectingVideo(false);
    // Reset state when selecting a new video
    setRecordings({});
    setCompletedLines([]);
    setActiveLineId(undefined);
    setIsTranscriptLoaded(false);
    setIsLoadingTranscript(true);
    setIsPollingTranscript(false);
    setTranscriptError(null);
    setPollingAttempts(0);
    setActiveTranscript([]);

    // Reset other state when changing video
    setCurrentTime(0);
    setSeekTime(null);

    console.log('HVH Checking transcript status for selected video:', video.url);
    
    try {
      const result = await CheckTranscriptStatus(video.url);
      
      switch (result.status) {
        case TranscriptStatus.READY:
        // Transcript is ready immediatel
        const transcriptResponse = await authVideoApi?.getTranscript(video.url);
        console.log('HVH Transcript is ready immediately');
        setActiveTranscript(transcriptResponse["transcript"] || []);
        setTranscriptError(null);
        setIsLoadingTranscript(false);
        setIsTranscriptLoaded(true);
        break;
        case TranscriptStatus.GENERATING:
          console.log('HVH Transcript is generating, starting polling');
          setIsPollingTranscript(true);
          setIsLoadingTranscript(false);
          startPollingTranscript(video.url, 0);
        break;
        case TranscriptStatus.FAILED:
          // Transcript generation failed permanently
          console.log('HVH Transcript generation failed');
          setTranscriptError(result.message || "Transcript failed to generate, please try again");
          setActiveTranscript([]);
          setIsLoadingTranscript(false);
          setIsTranscriptLoaded(true);
          break;
        case TranscriptStatus.ERROR: 
          console.log('HVH Error checking transcript status');
          setTranscriptError(result.message || "An error occurred while checking transcript status");
          setActiveTranscript([]);
          setIsLoadingTranscript(false);
          setIsTranscriptLoaded(true);
          break;
        }
    } catch (error: any) {
      console.error('HVH Error in handleVideoSelect:', error);
      setTranscriptError("An unexpected error occurred while loading the transcript.");
      setActiveTranscript([]);
      setIsLoadingTranscript(false);
      setIsTranscriptLoaded(true);
    }
  };

  const handleCustomVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }

    setUrlError('');
    const customVideo: VideoItem = {
      id: videoId,
      title: 'Custom Video',
      videoId: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      level: 'beginner',
      url: youtubeUrl,
    };
  
    // Generate transcript for new video
    authVideoApi?.generateTranscript(youtubeUrl).then(result => {
      console.log('HVH generated transcript for custom video:', result);
    }).catch(error => {
      console.error('HVH error generating transcript for custom video:', error);
    });

    handleVideoSelect(customVideo);
  };
  
  const handleLineClick = (line: TranscriptLine) => {
    setActiveLineId(line.id);
    // If video is playing, pause it
    // setIsPaused(true);
    setSeekTime(line.start);
  };
  
  const handleRecordingComplete = (blob: Blob) => {
    console.log("HVH handleRecordingComplete called with blob:", blob);
    if (!activeLineId) return;
    
    const url = URL.createObjectURL(blob);
    setRecordings(prev => ({
      ...prev,
      [activeLineId]: {
        lineId: activeLineId,
        blob,
        url,
      },
    }));
    
    // Mark this line as completed
    if (!completedLines.includes(activeLineId)) {
      setCompletedLines(prev => [...prev, activeLineId]);
    }
    
    // Move to the next line if available
  const currentIndex = activeTranscript.findIndex(line => line.id === activeLineId);
    if (currentIndex < activeTranscript.length - 1) {
      setActiveLineId(activeTranscript[currentIndex + 1].id);
    }
  };
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    
    // Find the current line based on time of current line
    // const currentLine = activeTranscript.find(
    //   line => time >= line.start && time <= line.end
    // );

    // Find the current line based on time of current line and next line
    const currentLine = activeTranscript.find((line, index) => {
      const nextLine = activeTranscript[index + 1];
      const lineStart = line.start;
      const nextLineStart = nextLine ? nextLine.start : Infinity; // If no next line, treat as "infinite"
      return time >= lineStart && time < nextLineStart;
    });
    if (currentLine && currentLine.id !== activeLineId) {
      setActiveLineId(currentLine.id);
    }
  };
  
  const handleNextLine = () => {
    console.log("HVH handleNextLine called");
    if (!activeLineId) return;
    
    const currentIndex = activeTranscript.findIndex(line => line.id === activeLineId);
    if (currentIndex < activeTranscript.length - 1) {
      setActiveLineId(activeTranscript[currentIndex + 1].id);
    }
  };
  
  const handlePreviousLine = () => {
    console.log("HVH handlePreviousLine called");
    if (!activeLineId) return;
    
    const currentIndex = activeTranscript.findIndex(line => line.id === activeLineId);
    if (currentIndex > 0) {
      setActiveLineId(activeTranscript[currentIndex - 1].id);
    }
  };
  
  const progressPercentage = completedLines.length > 0 
    ? Math.round((completedLines.length / activeTranscript.length) * 100) 
    : 0;
  
  const currentLineContent = activeLineId 
    ? activeTranscript.find(line => line.id === activeLineId)?.content 
    : '';
  
  return (
    <div className="fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Repeat Practice</h1>
      
      {isSelectingVideo ? (
        <>
          <p className="text-gray-600 mb-6">
            Select a video to practice repeating after native speakers. Listen carefully and try to match their pronunciation and intonation.
          </p>

          {/* Youtube upload input */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Video</h2>
              <form onSubmit={handleCustomVideoSubmit} className="space-y-4">
                <div>
                  <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube Video URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className={clsx(
                        "block w-full pl-10 pr-3 py-2 rounded-md border",
                        urlError ? "border-red-300" : "border-gray-300",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      )}
                    />
                  </div>
                  {urlError && (
                    <p className="mt-1 text-sm text-red-600">{urlError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <YoutubeIcon size={20} />
                  <span>Load Video</span>
                </button>
              </form>
            </div>
          </div>
          {/* Youtube upload input */}

          {existingVideos.length == 0 && (
            <div className="text-center text-gray-500">
              <p className="mb-4">No videos available. Please add a custom video.</p>
            </div>
          )}

          {existingVideos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingVideos.map(video => (
              <div 
                key={video.id}
                className="card cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleVideoSelect(video)}
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-blue-600 rounded-full p-3">
                      <YoutubeIcon size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={clsx(
                      'px-2 py-1 text-xs rounded-full',
                      video.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      video.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {video.level}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsSelectingVideo(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft size={16} />
              <span>Back to videos</span>
            </button>
            
            <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-800 text-sm">
              Progress: {progressPercentage}%
            </div>
          </div>
          
          {selectedVideo && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <VideoPlayer
                    videoId={selectedVideo.videoId}
                    onTimeUpdate={handleTimeUpdate}
                    onPause={() => setIsPaused(true)}
                    onPlay={() => setIsPaused(false)}
                    initialTime= {0}
                    seekTime={seekTime}
                    onSeekHandled={() => setSeekTime(null)} // clear it after handled
                    shouldAutoPlay={isTranscriptLoaded}
                  />
                  
                  <div className="card p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Current Phrase</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePreviousLine}
                          className="p-1 rounded-md hover:bg-gray-100"
                          title="Previous phrase"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={handleNextLine}
                          className="p-1 rounded-md hover:bg-gray-100"
                          title="Next phrase"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md mb-4">
                      <p className="text-lg text-gray-900">
                        {isLoadingTranscript 
                          ? 'Loading transcript...' 
                          : isPollingTranscript
                            ? 'Generating transcript...'
                            : transcriptError 
                              ? 'Transcript not available' 
                              : currentLineContent || 'Select a line from the transcript'
                        }
                      </p>
                    </div>
                    
                    {activeLineId && !isLoadingTranscript && !isPollingTranscript && !transcriptError && (
                      <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        label="Repeat the phrase"
                        maxDuration={10}
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  {isLoadingTranscript ? (
                    <div className="card p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading transcript...</p>
                      </div>
                    </div>
                  ) : isPollingTranscript ? (
                    <div className="card p-8">
                      <div className="text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-center mb-3">
                            <div className="bg-blue-100 rounded-full p-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                          </div>
                          <h3 className="text-lg font-medium text-blue-800 mb-2">Generating Transcript</h3>
                          <p className="text-blue-700 text-sm mb-4">
                            {transcriptError || `Transcript is being generated... (attempt ${pollingAttempts})`}
                          </p>
                          <button
                            onClick={() => {
                              if (pollingTimeoutId) {
                                clearTimeout(pollingTimeoutId);
                                setPollingTimeoutId(null);
                              }
                              setIsPollingTranscript(false);
                              setTranscriptError("Transcript generation cancelled by user");
                              setIsTranscriptLoaded(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : transcriptError ? (
                    <div className="card p-8">
                      <div className="text-center">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-center mb-2">
                            <div className="bg-yellow-100 rounded-full p-2">
                              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                          </div>
                          <h3 className="text-lg font-medium text-yellow-800 mb-2">Transcript Not Available</h3>
                          <p className="text-yellow-700 text-sm">{transcriptError}</p>
                          {(transcriptError.includes("generating") || transcriptError.includes("failed")) && (
                            <button
                              onClick={() => handleVideoSelect(selectedVideo!)}
                              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                            >
                              Try Again
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <TranscriptDisplay
                      transcript={activeTranscript}
                      currentTime={currentTime}
                      onLineClick={handleLineClick}
                      activeLineId={activeLineId}
                    />
                  )}
                  
                  {completedLines.length > 0 && (
                    <div className="card mt-6">
                      <div className="p-4 bg-green-800 text-white">
                        <h3 className="text-lg font-semibold">Your Recordings</h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {completedLines.map(lineId => {
                            const line = activeTranscript.find(l => l.id === lineId);
                            const recording = recordings[lineId];
                            
                            if (!line || !recording?.url) return null;
                            
                            return (
                              <div key={lineId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex-1">
                                  <p className="text-gray-800">{line.content}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <audio src={recording.url} controls className="h-8 w-40" />
                                  <button className="p-1 text-gray-500 hover:text-blue-600">
                                    <Save size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RepeatPractice;