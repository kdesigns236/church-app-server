import React from 'react';
import { LowerThirdConfig } from '../../types';

interface LowerThirdsProps {
  config: LowerThirdConfig;
  setConfig: React.Dispatch<React.SetStateAction<LowerThirdConfig>>;
  replayAnimation: () => void;
}

const LowerThirds: React.FC<LowerThirdsProps> = ({ config, setConfig, replayAnimation }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = () => {
     if (config.isVisible) {
        setConfig(prev => ({ ...prev, isVisible: false }));
     } else {
        replayAnimation();
     }
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-400">Professional Lower Third</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Top Line (Red Bar)</label>
            <input 
              type="text" 
              name="topText"
              value={config.topText}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Bottom Line (White Bar)</label>
            <input 
              type="text" 
              name="mainText"
              value={config.mainText}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Icon (Emoji)</label>
            <input 
              type="text" 
              name="logoIcon"
              value={config.logoIcon}
              onChange={handleInputChange}
              maxLength={2}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Accent Color</label>
              <input 
                type="color" 
                name="accentColor"
                value={config.accentColor}
                onChange={handleInputChange}
                className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Main Bar Color</label>
              <input 
                type="color" 
                name="mainBarColor"
                value={config.mainBarColor}
                onChange={handleInputChange}
                className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <button 
            onClick={toggleVisibility}
            className={`w-full px-4 py-2 rounded-md transition-colors font-semibold ${
              config.isVisible ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {config.isVisible ? 'Hide' : 'Show'}
          </button>
          <button 
            onClick={replayAnimation}
            disabled={!config.isVisible}
            className="w-full px-4 py-2 rounded-md transition-colors font-semibold bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Replay Animation
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowerThirds;
