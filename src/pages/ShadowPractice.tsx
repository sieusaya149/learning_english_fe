import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { YoutubeIcon, Mic, StopCircle, Save, Volume2, Info, Trash2 } from 'lucide-react';
import clsx from 'clsx';

// Sample videos
const sampleVideos = [
  {
    id: '1',
    title: 'Daily Conversation: Shopping',
    videoId: 'orL-w2QBiN8',
    thumbnail: 'https://img.youtube.com/vi/orL-w2QBiN8/mqdefault.jpg',
    level: 'beginner',
  },
  {
    id: '2',
    title: 'TED Talk: The Power of Vulnerability',
    videoId: 'X4Qm9cGRub0',
    thumbnail: 'https://img.youtube.com/vi/X4Qm9cGRub0/mqdefault.jpg',
    level: 'advanced',
  },
  {
    id: '3',
    title: 'How to Introduce Yourself in English',
    videoId: '0flkN4jtgCs',
    thumbnail: 'https://img.youtube.com/vi/0flkN4jtgCs/mqdefault.jpg',
    level: 'beginner',
  },
];

interface VideoItem {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  level: string;
}

interface RecordingSession {
  id: string;
  videoId: string;
  recordingUrl: string;
  date: Date;
  duration: number;
}

const ShadowPractice: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSelectingVideo, setIsSelectingVideo] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<RecordingSession[]>([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [showTips, setShowTips] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const playerRef = useRef<any>(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);
  
  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsSelectingVideo(false);
    setRecordingTime(0);
    setIsRecording(false);
  };
  
  const startRecording = async () => {
    try {
      if (!selectedVideo) return;
      
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
        
        // Add to recordings list
        const newRecording: RecordingSession = {
          id: Date.now().toString(),
          videoId: selectedVideo.videoId,
          recordingUrl: url,
          date: new Date(),
          duration: recordingTime,
        };
        
        setRecordings(prev => [newRecording, ...prev]);
        
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
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
    
    // Pause the video
    if (playerRef.current) {
      playerRef.current.internalPlayer.pauseVideo();
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
  };
  
  return (
    <div className="fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Shadowing Practice</h1>
      
      {isSelectingVideo ? (
        <>
          <p className="text-gray-600 mb-6">
            Select a video to practice shadowing. Shadowing is speaking along with the audio to improve your rhythm, intonation, and fluency.
          </p>
          
          {showTips && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-blue-800">Tips for Shadowing</h3>
                  <ul className="mt-2 text-blue-700 list-disc list-inside">
                    <li>Start by just listening to understand the content</li>
                    <li>Then try to speak along with the audio, matching the rhythm and intonation</li>
                    <li>Don't worry about being perfect - focus on the flow and sound</li>
                    <li>Record yourself to track your progress over time</li>
                  </ul>
                  <button 
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => setShowTips(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleVideos.map(video => (
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsSelectingVideo(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <span>Back to videos</span>
            </button>
            
            {selectedVideo && (
              <h2 className="text-xl font-medium text-gray-900">{selectedVideo.title}</h2>
            )}
          </div>
          
          {selectedVideo && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VideoPlayer
                  videoId={selectedVideo.videoId}
                  onTimeUpdate={handleTimeUpdate}
                  onPause={() => setIsPaused(true)}
                  onPlay={() => setIsPaused(false)}
                />
                
                <div className={clsx(
                  'mt-6 p-4 rounded-lg transition-all',
                  isRecording ? 'recording' : 'card'
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        {isRecording ? 'Recording in progress...' : 'Shadow Practice'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isRecording 
                          ? `Recording time: ${formatTime(recordingTime)}` 
                          : 'Click record to shadow along with the video'
                        }
                      </p>
                    </div>
                    
                    {isRecording && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse" />
                        <span className="text-red-500 font-medium">LIVE</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={clsx(
                        'flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors',
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      )}
                      disabled={isPaused && !isRecording}
                    >
                      {isRecording ? (
                        <>
                          <StopCircle size={20} />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic size={20} />
                          <span>Start Shadowing</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="card">
                  <div className="p-4 bg-blue-800 text-white">
                    <h3 className="text-lg font-semibold">Your Recordings</h3>
                  </div>
                  
                  <div className="p-4">
                    {recordings.length > 0 ? (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {recordings.map(recording => (
                          <div key={recording.id} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-sm text-gray-600">
                                {new Date(recording.date).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatTime(recording.duration)}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <audio controls className="w-40 h-8" src={recording.recordingUrl} />
                              
                              <div className="flex gap-1">
                                <button
                                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                  title="Save recording"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                  title="Delete recording"
                                  onClick={() => handleDeleteRecording(recording.id)}
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Volume2 size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">No recordings yet</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Shadow along with the video and your recordings will appear here
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
  );
};

export default ShadowPractice;