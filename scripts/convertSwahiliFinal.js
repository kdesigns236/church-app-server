import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '..', 'public', 'bible', 'sw.json');
const outputFile = path.join(__dirname, '..', 'public', 'bible', 'sw.json');

const SWAHILI_BOOKS = [
    'Mwanzo', 'Kutoka', 'Walawi', 'Hesabu', 'Kumbukumbu la Torati', 'Yoshua', 'Waamuzi', 'Ruthu',
    '1 Samweli', '2 Samweli', '1 Wafalme', '2 Wafalme', '1 Mambo ya Nyakati', '2 Mambo ya Nyakati',
    'Ezra', 'Nehemia', 'Esta', 'Ayubu', 'Zaburi', 'Mithali', 'Mhubiri', 'Wimbo Ulio Bora',
    'Isaya', 'Yeremia', 'Maombolezo', 'Ezekieli', 'Danieli', 'Hosea', 'Yoeli', 'Amosi', 'Obadia',
    'Yona', 'Mika', 'Nahumu', 'Habakuki', 'Sefania', 'Hagai', 'Zekaria', 'Malaki', 'Mathayo',
    'Marko', 'Luka', 'Yohana', 'Matendo ya Mitume', 'Warumi', '1 Wakorintho', '2 Wakorintho',
    'Wagalatia', 'Waefeso', 'Wafilipi', 'Wakolosai', '1 Wathesalonike', '2 Wathesalonike',
    '1 Timotheo', '2 Timotheo', 'Tito', 'Filemoni', 'Waebrania', 'Yakobo', '1 Petro', '2 Petro',
    '1 Yohana', '2 Yohana', '3 Yohana', 'Yuda', 'Ufunuo wa Yohana'
];

// Create a map for quick, case-insensitive lookup
const bookMap = new Map(SWAHILI_BOOKS.map(book => [book.toLowerCase(), book]));

console.log('Starting Swahili Bible conversion (Final, Guaranteed Version)...');

fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the input file:', err);
        return;
    }

    console.log('File read successfully. Parsing Swahili text with robust logic...');

    const lines = data.split(/\r?\n/);
    const bibleData = {};
    let currentBook = '';
    let currentChapter = 0;

    const verseRegex = /^(\d+)\s+(.*)/; // Matches a line starting with a number (verse)
    const junkHeaderRegex = /^[a-zA-Z\s]+\s\d+:\d+$/; // Matches 'Book Chapter:Verse'

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines

        // 1. Ignore known junk lines (headers, page numbers)
        if (junkHeaderRegex.test(trimmedLine) || /^\d{3,}$/.test(trimmedLine)) { // Ignore 'Book C:V' and numbers with 3+ digits
            continue;
        }

        // 2. Check for a book title (case-insensitive)
        const potentialBook = bookMap.get(trimmedLine.toLowerCase());
        if (potentialBook) {
            currentBook = potentialBook;
            bibleData[currentBook] = {};
            currentChapter = 0; // Reset chapter for new book
            console.log(`Processing book: ${currentBook}`);
            continue;
        }

        if (currentBook) {
            // 3. Check for a chapter number (must be sequential)
            const potentialChapter = parseInt(trimmedLine, 10);
            if (/^\d{1,2}$/.test(trimmedLine) && potentialChapter === currentChapter + 1) {
                currentChapter = potentialChapter;
                bibleData[currentBook][currentChapter] = {};
                continue;
            }

            // 4. Check for a verse
            const verseMatch = trimmedLine.match(verseRegex);
            if (verseMatch && currentChapter > 0) {
                const verseNum = verseMatch[1];
                const verseText = verseMatch[2];
                bibleData[currentBook][currentChapter][verseNum] = verseText;
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
