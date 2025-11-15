import React from 'react';
import { BibleVerseConfig } from '../../types';

interface BibleVersesProps {
  config: BibleVerseConfig;
  setConfig: React.Dispatch<React.SetStateAction<BibleVerseConfig>>;
}

const ControlRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);


const BibleVerses: React.FC<BibleVersesProps> = ({ config, setConfig }) => {

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setConfig(prev => ({...prev, [name]: value}));
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig(prev => ({...prev, backgroundOpacity: parseFloat(e.target.value)}));
  }

  const toggleVisibility = () => {
    setConfig(prev => ({ ...prev, isVisible: !prev.isVisible }));
  };

  return (
    <div className="space-y-4 text-sm">
      <ControlRow label="Verse Text">
        <textarea
          name="text"
          value={config.text}
          onChange={handleValueChange}
          className="w-full h-24 p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"
          placeholder="Enter Bible verse text..."
        />
      </ControlRow>
      <ControlRow label="Reference (e.g., John 3:16)">
        <input
          type="text"
          name="reference"
          value={config.reference}
          onChange={handleValueChange}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500"
          placeholder="John 3:16"
        />
      </ControlRow>
       <button disabled className="w-full py-2 bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Fetch Verse (API Coming Soon)</button>
      
      <div className="grid grid-cols-2 gap-3">
          <ControlRow label="Font Size">
              <select name="fontSize" value={config.fontSize} onChange={handleValueChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md">
                  <option value="text-2xl">Small</option>
                  <option value="text-3xl">Medium</option>
                  <option value="text-4xl">Large</option>
                  <option value="text-5xl">Extra Large</option>
              </select>
          </ControlRow>
           <ControlRow label="Font Family">
              <select name="fontFamily" value={config.fontFamily} onChange={handleValueChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md">
                  <option value="font-sans">Sans-serif</option>
                  <option value="font-serif">Serif</option>
                  <option value="font-mono">Monospace</option>
              </select>
          </ControlRow>
      </div>

       <div className="grid grid-cols-2 gap-3">
          <ControlRow label="Text Color">
                <input type="color" name="textColor" value={config.textColor} onChange={handleColorChange} className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer" />
          </ControlRow>
          <ControlRow label="Text Align">
              <select name="textAlign" value={config.textAlign} onChange={handleValueChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md h-10" disabled={config.animationStyle === 'scroll'}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
              </select>
          </ControlRow>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Background</label>
        <div className="grid grid-cols-3 gap-3">
           <div className="col-span-1">
             <input type="color" name="backgroundColor" value={config.backgroundColor} onChange={handleColorChange} className="w-full h-10 p-1 bg-gray-900 border border-gray-700 rounded-md cursor-pointer" />
           </div>
           <div className="col-span-2 flex items-center">
             <input type="range" min="0" max="1" step="0.05" value={config.backgroundOpacity} onChange={handleOpacityChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
           </div>
        </div>
      </div>

       <div className="grid grid-cols-2 gap-3">
          <ControlRow label="Position">
              <select name="position" value={config.position} onChange={handleValueChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md">
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
              </select>
          </ControlRow>
           <ControlRow label="Animation">
              <select name="animationStyle" value={config.animationStyle} onChange={handleValueChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md">
                  <option value="fade">Fade</option>
                  <option value="slideUp">Slide Up</option>
                  <option value="slideDown">Slide Down</option>
                  <option value="scroll">Scroll (Ticker)</option>
              </select>
          </ControlRow>
      </div>

      <button
        onClick={toggleVisibility}
        className={`w-full py-2.5 rounded-lg font-semibold transition-colors ${
          config.isVisible ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {config.isVisible ? 'Hide Verse' : 'Show Verse'}
      </button>
    </div>
  );
};

export default BibleVerses;
