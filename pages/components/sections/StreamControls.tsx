import React, { useState } from 'react';
import { IconYoutube, IconFacebook } from '../icons';

interface StreamControlsProps {
    isLive: boolean;
    setIsLive: (isLive: boolean) => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({ isLive, setIsLive }) => {
  const [streamToYoutube, setStreamToYoutube] = useState(true);
  const [streamToFacebook, setStreamToFacebook] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input type="checkbox" checked={streamToYoutube} onChange={() => setStreamToYoutube(p => !p)} className="form-checkbox h-5 w-5 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500" />
          <div className="flex items-center space-x-2">
            <IconYoutube className="w-6 h-6 text-red-500" />
            <span className="text-gray-200">Stream to YouTube</span>
          </div>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input type="checkbox" checked={streamToFacebook} onChange={() => setStreamToFacebook(p => !p)} className="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" />
          <div className="flex items-center space-x-2">
            <IconFacebook className="w-6 h-6 text-blue-500" />
            <span className="text-gray-200">Stream to Facebook</span>
          </div>
        </label>
      </div>
      <button 
        onClick={() => setIsLive(prev => !prev)}
        className={`w-full py-3 rounded-lg font-bold text-lg transition-all duration-300 transform active:scale-95 ${
          isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        }
        ${!streamToYoutube && !streamToFacebook ? 'bg-gray-600 cursor-not-allowed hover:bg-gray-600' : ''}`}
        disabled={!streamToYoutube && !streamToFacebook}
      >
        {isLive ? 'STOP STREAM' : 'GO LIVE'}
      </button>
    </div>
  );
};

export default StreamControls;
