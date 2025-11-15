import React from 'react';
import { IconSettings, IconVideo } from './icons';


interface ConnectProps {
  onSelectRole: (role: 'controller' | 'camera') => void;
}


const Connect: React.FC<ConnectProps> = ({ onSelectRole }) => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-[#1a1a1a] text-white p-4 font-sans">
      <div className="text-center bg-[#1e1e1e] p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-center space-x-4 mb-6">
           <IconSettings className="w-12 h-12 text-blue-500" />
           <h1 className="text-3xl font-bold">Pro Stream Client</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Choose how you want to use this device.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => onSelectRole('controller')}
            className="group flex items-center justify-center w-full text-center py-4 px-4 bg-blue-600 rounded-lg hover:bg-blue-500 transition-all duration-300 font-semibold text-lg"
          >
            <IconSettings className="w-6 h-6 mr-3 transition-transform group-hover:rotate-12" />
            Continue as Controller
          </button>
           <button
            onClick={() => onSelectRole('camera')}
            className="group flex items-center justify-center w-full text-center py-4 px-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-300 font-semibold text-lg"
          >
            <IconVideo className="w-6 h-6 mr-3 transition-transform group-hover:scale-110" />
            Continue as Camera
          </button>
        </div>
         <p className="text-xs text-gray-600 mt-8">
            Note: The 'Go Live' display page is a separate application. You can simulate it by adding <code className="bg-black px-1 rounded">?role=display</code> to the URL in another tab.
        </p>
      </div>
    </div>
  );
};


export default Connect;
