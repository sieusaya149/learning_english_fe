import React, { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptDisplay, { TranscriptLine } from '../components/TranscriptDisplay';
import AudioRecorder from '../components/AudioRecorder';
import { YoutubeIcon, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../supabase/SupabaseClient';

async function FetchTranscript(video_url: string): Promise<any> {
  // call edge function to fetch transcript
  const { data, error } = await supabase.functions.invoke('get-transcript', {
    method: 'POST',
    body: JSON.stringify({ "video_url": video_url }),
  });

  if (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch transcript');
  }
  console.log('Transcript data:', data);
  return data;
}

// Sample data
const sampleVideos = [
  {
    id: '1',
    title: 'Daily Conversation: At the Coffee Shop',
    videoId: 'qqHPpX4BNrg',
    thumbnail: 'https://img.youtube.com/vi/orL-w2QBiN8/mqdefault.jpg',
    level: 'beginner',
  },
  {
    id: '2',
    title: 'Business English: Job Interview',
    videoId: 'qqHPpX4BNrg',
    thumbnail: 'https://img.youtube.com/vi/KukmClH1KoA/mqdefault.jpg',
    level: 'intermediate',
  },
  {
    id: '3',
    title: 'Academic Discussion: Climate Change',
    videoId: 'qqHPpX4BNrg',
    thumbnail: 'https://img.youtube.com/vi/0flkN4jtgCs/mqdefault.jpg',
    level: 'advanced',
  },
];

// Sample transcript
// const sampleTranscript: TranscriptLine[] = [
//   { id: '1', startTime: 5, endTime: 8, text: "Hi, I'd like to order a coffee please.", speaker: 'Customer' },
//   { id: '2', startTime: 9, endTime: 12, text: 'Sure, what would you like?', speaker: 'Barista' },
//   { id: '3', startTime: 13, endTime: 17, text: "I'll have a medium latte with oat milk, please.", speaker: 'Customer' },
//   { id: '4', startTime: 18, endTime: 22, text: 'Would you like anything else with that?', speaker: 'Barista' },
//   { id: '5', startTime: 23, endTime: 28, text: 'Yes, can I also get a chocolate croissant?', speaker: 'Customer' },
//   { id: '6', startTime: 29, endTime: 32, text: 'Of course. That will be $8.50.', speaker: 'Barista' },
//   { id: '7', startTime: 33, endTime: 37, text: 'Here you go. Do you have a rewards card?', speaker: 'Customer' },
//   { id: '8', startTime: 38, endTime: 45, text: 'We do! Would you like to sign up? You get a free drink after purchasing 10.', speaker: 'Barista' },
//   { id: '9', startTime: 46, endTime: 50, text: "That sounds great. I'll sign up for one.", speaker: 'Customer' },
//   { id: '10', startTime: 51, endTime: 55, text: "Excellent. I'll just need your name and email address.", speaker: 'Barista' },
// ];

interface VideoItem {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface RecordingState {
  lineId: string;
  blob?: Blob;
  url?: string;
}

const RepeatPractice: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(true);
  const [isSelectingVideo, setIsSelectingVideo] = useState(true);
  const [recordings, setRecordings] = useState<Record<string, RecordingState>>({});
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptLine[]>([]);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  
  useEffect(() => {
    console.log('HVH selectedVideo changed:', selectedVideo);
    // In a real app, you would fetch this based on the selected video
    if (selectedVideo) {
      // Logic getting transcript here
      FetchTranscript("https://www.youtube.com/watch?v=qqHPpX4BNrg")
        .then(transcript => {
          console.log('HVH updated transcript');
          setActiveTranscript(transcript);
        })
    }
  }, [selectedVideo]);


  useEffect(() => {
    
  }, [isPaused])
  
  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsSelectingVideo(false);
    // Reset state when selecting a new video
    setRecordings({});
    setCompletedLines([]);
    setActiveLineId(undefined);
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
                      <p className="text-lg text-gray-900">{currentLineContent || 'Select a line from the transcript'}</p>
                    </div>
                    
                    {activeLineId && (
                      <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        label="Repeat the phrase"
                        maxDuration={10}
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <TranscriptDisplay
                    transcript={activeTranscript}
                    currentTime={currentTime}
                    onLineClick={handleLineClick}
                    activeLineId={activeLineId}
                  />
                  
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