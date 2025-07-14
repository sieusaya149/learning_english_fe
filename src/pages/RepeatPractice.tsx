import React, { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptDisplay, { TranscriptLine } from '../components/TranscriptDisplay';
import AudioRecorder from '../components/AudioRecorder';
import { YoutubeIcon, ChevronLeft, ChevronRight, Save, Link } from 'lucide-react';
import clsx from 'clsx';
import {FetchTranscript, FetchVideos, GenerateTranscript, IsExistTranscript, SyncTranscript} from '../utils/apis';
import { GET_videos_v1, GET_transcript_v2, GET_transcript_status, POST_Generate_Transcript } from '../utils/apis';
// Sample data
const sampleVideos = [
  // {
  //   id: '1',
  //   title: 'Daily Conversation: At the Coffee Shop',
  //   videoId: 'qqHPpX4BNrg',
  //   thumbnail: 'https://img.youtube.com/vi/orL-w2QBiN8/mqdefault.jpg',
  //   level: 'beginner',
  // },
  // {
  //   id: '2',
  //   title: 'Business English: Job Interview',
  //   videoId: 'qqHPpX4BNrg',
  //   thumbnail: 'https://img.youtube.com/vi/KukmClH1KoA/mqdefault.jpg',
  //   level: 'intermediate',
  // },
  // {
  //   id: '3',
  //   title: 'Academic Discussion: Climate Change',
  //   videoId: 'qqHPpX4BNrg',
  //   thumbnail: 'https://img.youtube.com/vi/0flkN4jtgCs/mqdefault.jpg',
  //   level: 'advanced',
  // },
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
  url: string;
}

interface RecordingState {
  lineId: string;
  blob?: Blob;
  url?: string;
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

async function FetchTranscriptData(video_url: string) : Promise<any> {
    // Step 1: check if transcript exists
    try {
      console.log('HVH FetchTranscriptData called with video_url:', video_url);
      const isTranscriptExist = await GET_transcript_status(video_url);
      if (!isTranscriptExist) {
        console.log('HVH transcript does not exist');
      }
      else {
        // Step 2: fetch the transcript
        const transcript = await GET_transcript_v2(video_url);
        console.log('HVH fetched transcript:', transcript);
        return JSON.stringify({
          video_url: video_url,
          transcript: transcript["transcript"] || [],
          error :""
        })
      }
    }
    catch (error) {
      console.error('HVH error in FetchTranscriptData:', error);
      throw new Error('Error in FetchTranscriptData');
    }
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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [existingVideos, setExistingVideos] = useState<VideoItem[]>([]); // For future use

  // Default Effect to fetch initial videos
  useEffect(() => {
    GET_videos_v1()
      .then(videos => {
        console.log('HVH fetched videos:', videos);
        videos = videos.map((video: any) => {
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


  useEffect(() => {
    console.log('HVH selectedVideo changed:', selectedVideo);
    // In a real app, you would fetch this based on the selected video
    // if (selectedVideo) {
    //   // step 1: check status transcript, if transcript exists, use it
    //   const isTranscriptExist = await IsExistTranscript(selectedVideo.url);
    //   if()

    //   // Logic getting transcript here
    //   FetchTranscript(selectedVideo.url)
    //     .then(transcript => {
    //       console.log('HVH updated transcript');
    //       setActiveTranscript(transcript);
    //     })
    // }


   if(selectedVideo) {
      console.log('HVH Fetching transcript for selected video:', selectedVideo.url);
      FetchTranscriptData(selectedVideo.url)
        .then(result => {
          const data = JSON.parse(result);
          if (data.error) {
            console.error('HVH error fetching transcript:', data.error);
            setActiveTranscript([]);
          } else {
            console.log('HVH fetched transcript:', data.transcript);
            setActiveTranscript(data.transcript);
          }
        })
        .catch(error => {
          console.error('HVH error fetching transcript:', error);
          setActiveTranscript([]);
        }
      );
    }
    // Reset state when changing video
    setCurrentTime(0);
    setActiveLineId(undefined);
    setRecordings({});
    setCompletedLines([]);
    setSeekTime(null);
  }, [selectedVideo]);


  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsSelectingVideo(false);
    // Reset state when selecting a new video
    setRecordings({});
    setCompletedLines([]);
    setActiveLineId(undefined);
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
  
    POST_Generate_Transcript(youtubeUrl).then(result => {
      console.log('HVH generated transcript for custom video:', result);
    }).catch(error => {
      console.error('HVH error generating transcript for custom video:', error);
    })

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