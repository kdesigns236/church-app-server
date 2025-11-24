import React, { useState } from 'react';
import { IconRecord } from '../icons';

const RecordingControls: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  
  return (
    <div className="flex items-center justify-between text-sm rounded-xl bg-black/40 backdrop-blur-sm px-3 py-2 border border-white/10 shadow-[0_0_18px_rgba(15,23,42,0.75)]">
      <div className="flex items-center space-x-2">
        <div className="relative w-7 h-7 flex items-center justify-center rounded-full bg-black/60">
          <IconRecord
            className={`w-3.5 h-3.5 ${
              isRecording
                ? 'text-red-400 animate-pulse drop-shadow-[0_0_14px_rgba(248,113,113,0.95)]'
                : 'text-gray-400'
            }`}
          />
        </div>
        <span className="text-gray-100">
          {isRecording ? 'Recording…' : 'Ready to record'}
        </span>
      </div>
      <button 
        onClick={() => setIsRecording(prev => !prev)}
        className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
          isRecording
            ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_18px_rgba(248,113,113,0.9)] hover:shadow-[0_0_24px_rgba(248,113,113,1)]'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}>
        {isRecording ? 'Stop' : 'Start Recording'}
      </button>
    </div>
  );
};

export default RecordingControls;
