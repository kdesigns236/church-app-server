import React from 'react';
import { BibleVerseConfig } from '../types';

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

type Language = 'en' | 'sw';

const BibleVerses: React.FC<BibleVersesProps> = ({ config, setConfig }) => {

  const [isFetching, setIsFetching] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [language, setLanguage] = React.useState<Language>('en');

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setConfig(prev => ({ ...prev, scale: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({...prev, [name]: value}));
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({...prev, backgroundOpacity: parseFloat(e.target.value)}));
  };

  const handleFetchVerse = async () => {
    const reference = (config.reference || '').trim();
    if (!reference) {
      setFetchError('Please enter a Bible reference first, for example John 3:16.');
      return;
    }

    // Parse reference like "John 3:16" or "Yohana 3:16"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) {
      setFetchError('Use format Book Chapter:Verse, e.g. John 3:16 or Yohana 3:16.');
      return;
    }

    const rawBook = match[1].trim();
    const chapter = match[2];
    const verse = match[3];

    try {
      setIsFetching(true);
      setFetchError(null);

      // Determine where to load Bible JSON from.
      // If running inside the standalone Pro Stream client on port 5173,
      // the Bible files live in the main app on port 3002.
      const currentOrigin = window.location.origin;
      const isStandaloneClient = window.location.port === '5173';
      const bibleBase = isStandaloneClient ? currentOrigin.replace(':5173', ':3002') : currentOrigin;

      if (language === 'en') {
        // Old English format: { [bookName]: { [chapter]: { [verse]: text } } }
        const response = await fetch(`${bibleBase}/bible/en.json`);
        if (!response.ok) {
          throw new Error('Failed to load English Bible data.');
        }
        const data = await response.json() as Record<string, Record<string, Record<string, string>>>;

        const normalizedTarget = rawBook.toLowerCase().replace(/\s+/g, '');
        const bookKey = Object.keys(data).find(key => key.toLowerCase().replace(/\s+/g, '') === normalizedTarget);

        if (!bookKey) {
          throw new Error('Book not found in English Bible data.');
        }

        const chapterData = data[bookKey]?.[chapter];
        const verseText = chapterData?.[verse];

        if (!verseText) {
          throw new Error('Verse not found in English Bible data.');
        }

        setConfig(prev => ({
          ...prev,
          text: verseText.trim(),
          reference: `${bookKey} ${chapter}:${verse}`,
        }));
      } else {
        // Swahili format: { BIBLEBOOK: [ { book_name, CHAPTER: [ { chapter_number, VERSES: [ { verse_number, verse_text } ] } ] } ] }
        const response = await fetch(`${bibleBase}/bible/sw.json`);
        if (!response.ok) {
          throw new Error('Failed to load Swahili Bible data.');
        }
        const data = await response.json() as { BIBLEBOOK: { book_name: string; CHAPTER: { chapter_number: string; VERSES: { verse_number: string; verse_text: string }[] }[] }[] };

        const normalizedTarget = rawBook.toLowerCase().replace(/\s+/g, '');
        const book = data.BIBLEBOOK.find(b => b.book_name.toLowerCase().replace(/\s+/g, '') === normalizedTarget);

        if (!book) {
          throw new Error('Book not found in Swahili Bible data.');
        }

        const chapterObj = book.CHAPTER.find(ch => ch.chapter_number === chapter);
        const verseObj = chapterObj?.VERSES.find(v => v.verse_number === verse);

        if (!chapterObj || !verseObj) {
          throw new Error('Verse not found in Swahili Bible data.');
        }

        setConfig(prev => ({
          ...prev,
          text: verseObj.verse_text.trim(),
          reference: `${book.book_name} ${chapter}:${verse}`,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch verse from local Bible data', error);
      setFetchError('Could not fetch that verse. Check the book name and format (e.g., John 3:16 or Yohana 3:16) and try again.');
    } finally {
      setIsFetching(false);
    }
  };

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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Language</span>
        <div className="inline-flex rounded-md overflow-hidden border border-gray-700">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-xs ${language === 'en' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-300'}`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('sw')}
            className={`px-2 py-1 text-xs ${language === 'sw' ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-300'}`}
          >
            Kiswahili
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleFetchVerse}
        disabled={isFetching}
        className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:opacity-70 rounded-md transition-colors"
      >
        {isFetching ? 'Fetching Verse…' : 'Fetch Verse'}
      </button>
      {fetchError && (
        <p className="mt-1 text-xs text-red-400">
          {fetchError}
        </p>
      )}
      
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
