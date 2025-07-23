import React, { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptDisplay, { TranscriptLine } from '../components/TranscriptDisplay';
import AudioRecorder from '../components/AudioRecorder';
import EnhancedAudioPlayer from '../components/EnhancedAudioPlayer';
import { YoutubeIcon, ChevronLeft, ChevronRight, Save, Link, Repeat, Clock, Target, TrendingUp, Award, Search, Filter, Users, Download, Share2, Trash2, Play, RotateCcw, Volume2, Settings, Plus } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useVideoApi } from '../hooks/useVideoApi';
import { useNotifications, createPracticeNotification, createAchievementNotification } from '../hooks/useNotifications';
import { PageLoadingSkeleton } from '../components/Skeletons';

interface VideoItem {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  duration?: string;
  category?: string;
  speaker?: string;
  description?: string;
}

interface RecordingState {
  lineId: string;
  blob?: Blob;
  url?: string;
  timestamp: Date;
  quality?: number;
}

interface RepeatStats {
  totalSessions: number;
  totalMinutes: number;
  totalRecordings: number;
  averageAccuracy: number;
  completedVideos: string[];
  streak: number;
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
  const { addNotification } = useNotifications();
  
  // Video and UI state
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSelectingVideo, setIsSelectingVideo] = useState(true);
  const [existingVideos, setExistingVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Video playback and transcript
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(true);
  const [recordings, setRecordings] = useState<Record<string, RecordingState>>({});
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptLine[]>([]);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  
  // Custom video input
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showCustomVideo, setShowCustomVideo] = useState(false);
  
  // Transcript loading state
  const [isTranscriptLoaded, setIsTranscriptLoaded] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [isPollingTranscript, setIsPollingTranscript] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Load saved recordings from localStorage
  useEffect(() => {
    const savedRecordings = localStorage.getItem('repeatRecordings');
    if (savedRecordings) {
      try {
        const parsed = JSON.parse(savedRecordings);
        const recordingsWithDates = Object.keys(parsed).reduce((acc, key) => {
          acc[key] = {
            ...parsed[key],
            timestamp: new Date(parsed[key].timestamp)
          };
          return acc;
        }, {} as Record<string, RecordingState>);
        setRecordings(recordingsWithDates);
      } catch (error) {
        console.error('Error loading recordings:', error);
      }
    }
  }, []);

  // Save recordings to localStorage
  useEffect(() => {
    localStorage.setItem('repeatRecordings', JSON.stringify(recordings));
  }, [recordings]);

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
          toast.success('Transcript loaded successfully!');
          break;
        case TranscriptStatus.FAILED:
          console.log('HVH Transcript generation failed permanently');
          setTranscriptError(result.message || "Transcript failed to generate, please try again");
          setActiveTranscript([]);
          setIsPollingTranscript(false);
          setIsLoadingTranscript(false);
          setIsTranscriptLoaded(true);
          setPollingAttempts(0);
          toast.error('Transcript generation failed');
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
          toast.error('Error checking transcript status');
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
      toast.error('Unexpected error occurred');
    }
  };

  // Fetch initial videos
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const response = await authVideoApi?.getVideos();
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
            duration: '5:30', // Default duration
            category: 'Educational',
            speaker: 'Native Speaker',
            description: video.description || 'Practice your pronunciation and listening skills'
          } as VideoItem;
        });
        setExistingVideos(videos || []);
      } catch (error) {
        console.error('HVH error fetching videos:', error);
        toast.error('Failed to load videos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [authVideoApi]);

  const handleVideoSelect = async (video: VideoItem) => {
    // Clear any existing polling
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }

    setSelectedVideo(video);
    setIsSelectingVideo(false);
    setIsLoading(true);
    
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
    setCurrentTime(0);
    setSeekTime(null);

    console.log('HVH Checking transcript status for selected video:', video.url);
    
    // Simulate loading delay
    setTimeout(async () => {
      try {
        const result = await CheckTranscriptStatus(video.url);
        
        switch (result.status) {
          case TranscriptStatus.READY:
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
        toast.error('Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleCustomVideoSubmit = async (e: React.FormEvent) => {
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
      duration: 'Unknown',
      category: 'Custom',
      speaker: 'Unknown',
      description: 'Custom video for repeat practice'
    };
  
    try {
      // Generate transcript for new video
      const result = await authVideoApi?.generateTranscript(youtubeUrl);
      console.log('HVH generated transcript for custom video:', result);
      toast.success('Custom video added! Generating transcript...');
    } catch (error) {
      console.error('HVH error generating transcript for custom video:', error);
      toast.error('Failed to generate transcript for custom video');
    }

    handleVideoSelect(customVideo);
    setShowCustomVideo(false);
    setYoutubeUrl('');
  };
  
  const handleLineClick = (line: TranscriptLine) => {
    setActiveLineId(line.id);
    setSeekTime(line.start);
  };
  
  const handleRecordingComplete = (blob: Blob) => {
    console.log("HVH handleRecordingComplete called with blob:", blob);
    if (!activeLineId) return;
    
    const url = URL.createObjectURL(blob);
    const newRecording: RecordingState = {
      lineId: activeLineId,
      blob,
      url,
      timestamp: new Date(),
      quality: Math.floor(Math.random() * 30) + 70 // Simulate quality score 70-100
    };
    
    setRecordings(prev => ({
      ...prev,
      [activeLineId]: newRecording,
    }));
    
    // Mark this line as completed
    if (!completedLines.includes(activeLineId)) {
      setCompletedLines(prev => [...prev, activeLineId]);
      
      // Add practice notification
      addNotification(createPracticeNotification('repeat', 1));
      
      // Check for achievements
      checkRepeatAchievements(completedLines.length + 1, Object.keys(recordings).length + 1);
    }
    
    toast.success(`Recording saved! Quality: ${newRecording.quality}%`);
    
    // Move to the next line if available
    const currentIndex = activeTranscript.findIndex(line => line.id === activeLineId);
    if (currentIndex < activeTranscript.length - 1) {
      setActiveLineId(activeTranscript[currentIndex + 1].id);
    }
  };

  const checkRepeatAchievements = (completedCount: number, totalRecordings: number) => {
    // First recording achievement
    if (totalRecordings === 1) {
      addNotification(createAchievementNotification(
        'Repeat Rookie! 🎤',
        'Great start! You\'ve completed your first repeat practice session.',
        '🎤'
      ));
    }

    // Completion milestones
    if (completedCount === 10) {
      addNotification(createAchievementNotification(
        'Repeat Champion! 🏆',
        'Excellent! You\'ve completed 10 repeat practice phrases. Your pronunciation is improving!',
        '🏆'
      ));
    } else if (completedCount === 25) {
      addNotification(createAchievementNotification(
        'Pronunciation Pro! 🎯',
        'Amazing! 25 phrases completed. You\'re mastering the art of repetition!',
        '🎯'
      ));
    } else if (completedCount === 50) {
      addNotification(createAchievementNotification(
        'Repeat Master! 👑',
        'Incredible! 50 phrases mastered. You\'re a true repeat practice legend!',
        '👑'
      ));
    }

    // Video completion achievement
    if (selectedVideo && completedCount === activeTranscript.length) {
      addNotification(createAchievementNotification(
        'Video Conquered! 🎬',
        `Outstanding! You\'ve completed all phrases in "${selectedVideo.title}". Perfect dedication!`,
        '🎬'
      ));
    }
  };
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    
    const currentLine = activeTranscript.find((line, index) => {
      const nextLine = activeTranscript[index + 1];
      const lineStart = line.start;
      const nextLineStart = nextLine ? nextLine.start : Infinity;
      return time >= lineStart && time < nextLineStart;
    });
    
    if (currentLine && currentLine.id !== activeLineId) {
      setActiveLineId(currentLine.id);
    }
  };
  
  const handleNextLine = () => {
    if (!activeLineId) return;
    
    const currentIndex = activeTranscript.findIndex(line => line.id === activeLineId);
    if (currentIndex < activeTranscript.length - 1) {
      setActiveLineId(activeTranscript[currentIndex + 1].id);
    }
  };
  
  const handlePreviousLine = () => {
    if (!activeLineId) return;
    
    const currentIndex = activeTranscript.findIndex(line => line.id === activeLineId);
    if (currentIndex > 0) {
      setActiveLineId(activeTranscript[currentIndex - 1].id);
    }
  };

  const downloadRecording = (recording: RecordingState) => {
    if (!recording.blob) return;
    
    const link = document.createElement('a');
    link.href = recording.url!;
    link.download = `repeat-${recording.lineId}-${recording.timestamp.toISOString().split('T')[0]}.webm`;
    link.click();
    toast.success('Recording downloaded!');
  };

  const shareRecording = (recording: RecordingState) => {
    if (navigator.share && recording.url) {
      navigator.share({
        title: 'Repeat Practice Recording',
        text: 'Check out my repeat practice recording!',
        url: recording.url
      });
    } else if (recording.url) {
      navigator.clipboard.writeText(recording.url);
      toast.success('Recording link copied to clipboard!');
    }
  };

  const deleteRecording = (lineId: string) => {
    setRecordings(prev => {
      const newRecordings = { ...prev };
      delete newRecordings[lineId];
      return newRecordings;
    });
    setCompletedLines(prev => prev.filter(id => id !== lineId));
    toast.success('Recording deleted');
  };

  // Filter and pagination logic
  const filteredVideos = existingVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || video.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || video.category === filterCategory;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * videosPerPage,
    currentPage * videosPerPage
  );

  const categories = ['all', ...Array.from(new Set(existingVideos.map(v => v.category || 'Educational')))];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  // Calculate statistics
  const repeatStats: RepeatStats = {
    totalSessions: Object.keys(recordings).length,
    totalMinutes: Math.round(Object.values(recordings).reduce((sum, rec) => sum + 0.5, 0)), // Approximate
    totalRecordings: Object.keys(recordings).length,
    averageAccuracy: Object.values(recordings).length > 0 ? 
      Math.round(Object.values(recordings).reduce((sum, rec) => sum + (rec.quality || 0), 0) / Object.values(recordings).length) : 0,
    completedVideos: selectedVideo && completedLines.length === activeTranscript.length ? [selectedVideo.id] : [],
    streak: 0 // Would be calculated from practice dates
  };
  
  const progressPercentage = completedLines.length > 0 && activeTranscript.length > 0
    ? Math.round((completedLines.length / activeTranscript.length) * 100) 
    : 0;
  
  const currentLineContent = activeLineId 
    ? activeTranscript.find(line => line.id === activeLineId)?.content 
    : '';

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterLevel, filterCategory]);

  if (isLoading && isSelectingVideo) {
    return <PageLoadingSkeleton type="phrases" />;
  }
  
  return (
    <div className="fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Repeat className="w-8 h-8 text-green-600" />
            Repeat Practice
          </h1>
          <p className="text-gray-600">
            Perfect your pronunciation by repeating after native speakers line by line
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recordings</p>
                <p className="text-2xl font-bold text-green-600">{repeatStats.totalRecordings}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Practice Time</p>
                <p className="text-2xl font-bold text-blue-600">{repeatStats.totalMinutes}m</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-orange-600">{repeatStats.averageAccuracy}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Videos</p>
                <p className="text-2xl font-bold text-purple-600">{repeatStats.completedVideos.length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      
        {isSelectingVideo ? (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
                  />
                </div>

                <div>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>
                        {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowCustomVideo(!showCustomVideo)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                Add Custom Video
              </button>
            </div>

            {/* Custom Video Input */}
            {showCustomVideo && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom YouTube Video</h3>
                <form onSubmit={handleCustomVideoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={clsx(
                          "w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2",
                          urlError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                        )}
                        required
                      />
                    </div>
                    {urlError && (
                      <p className="mt-1 text-sm text-red-600">{urlError}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomVideo(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {paginatedVideos.length} of {filteredVideos.length} videos
                {searchQuery && ` for "${searchQuery}"`}
              </span>
              {filteredVideos.length > videosPerPage && (
                <span>Page {currentPage} of {totalPages}</span>
              )}
            </div>
            
            {/* Video Grid */}
            {paginatedVideos.length === 0 ? (
              <div className="text-center py-12">
                <YoutubeIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {searchQuery || filterLevel !== 'all' || filterCategory !== 'all' 
                    ? 'No videos match your current filters.'
                    : 'No videos available yet.'
                  }
                </p>
                {(searchQuery || filterLevel !== 'all' || filterCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterLevel('all');
                      setFilterCategory('all');
                    }}
                    className="text-green-600 hover:text-green-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedVideos.map(video => (
                  <div 
                    key={video.id}
                    className="card cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 group"
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <p className="text-sm opacity-90">{video.description}</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-green-600 rounded-full p-3 transform scale-110">
                          <Play size={24} className="text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className={clsx(
                          'px-2 py-1 text-xs rounded-full font-medium',
                          video.level === 'beginner' ? 'bg-green-100 text-green-800' :
                          video.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        )}>
                          {video.level}
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {video.speaker}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {video.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-green-600 hover:bg-green-50'
                  )}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        'px-3 py-2 rounded-md transition-colors',
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 hover:bg-green-50'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-green-600 hover:bg-green-50'
                  )}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsSelectingVideo(true);
                  setSelectedVideo(null);
                  if (pollingTimeoutId) {
                    clearTimeout(pollingTimeoutId);
                    setPollingTimeoutId(null);
                  }
                }}
                className="flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors"
              >
                <ChevronLeft size={20} />
                <span>Back to videos</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="bg-green-50 px-4 py-2 rounded-full text-green-800 text-sm font-medium">
                  Progress: {progressPercentage}%
                </div>
                {selectedVideo && (
                  <div className="text-right">
                    <h2 className="text-xl font-medium text-gray-900">{selectedVideo.title}</h2>
                    <p className="text-sm text-gray-600">{selectedVideo.speaker} • {selectedVideo.category}</p>
                  </div>
                )}
              </div>
            </div>
            
            {selectedVideo && !isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video and Recording Section */}
                <div className="space-y-6">
                  <div className="card overflow-hidden">
                    <VideoPlayer
                      videoId={selectedVideo.videoId}
                      onTimeUpdate={handleTimeUpdate}
                      onPause={() => setIsPaused(true)}
                      onPlay={() => setIsPaused(false)}
                      initialTime={0}
                      seekTime={seekTime}
                      onSeekHandled={() => setSeekTime(null)}
                      shouldAutoPlay={isTranscriptLoaded}
                    />
                  </div>
                  
                  {/* Current Phrase and Recording */}
                  <div className="card p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Current Phrase</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handlePreviousLine}
                            disabled={!activeLineId}
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Previous phrase"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={handleNextLine}
                            disabled={!activeLineId}
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Next phrase"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
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
                        <div className="space-y-4">
                          <AudioRecorder
                            onRecordingComplete={handleRecordingComplete}
                            label="Repeat the phrase"
                            maxDuration={10}
                          />
                          
                          {/* Show quality of last recording */}
                          {recordings[activeLineId] && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700 font-medium">Recording Quality:</span>
                                <span className="text-blue-800 font-bold">{recordings[activeLineId].quality}%</span>
                              </div>
                              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${recordings[activeLineId].quality}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Transcript and Recordings Sidebar */}
                <div className="space-y-6">
                  {/* Transcript */}
                  {isLoadingTranscript ? (
                    <div className="card p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading transcript...</p>
                      </div>
                    </div>
                  ) : isPollingTranscript ? (
                    <div className="card p-6">
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
                    <div className="card p-6">
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
                  
                  {/* Recordings List */}
                  {completedLines.length > 0 && (
                    <div className="card">
                      <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Volume2 size={20} />
                          Your Recordings
                        </h3>
                        <p className="text-green-100 text-sm mt-1">
                          {completedLines.length} recording{completedLines.length !== 1 ? 's' : ''} completed
                        </p>
                      </div>
                      <div className="p-4">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                          {completedLines.map(lineId => {
                            const line = activeTranscript.find(l => l.id === lineId);
                            const recording = recordings[lineId];
                            
                            if (!line || !recording?.url) return null;
                            
                            return (
                              <div key={lineId} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 mb-1">{line.content}</p>
                                    <p className="text-xs text-gray-500">
                                      {recording.timestamp.toLocaleDateString()} • Quality: {recording.quality}%
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <span className={clsx(
                                      'text-xs px-2 py-1 rounded-full font-medium',
                                      (recording.quality || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                      (recording.quality || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    )}>
                                      {recording.quality}%
                                    </span>
                                  </div>
                                </div>
                                
                                <EnhancedAudioPlayer
                                  src={recording.url}
                                  title=""
                                  compact={true}
                                  showSpeedControl={true}
                                />
                                
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => downloadRecording(recording)}
                                      className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded"
                                      title="Download recording"
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button
                                      onClick={() => shareRecording(recording)}
                                      className="p-1.5 text-gray-500 hover:text-green-600 transition-colors rounded"
                                      title="Share recording"
                                    >
                                      <Share2 size={16} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => deleteRecording(lineId)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded"
                                    title="Delete recording"
                                  >
                                    <Trash2 size={16} />
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
            )}

            {isLoading && selectedVideo && (
              <PageLoadingSkeleton type="phrases" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepeatPractice;