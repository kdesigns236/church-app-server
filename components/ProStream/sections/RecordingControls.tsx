import React, { useState } from 'react';
import { IconRecord } from '../icons';

const RecordingControls: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center space-x-2">
        <IconRecord className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
        <span>{isRecording ? 'Recording...' : 'Ready to record'}</span>
      </div>
      <button 
        onClick={() => setIsRecording(prev => !prev)}
        className={`px-4 py-2 rounded-md transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
        {isRecording ? 'Stop' : 'Start Recording'}
      </button>
    </div>
  );
};

export default RecordingControls;
