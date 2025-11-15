import React from 'react';
import { IconYoutube } from '../icons';

const LiveChat: React.FC = () => {
  return (
    <div className="flex flex-col h-48 md:h-64 text-sm">
        <div className="flex-grow p-2 bg-gray-900/50 rounded-md overflow-y-auto space-y-2 scroll-container">
            {/* Chat messages will appear here when wired to a real chat backend */}
        </div>
        <div className="mt-2 flex space-x-2">
            <input type="text" placeholder="Send a message..." className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"/>
            <button className="px-4 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">Send</button>
        </div>
    </div>
  );
};

export default LiveChat;
