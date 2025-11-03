import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '..', 'public', 'bible', 'sw.json');
const outputFile = path.join(__dirname, '..', 'public', 'bible', 'sw.json'); // Overwrite the same file

console.log('Starting Swahili Bible conversion...');

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the input file:', err);
    return;
  }

  console.log('File read successfully. Parsing Swahili text...');

  const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
  const bibleData = {};
  let currentBook = '';
  let currentChapter = '';

  // Regex to find book names (assuming they are alphabetic and on their own line)
  const bookRegex = /^[a-zA-Z\s]+$/;
  // Regex to find chapter numbers (assuming they are numeric and on their own line)
  const chapterRegex = /^\d+$/;
  // Regex to find verses (assuming they start with a number)
  const verseRegex = /^(\d+)\s+(.*)/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if the line is a chapter number
    if (chapterRegex.test(trimmedLine)) {
      currentChapter = trimmedLine;
      if (currentBook && !bibleData[currentBook][currentChapter]) {
        bibleData[currentBook][currentChapter] = {};
      }
      continue;
    }

    // Check if the line is a verse
    const verseMatch = trimmedLine.match(verseRegex);
    if (verseMatch && currentBook && currentChapter) {
      const verseNum = verseMatch[1];
      const verseText = verseMatch[2];
      bibleData[currentBook][currentChapter][verseNum] = verseText;
      continue;
    }

    // Check if the line is a book name (and not a verse that's just a number)
    if (bookRegex.test(trimmedLine) && isNaN(parseInt(trimmedLine))) {
        // This is a simple way to detect a new book. It assumes book names are not just numbers.
        const potentialBookName = trimmedLine.charAt(0).toUpperCase() + trimmedLine.slice(1).toLowerCase();
        if (!bibleData[potentialBookName]) {
            currentBook = potentialBookName;
            bibleData[currentBook] = {};
            currentChapter = ''; // Reset chapter when a new book is found
            console.log(`Processing book: ${currentBook}`);
        }
    }
  }

  if (Object.keys(bibleData).length === 0) {
    console.error('Conversion failed. No books could be parsed. Please check the text format.');
    return;
  }

  console.log(`Parsing complete. Found ${Object.keys(bibleData).length} books.`);
  console.log('Writing to JSON file...');

  fs.writeFile(outputFile, JSON.stringify(bibleData, null, 2), 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Error writing the JSON file:', writeErr);
      return;
    }
    console.log(`Successfully converted and saved the Swahili Bible to ${outputFile}`);
  });
});
