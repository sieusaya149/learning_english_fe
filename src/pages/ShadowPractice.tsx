import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import EnhancedAudioPlayer from '../components/EnhancedAudioPlayer';
import { YoutubeIcon, Mic, StopCircle, Save, Volume2, Info, Trash2, Play, Pause, RotateCcw, Download, Share2, Clock, Target, TrendingUp, Award, Link as LinkIcon, ChevronLeft, Users } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useNotifications, createPracticeNotification, createAchievementNotification, createStreakNotification } from '../hooks/useNotifications';
import { PageLoadingSkeleton } from '../components/Skeletons';

// Enhanced video data with more details
const sampleVideos: VideoItem[] = [
  {
    id: '1',
    title: 'Daily Conversation: Shopping',
    videoId: 'orL-w2QBiN8',
    thumbnail: 'https://img.youtube.com/vi/orL-w2QBiN8/mqdefault.jpg',
    level: 'beginner',
    duration: '5:30',
    difficulty: 1,
    category: 'Daily Life',
    accent: 'American',
    speaker: 'Native Speaker',
    description: 'Learn essential shopping vocabulary and phrases for everyday situations.'
  },
  {
    id: '2', 
    title: 'TED Talk: The Power of Vulnerability',
    videoId: 'X4Qm9cGRub0',
    thumbnail: 'https://img.youtube.com/vi/X4Qm9cGRub0/mqdefault.jpg',
    level: 'advanced',
    duration: '20:19',
    difficulty: 4,
    category: 'Academic',
    accent: 'American',
    speaker: 'Brené Brown',
    description: 'A profound talk about courage, vulnerability, and human connection.'
  },
  {
    id: '3',
    title: 'How to Introduce Yourself in English',
    videoId: '0flkN4jtgCs',
    thumbnail: 'https://img.youtube.com/vi/0flkN4jtgCs/mqdefault.jpg',
    level: 'beginner',
    duration: '8:45',
    difficulty: 1,
    category: 'Basics',
    accent: 'British',
    speaker: 'Language Teacher',
    description: 'Master the art of self-introduction with confidence and clarity.'
  },
  {
    id: '4',
    title: 'Business English: Job Interview',
    videoId: 'example4',
    thumbnail: 'https://img.youtube.com/vi/example4/mqdefault.jpg',
    level: 'intermediate',
    duration: '12:15',
    difficulty: 3,
    category: 'Business',
    accent: 'American',
    speaker: 'HR Professional',
    description: 'Prepare for job interviews with professional English communication.'
  },
  {
    id: '5',
    title: 'Travel English: At the Airport',
    videoId: 'example5',
    thumbnail: 'https://img.youtube.com/vi/example5/mqdefault.jpg',
    level: 'intermediate',
    duration: '7:20',
    difficulty: 2,
    category: 'Travel',
    accent: 'International',
    speaker: 'Travel Guide',
    description: 'Navigate airport situations with confidence using travel English.'
  }
];

interface VideoItem {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  difficulty: number;
  category: string;
  accent: string;
  speaker: string;
  description: string;
}

interface RecordingSession {
  id: string;
  videoId: string;
  videoTitle: string;
  recordingUrl: string;
  date: Date;
  duration: number;
  quality: number;
  segments: Array<{
    start: number;
    end: number;
    confidence: number;
  }>;
}

interface ShadowingStats {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  averageQuality: number;
  completedVideos: string[];
  favoriteCategory: string;
}

