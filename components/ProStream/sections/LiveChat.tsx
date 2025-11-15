import React from 'react';
import { IconYoutube } from '../icons';

const LiveChat: React.FC = () => {
  return (
    <div className="flex flex-col h-48 md:h-64 text-sm">
        <div className="flex-grow p-2 bg-gray-900/50 rounded-md overflow-y-auto space-y-2">
            <div className="flex items-start space-x-2">
                <IconYoutube className="w-4 h-4 text-red-500 flex-shrink-0 mt-1"/>
                <div>
                    <span className="font-bold text-blue-400">John D.: </span>
                    <span>This is a great sermon!</span>
                </div>
            </div>
             <div className="flex items-start space-x-2">
                <span className="font-bold text-green-400">Jane S.: </span>
                <span>Amen! 🙏</span>
            </div>
        </div>
        <div className="mt-2 flex space-x-2">
            <input type="text" placeholder="Send a message..." className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"/>
            <button className="px-4 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">Send</button>
        </div>
    </div>
  );
};

export default LiveChat;
