import React from 'react';
import { LyricsConfig, Song } from '../types';

interface LyricsDisplayProps {
  config: LyricsConfig;
  setConfig: React.Dispatch<React.SetStateAction<LyricsConfig>>;
}

const songLibrary: Song[] = [
  { 
    title: "Amazing Grace", 
    verses: [
      "Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.",
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.",
      "Through many dangers, toils, and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home."
    ]
  },
  {
    title: "How Great Thou Art",
    verses: [
      "O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made,\nI see the stars, I hear the rolling thunder,\nThy power throughout the universe displayed",
      "Then sings my soul, my Savior God, to Thee,\nHow great Thou art, how great Thou art!\nThen sings my soul, my Savior God, to Thee,\nHow great Thou art, how great Thou art!",
      "And when I think that God, His Son not sparing,\nSent Him to die, I scarce can take it in;\nThat on the cross, my burden gladly bearing,\nHe bled and died to take away my sin."
    ]
  }
];

const ControlRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ config, setConfig }) => {
  const lyricsText = React.useMemo(() => {
    if (!config.song) return '';
    return config.song.verses.join('\n\n');
  }, [config.song]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setConfig(prev => {
      const verses = prev.song?.verses || [];
      if (!title && verses.length === 0) {
        return { ...prev, song: null, verseIndex: 0 };
      }
      return {
        ...prev,
        song: { title: title || 'Untitled Song', verses },
        verseIndex: 0,
      };
    });
  };

  const handleLyricsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const parts = text.split(/\n{2,}/);
    const verses = parts.map(p => p.trim()).filter(p => p.length > 0);
    setConfig(prev => {
      const title = prev.song?.title || 'Untitled Song';
      if (verses.length === 0 && !title) {
        return { ...prev, song: null, verseIndex: 0 };
      }
      if (verses.length === 0) {
        return { ...prev, song: prev.song, verseIndex: 0 };
      }
      return {
        ...prev,
        song: { title, verses },
        verseIndex: 0,
      };
    });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setConfig(prev => ({ ...prev, scale: value }));
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({...prev, [name]: value}));
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({...prev, backgroundOpacity: parseFloat(e.target.value)}));
  };

  const navigateVerse = (direction: 'next' | 'prev') => {
    if (!config.song) return;
    setConfig(prev => {
      const newIndex = direction === 'next' ? prev.verseIndex + 1 : prev.verseIndex - 1;
      if (newIndex >= 0 && newIndex < (prev.song?.verses.length || 0)) {
        return { ...prev, verseIndex: newIndex };
      }
      return prev;
    });
  };

  const toggleVisibility = () => {
    setConfig(prev => ({ ...prev, isVisible: !prev.isVisible }));
  };

  return (
    <div className="space-y-4 text-sm">
      <ControlRow label="Song Title">
        <input
          type="text"
          value={config.song?.title || ''}
          onChange={handleTitleChange}
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2"
          placeholder="e.g. Amazing Grace"
        />
      </ControlRow>

      <ControlRow label="Lyrics (separate verses with a blank line)">
        <textarea
          value={lyricsText}
          onChange={handleLyricsChange}
          className="w-full h-32 bg-gray-900 border border-gray-700 text-white rounded-lg p-2 resize-y"
          placeholder="Type lyrics here. Separate each verse with a blank line."
        />
      </ControlRow>

      {config.song && (
        <ControlRow label="Verse Preview">
          <div className="p-2 bg-gray-900 border border-gray-700 rounded-md h-24 overflow-y-auto scroll-container">
            {config.song.verses.map((verse, index) => (
              <p key={index} className={`p-1 rounded cursor-pointer ${config.verseIndex === index ? 'bg-blue-900/50' : 'hover:bg-gray-700'}`} onClick={() => setConfig(prev => ({...prev, verseIndex: index}))}>
                Verse {index + 1}
              </p>
            ))}
          </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Size</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min={0.5}
              max={1.2}
              step={0.05}
              value={config.scale ?? 1}
              onChange={handleScaleChange}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.round((config.scale ?? 1) * 100)}%
            </span>
          </div>
        </div>
        </ControlRow>
      )}

      <div className="grid grid-cols-2 gap-3">
        <ControlRow label="Font Size">
          <select name="fontSize" value={config.fontSize} onChange={handleValueChange} className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md">
            <option value="text-3xl">Small</option>
            <option value="text-4xl">Medium</option>
            <option value="text-5xl">Large</option>
            <option value="text-6xl">Extra Large</option>
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
        <div className="grid grid-cols-2 gap-3">
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
      
      <div className="flex items-center justify-between">
        <button 
          onClick={toggleVisibility}
          disabled={!config.song}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors text-base ${
            config.isVisible ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-500'
          } disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          {config.isVisible ? 'Hide Lyrics' : 'Show Lyrics'}
        </button>
        <div className="flex space-x-2">
          <button onClick={() => navigateVerse('prev')} disabled={!config.song || config.verseIndex === 0} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold">←</button>
          <button onClick={() => navigateVerse('next')} disabled={!config.song || config.verseIndex >= (config.song?.verses.length || 0) - 1} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold">→</button>
        </div>
      </div>
    </div>
  );
};

export default LyricsDisplay;
