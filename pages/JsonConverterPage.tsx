import React, { useState } from 'react';

const ConverterSection: React.FC<{ language: 'English' | 'Swahili' }> = ({ language }) => {
  const [rawText, setRawText] = useState('');
  const [bookName, setBookName] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [error, setError] = useState('');

  const handleConvert = () => {
    if (!rawText.trim() || !bookName.trim()) {
      setError('Please provide both a book name and the raw text.');
      return;
    }

    setError('');
    setJsonOutput('');

    try {
      const lines = rawText.split(/\r?\n/).filter(line => line.trim() !== '');
      const bookData: Record<string, Record<string, string>> = {};
      let currentChapter = '';

      for (const line of lines) {
        const chapterMatch = line.match(/^(?:Chapter\s+)?(\d+)$/i);
        if (chapterMatch) {
          currentChapter = chapterMatch[1];
          bookData[currentChapter] = {};
          continue;
        }

        const verseMatch = line.match(/^(\d+)(?:[:.]\s*)?(.*)/);
        if (verseMatch && currentChapter) {
          const verseNum = verseMatch[1];
          const verseText = verseMatch[2].trim();
          if (verseText) {
            bookData[currentChapter][verseNum] = verseText;
          }
        }
      }

      if (Object.keys(bookData).length === 0) {
        setError('Could not find any chapters or verses. Please check the text format.');
        return;
      }

      const finalJson = {
        [bookName.trim()]: bookData
      };

      setJsonOutput(JSON.stringify(finalJson, null, 2));
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred during conversion.');
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary dark:text-white mb-4">{language} Converter</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`bookName-${language}`} className="block text-sm font-medium text-gray-700 dark:text-gray-200">Book Name (e.g., {language === 'English' ? 'Genesis' : 'Mwanzo'})</label>
          <input
            type="text"
            id={`bookName-${language}`}
            value={bookName}
            onChange={e => setBookName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
          />
          <label htmlFor={`rawText-${language}`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4">Paste Plain Text Here</label>
          <textarea
            id={`rawText-${language}`}
            rows={15}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary font-mono"
            placeholder={`Chapter 1\n1 In the beginning...\n2 The earth was...`}
          />
        </div>
        <div>
          <label htmlFor={`jsonOutput-${language}`} className="block text-sm font-medium text-gray-700 dark:text-gray-200">Generated JSON Output</label>
          <textarea
            id={`jsonOutput-${language}`}
            rows={15}
            readOnly
            value={jsonOutput}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-mono"
            placeholder={`Your generated JSON for ${language} will appear here.`}
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleConvert}
          className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
        >
          Convert to JSON
        </button>
      </div>
    </div>
  );
};

const JsonConverterPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-primary dark:text-white mb-2 text-center">Bible Text to JSON Converter</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          Paste the plain text for a single book of the Bible below. The tool expects chapter numbers on their own line (e.g., "Chapter 1" or "1") and each verse to start with its number (e.g., "1:1 ..." or "1 ...").
        </p>
        <div className="space-y-8">
          <ConverterSection language="English" />
          <ConverterSection language="Swahili" />
        </div>
      </div>
    </div>
  );
};

export default JsonConverterPage;
