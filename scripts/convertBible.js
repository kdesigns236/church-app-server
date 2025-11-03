import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '..', 'public', 'bible', 'en.json');
const outputFile = path.join(__dirname, '..', 'public', 'bible', 'en.json'); // Overwrite the same file

console.log('Starting Bible conversion...');

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the input file:', err);
    return;
  }

  console.log('File read successfully. Parsing text...');

  const lines = data.split(/\r?\n/);
  const bibleData = {};
  let bookCount = 0;

  // Regex to capture Book name, chapter, verse, and text
  // Handles book names with spaces or numbers (e.g., 1 Samuel)
  const verseRegex = /^([1-3]?\s?[a-zA-Z]+)\s(\d+):(\d+)\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(verseRegex);

    if (match) {
      const book = match[1].trim();
      const chapter = match[2];
      const verse = match[3];
      const text = match[4].trim();

      if (!bibleData[book]) {
        bibleData[book] = {};
        bookCount++;
        console.log(`Processing book: ${book}`);
      }
      if (!bibleData[book][chapter]) {
        bibleData[book][chapter] = {};
      }
      bibleData[book][chapter][verse] = text;
    }
  }

  if (Object.keys(bibleData).length === 0) {
    console.error('Conversion failed. No verses could be parsed. Please check the text format.');
    console.error('The script expects each line to be in the format: Book Chapter:Verse Text (e.g., Genesis 1:1 In the beginning...)');
    return;
  }

  console.log(`Parsing complete. Found ${bookCount} books.`);
  console.log('Writing to JSON file...');

  fs.writeFile(outputFile, JSON.stringify(bibleData, null, 2), 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Error writing the JSON file:', writeErr);
      return;
    }
    console.log(`Successfully converted and saved the Bible to ${outputFile}`);
    console.log('You can now delete the script file if you wish: scripts/convertBible.js');
  });
});