const ShadowPractice: React.FC = () => {
  const { addNotification } = useNotifications();
  
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSelectingVideo, setIsSelectingVideo] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<RecordingSession[]>([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [showCustomVideo, setShowCustomVideo] = useState(false);
  const [recordingQuality, setRecordingQuality] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const playerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Load saved data from localStorage
  useEffect(() => {
    const savedRecordings = localStorage.getItem('shadowRecordings');
    if (savedRecordings) {
      try {
        const parsed = JSON.parse(savedRecordings).map((rec: any) => ({
          ...rec,
          date: new Date(rec.date)
        }));
        setRecordings(parsed);
      } catch (error) {
        console.error('Error loading recordings:', error);
      }
    }
  }, []);

  // Save recordings to localStorage
  useEffect(() => {
    localStorage.setItem('shadowRecordings', JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopRecording();
    };
  }, []);

  // Audio visualization
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;

    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
  };

  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsSelectingVideo(false);
    setRecordingTime(0);
    setIsRecording(false);
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleCustomVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(customVideoUrl);
    
    if (!videoId) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

         const customVideo: VideoItem = {
       id: `custom_${Date.now()}`,
       title: 'Custom Video',
       videoId: videoId,
       thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
       level: 'intermediate' as const,
       duration: 'Unknown',
       difficulty: 2,
       category: 'Custom',
       accent: 'Unknown',
       speaker: 'Unknown',
       description: 'Custom video for shadow practice'
     };

    handleVideoSelect(customVideo);
    setShowCustomVideo(false);
    setCustomVideoUrl('');
  };

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const startRecording = async () => {
    try {
      if (!selectedVideo) return;
      
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        setIsAnalyzing(true);
        
        // Simulate quality analysis
        const quality = Math.random() * 40 + 60; // 60-100 range
        setRecordingQuality(quality);
        
        setTimeout(() => {
          // Add to recordings list
          const newRecording: RecordingSession = {
            id: Date.now().toString(),
            videoId: selectedVideo.videoId,
            videoTitle: selectedVideo.title,
            recordingUrl: url,
            date: new Date(),
            duration: recordingTime,
            quality: Math.round(quality),
            segments: [] // Will be populated by analysis
          };
          
          setRecordings(prev => [newRecording, ...prev]);
          setIsAnalyzing(false);
          
          // Add notification
          addNotification(createPracticeNotification('shadow', 1));
          
          // Check for achievements
          checkShadowingAchievements(recordings.length + 1, recordingTime);
          
          toast.success(`Recording saved! Quality: ${Math.round(quality)}%`);
          
          // Stop all tracks on the stream
          stream.getTracks().forEach(track => track.stop());
        }, 2000);
      };
      
      // Start recording
      mediaRecorder.start(100); // Record in 100ms chunks
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingQuality(0);
      
      // Start visualization
      drawWaveform();
      
      // Play the video
      if (playerRef.current) {
        playerRef.current.internalPlayer.playVideo();
      }
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Could not access microphone. Please check permissions.');
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

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    
    // Pause the video
    if (playerRef.current) {
      playerRef.current.internalPlayer.pauseVideo();
    }
  };

  const checkShadowingAchievements = (totalRecordings: number, duration: number) => {
    // First recording achievement
    if (totalRecordings === 1) {
      addNotification(createAchievementNotification(
        'Shadow Warrior! 🎭',
        'You\'ve completed your first shadowing session! Great start to improving your speaking skills.',
        '🎭'
      ));
    }

    // Milestone achievements
    if (totalRecordings === 10) {
      addNotification(createAchievementNotification(
        'Shadowing Pro! 🎯',
        'Amazing! 10 shadowing sessions completed. Your pronunciation is getting better!',
        '🎯'
      ));
    } else if (totalRecordings === 25) {
      addNotification(createAchievementNotification(
        'Voice Master! 🎙️',
        'Incredible! 25 shadowing sessions. You\'re developing excellent speaking skills!',
        '🎙️'
      ));
    } else if (totalRecordings === 50) {
      addNotification(createAchievementNotification(
        'Shadow Legend! 👑',
        'Legendary! 50 shadowing sessions completed. You\'re a true language learning champion!',
        '👑'
      ));
    }

    // Long session achievements
    if (duration >= 300) { // 5 minutes
      addNotification(createAchievementNotification(
        'Endurance Speaker! ⏰',
        'Impressive! You\'ve shadowed for 5+ minutes straight. Building that speaking stamina!',
        '⏰'
      ));
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleTimeUpdate = (time: number) => {
    setCurrentVideoTime(time);
  };
  
  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
    toast.success('Recording deleted');
  };

  const downloadRecording = (recording: RecordingSession) => {
    const link = document.createElement('a');
    link.href = recording.recordingUrl;
    link.download = `shadow-${recording.videoTitle}-${new Date(recording.date).toISOString().split('T')[0]}.webm`;
    link.click();
    toast.success('Recording downloaded!');
  };

  const shareRecording = (recording: RecordingSession) => {
    if (navigator.share) {
      navigator.share({
        title: `Shadow Practice: ${recording.videoTitle}`,
        text: `Check out my shadow practice recording!`,
        url: recording.recordingUrl
      });
    } else {
      navigator.clipboard.writeText(recording.recordingUrl);
      toast.success('Recording link copied to clipboard!');
    }
  };

  // Filter videos
  const filteredVideos = sampleVideos.filter(video => {
    const levelMatch = filterLevel === 'all' || video.level === filterLevel;
    const categoryMatch = filterCategory === 'all' || video.category === filterCategory;
    return levelMatch && categoryMatch;
  });

  const categories = ['all', ...Array.from(new Set(sampleVideos.map(v => v.category)))];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  // Calculate stats
  const shadowingStats: ShadowingStats = {
    totalSessions: recordings.length,
    totalMinutes: Math.round(recordings.reduce((sum, rec) => sum + rec.duration, 0) / 60),
    streak: 0, // Would be calculated from dates
    averageQuality: recordings.length > 0 ? 
      Math.round(recordings.reduce((sum, rec) => sum + rec.quality, 0) / recordings.length) : 0,
    completedVideos: Array.from(new Set(recordings.map(rec => rec.videoId))),
    favoriteCategory: 'Daily Life' // Would be calculated from most practiced category
  };

  if (isLoading) {
    return <PageLoadingSkeleton type="phrases" />;
  }

  return (
    <div className="fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Mic className="w-8 h-8 text-purple-600" />
            Shadow Practice
          </h1>
          <p className="text-gray-600">
            Improve your pronunciation and fluency by speaking along with native speakers
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-purple-600">{shadowingStats.totalSessions}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Practice Time</p>
                <p className="text-2xl font-bold text-blue-600">{shadowingStats.totalMinutes}m</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                <p className="text-2xl font-bold text-green-600">{shadowingStats.averageQuality}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Videos Completed</p>
                <p className="text-2xl font-bold text-orange-600">{shadowingStats.completedVideos.length}</p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      
        {isSelectingVideo ? (
          <div className="space-y-6">
            {showTips && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="text-purple-600" size={24} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-purple-800 mb-3">Shadowing Practice Tips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-700">
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>Start by just listening to understand the content and rhythm</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>Speak along simultaneously, matching pace and intonation</span>
                        </li>
                      </ul>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>Focus on mimicking the speaker's rhythm and melody</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>Record yourself to track improvement over time</span>
                        </li>
                      </ul>
                    </div>
                    <button 
                      className="mt-4 text-purple-600 hover:text-purple-800 text-sm font-medium"
                      onClick={() => setShowTips(false)}
                    >
                      Got it, let's start!
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Custom Video */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>
                        {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <LinkIcon size={16} />
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
                    <input
                      type="url"
                      value={customVideoUrl}
                      onChange={(e) => setCustomVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
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
            
            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map(video => (
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
                      <div className="bg-purple-600 rounded-full p-3 transform scale-110">
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
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-purple-500 h-1 rounded-full"
                          style={{ width: `${(video.difficulty / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        Difficulty: {video.difficulty}/5
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <YoutubeIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No videos match your current filters.</p>
                <button
                  onClick={() => {
                    setFilterLevel('all');
                    setFilterCategory('all');
                  }}
                  className="mt-2 text-purple-600 hover:text-purple-700"
                >
                  Clear filters
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
                  stopRecording();
                }}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ChevronLeft size={20} />
                <span>Back to videos</span>
              </button>
              
              {selectedVideo && (
                <div className="text-right">
                  <h2 className="text-xl font-medium text-gray-900">{selectedVideo.title}</h2>
                  <p className="text-sm text-gray-600">{selectedVideo.speaker} • {selectedVideo.accent}</p>
                </div>
              )}
            </div>
            
            {selectedVideo && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video and Recording Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="card overflow-hidden">
                    <VideoPlayer
                      videoId={selectedVideo.videoId}
                      onTimeUpdate={handleTimeUpdate}
                      onPause={() => setIsPaused(true)}
                      onPlay={() => setIsPaused(false)}
                    />
                  </div>
                  
                  {/* Recording Controls */}
                  <div className={clsx(
                    'card p-6 transition-all duration-300',
                    isRecording ? 'ring-2 ring-red-500 bg-red-50' : '',
                    isAnalyzing ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  )}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">
                            {isRecording ? 'Recording in progress...' : 
                             isAnalyzing ? 'Analyzing recording...' :
                             'Shadow Practice'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isRecording ? `Recording time: ${formatTime(recordingTime)}` :
                             isAnalyzing ? 'Please wait while we analyze your recording quality' :
                             'Click record to shadow along with the video'}
                          </p>
                        </div>
                        
                        {isRecording && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-500 font-medium">REC</span>
                          </div>
                        )}
                      </div>

                      {/* Waveform Visualization */}
                      {isRecording && (
                        <div className="bg-gray-900 rounded-lg p-4">
                          <canvas 
                            ref={canvasRef}
                            width={400}
                            height={100}
                            className="w-full h-20 rounded"
                          />
                        </div>
                      )}

                      {/* Analysis Progress */}
                      {isAnalyzing && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="text-blue-700">Analyzing speech quality...</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                      )}

                      {/* Quality Display */}
                      {recordingQuality > 0 && !isRecording && !isAnalyzing && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-green-700 font-medium">Last Recording Quality:</span>
                            <span className="text-green-800 font-bold text-lg">{Math.round(recordingQuality)}%</span>
                          </div>
                          <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${recordingQuality}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Record Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isAnalyzing}
                          className={clsx(
                            'flex items-center gap-3 px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105',
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg',
                            isAnalyzing && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {isRecording ? (
                            <>
                              <StopCircle size={24} />
                              <span>Stop Recording</span>
                            </>
                          ) : (
                            <>
                              <Mic size={24} />
                              <span>Start Shadowing</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recordings Sidebar */}
                <div className="space-y-6">
                  <div className="card">
                    <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Volume2 size={20} />
                        Your Recordings
                      </h3>
                      <p className="text-purple-100 text-sm mt-1">
                        {recordings.length} total recordings
                      </p>
                    </div>
                    
                    <div className="p-4">
                      {recordings.length > 0 ? (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {recordings.map(recording => (
                            <div 
                              key={recording.id} 
                              className={clsx(
                                'p-4 border-2 rounded-lg transition-all',
                                selectedRecording === recording.id 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              )}
                              onClick={() => setSelectedRecording(
                                selectedRecording === recording.id ? null : recording.id
                              )}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {recording.videoTitle}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(recording.date).toLocaleDateString()} • {formatTime(recording.duration)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={clsx(
                                      'text-xs px-2 py-1 rounded-full font-medium',
                                      recording.quality >= 80 ? 'bg-green-100 text-green-800' :
                                      recording.quality >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    )}>
                                      {recording.quality}%
                                    </span>
                                  </div>
                                </div>
                                
                                <EnhancedAudioPlayer
                                  src={recording.recordingUrl}
                                  title=""
                                  compact={true}
                                  showSpeedControl={true}
                                />
                                
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadRecording(recording);
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded"
                                      title="Download recording"
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        shareRecording(recording);
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-green-600 transition-colors rounded"
                                      title="Share recording"
                                    >
                                      <Share2 size={16} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRecording(recording.id);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded"
                                    title="Delete recording"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Volume2 size={32} className="mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600 font-medium">No recordings yet</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Start shadowing to build your practice collection
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShadowPractice;