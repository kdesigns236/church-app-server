import React from 'react';
import { IconYoutube, IconFacebook } from '../icons';

const StreamStats: React.FC = () => {
  return (
    <div className="space-y-3 text-sm text-gray-300">
        <div className="flex justify-between p-2 bg-gray-900/50 rounded-md">
            <span>Status:</span>
            <span className="font-bold text-gray-400">-</span>
        </div>
        <div className="flex justify-between p-2 bg-gray-900/50 rounded-md">
            <span>Bitrate:</span>
            <span className="font-mono text-gray-400">0 kbps</span>
        </div>
         <div className="flex justify-between p-2 bg-gray-900/50 rounded-md">
            <span>Dropped Frames:</span>
            <span className="font-mono text-gray-400">0 (0.0%)</span>
        </div>
        <div className="flex justify-between p-2 bg-gray-900/50 rounded-md items-center">
            <IconYoutube className="w-5 h-5 text-red-500" />
            <span>Viewers:</span>
            <span className="font-mono text-gray-400">0</span>
        </div>
         <div className="flex justify-between p-2 bg-gray-900/50 rounded-md items-center">
            <IconFacebook className="w-5 h-5 text-blue-500" />
            <span>Viewers:</span>
            <span className="font-mono text-gray-400">0</span>
        </div>
    </div>
  );
};

export default StreamStats;
