import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface TranscriptLine {
  id: string;
  start: number;
  end: number;
  content: string;
  speaker?: string;
}

interface TranscriptDisplayProps {
  transcript: TranscriptLine[];
  currentTime: number;
  onLineClick: (line: TranscriptLine) => void;
  activeLineId?: string;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  currentTime,
  onLineClick,
  activeLineId,
}) => {
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine which line is active based on current video time
  const activeLine = transcript.find(
    line => currentTime >= line.start && currentTime <= line.end
  );

  // |---------------------------|  <-- container top
  // |                           |
  // |                           |
  // |       <-- center line      |   <--- container height / 2
  // |                           |
  // |                           |
  // |---------------------------|  <-- container bottom

  // Auto-scroll to the active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && activeLine) {
      containerRef.current.scrollTo({
        top: activeLineRef.current.offsetTop - containerRef.current.offsetHeight/ 2 - 60, // Center the active line
        behavior: 'smooth',
      });
    }
  }, [activeLine?.id]);

  return (
    <div className="card">
      <div className="p-4 bg-blue-800 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Transcript</h2>
        <span className="text-sm bg-blue-700 px-2 py-1 rounded">
          {transcript.length} lines
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="max-h-[400px] overflow-y-auto"
      >
        {transcript.map(line => {
          const isActive = activeLine?.id === line.id || activeLineId === line.id;
          
          return (
            <div
              key={line.id}
              ref={isActive ? activeLineRef : null}
              className={clsx(
                'transcript-line cursor-pointer',
                isActive && 'active'
              )}
              onClick={() => onLineClick(line)}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-gray-800">{line.content}</p>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {formatTime(line.start)}
                </div>
              </div>
              
              {line.speaker && (
                <div className="text-sm text-gray-500 mt-1">
                  {line.speaker}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default TranscriptDisplay;