import React, { useState, useEffect } from 'react';
import { BibleIcon, ArrowLeftIcon } from '../constants/icons';
import { useNavigate } from 'react-router-dom';

type Language = 'en' | 'sw';

// New format (sw.json)
interface Verse {
  verse_number: string;
  verse_text: string;
}

interface Chapter {
  chapter_number: string;
  VERSES: Verse[];
}

interface BibleBook {
  book_number: string;
  book_name: string;
  CHAPTER: Chapter[];
}

interface NewBibleData {
  BIBLEBOOK: BibleBook[];
}

// Old format (en.json)
type OldBibleData = Record<string, Record<string, Record<string, string>>>;

// Union type
type BibleData = NewBibleData | OldBibleData;

// Helper to check if data is new format
function isNewFormat(data: BibleData): data is NewBibleData {
  return 'BIBLEBOOK' in data;
}

const BiblePage: React.FC = () => {
    const [language, setLanguage] = useState<Language>('en');
    const [bible, setBible] = useState<BibleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [books, setBooks] = useState<{name: string, number: string}[]>([]);
    const [selectedBook, setSelectedBook] = useState<{name: string, number: string} | null>(null);
    
    const [chapters, setChapters] = useState<string[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<string>('');
    
    const [verses, setVerses] = useState<{number: string, text: string}[]>([]);

    const navigate = useNavigate();

    // Initial data load
    useEffect(() => {
        // This effect runs once on component mount to load the default language Bible
        fetch(`/bible/en.json`)
            .then(res => res.json())
            .then((data: BibleData) => {
                setBible(data);
                
                if (isNewFormat(data)) {
                    // New format (sw.json)
                    const bookList = data.BIBLEBOOK.map((book, idx) => ({
                        name: book.book_name,
                        number: book.book_number || String(idx + 1)
                    }));
                    setBooks(bookList);
                    if (bookList.length > 0) {
                        setSelectedBook(bookList[0]);
                        const firstBook = data.BIBLEBOOK[0];
                        const chapterList = firstBook.CHAPTER.map(ch => ch.chapter_number);
                        setChapters(chapterList);
                        if (chapterList.length > 0) {
                            setSelectedChapter(chapterList[0]);
                            const verseList = firstBook.CHAPTER[0].VERSES.map(v => ({
                                number: v.verse_number,
                                text: v.verse_text
                            }));
                            setVerses(verseList);
                        }
                    }
                } else {
                    // Old format (en.json)
                    const bookList = Object.keys(data).map((bookName, idx) => ({
                        name: bookName,
                        number: String(idx + 1)
                    }));
                    setBooks(bookList);
                    if (bookList.length > 0) {
                        setSelectedBook(bookList[0]);
                        const firstBookName = bookList[0].name;
                        const chapterList = Object.keys(data[firstBookName]);
                        setChapters(chapterList);
                        if (chapterList.length > 0) {
                            setSelectedChapter(chapterList[0]);
                            const verseData = data[firstBookName][chapterList[0]];
                            const verseList = Object.entries(verseData).map(([num, text]) => ({
                                number: num,
                                text: text
                            }));
                            setVerses(verseList);
                        }
                    }
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Initial load failed:", err);
                setError("Failed to load Bible data.");
                setIsLoading(false);
            });
    }, []);

    // Fetch Bible data when language changes
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        fetch(`/bible/${language}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load Bible text. Please make sure the file '/public/bible/${language}.json' exists and is correctly formatted.`);
                }
                return response.json();
            })
            .then((data: BibleData) => {
                setBible(data);
                
                if (isNewFormat(data)) {
                    // New format (sw.json)
                    const bookList = data.BIBLEBOOK.map((book, idx) => ({
                        name: book.book_name,
                        number: book.book_number || String(idx + 1)
                    }));
                    setBooks(bookList);
                    if (bookList.length > 0) {
                        setSelectedBook(bookList[0]);
                        const firstBook = data.BIBLEBOOK[0];
                        const chapterList = firstBook.CHAPTER.map(ch => ch.chapter_number);
                        setChapters(chapterList);
                        if (chapterList.length > 0) {
                            setSelectedChapter(chapterList[0]);
                            const verseList = firstBook.CHAPTER[0].VERSES.map(v => ({
                                number: v.verse_number,
                                text: v.verse_text
                            }));
                            setVerses(verseList);
                        }
                    }
                } else {
                    // Old format (en.json)
                    const bookList = Object.keys(data).map((bookName, idx) => ({
                        name: bookName,
                        number: String(idx + 1)
                    }));
                    setBooks(bookList);
                    if (bookList.length > 0) {
                        setSelectedBook(bookList[0]);
                        const firstBookName = bookList[0].name;
                        const chapterList = Object.keys(data[firstBookName]);
                        setChapters(chapterList);
                        if (chapterList.length > 0) {
                            setSelectedChapter(chapterList[0]);
                            const verseData = data[firstBookName][chapterList[0]];
                            const verseList = Object.entries(verseData).map(([num, text]) => ({
                                number: num,
                                text: text
                            }));
                            setVerses(verseList);
                        }
                    }
                }
                return data;
            })
            .catch(err => {
                console.error("Error loading bible data:", err);
                setError(err.message);
                setBible(null);
                setBooks([]);
                setSelectedBook(null);
                return null; // Return null to prevent further .then() calls
            })
            .finally(() => setIsLoading(false));
    }, [language]);

    // Update chapters when selected book changes
    useEffect(() => {
        if (selectedBook && bible) {
            if (isNewFormat(bible)) {
                const book = bible.BIBLEBOOK.find(b => b.book_number === selectedBook.number || b.book_name === selectedBook.name);
                if (book) {
                    const chapterList = book.CHAPTER.map(ch => ch.chapter_number);
                    setChapters(chapterList);
                    if (chapterList.length > 0) {
                        setSelectedChapter(chapterList[0]);
                        const verseList = book.CHAPTER[0].VERSES.map(v => ({
                            number: v.verse_number,
                            text: v.verse_text
                        }));
                        setVerses(verseList);
                    }
                }
            } else {
                const chapterList = Object.keys(bible[selectedBook.name] || {});
                setChapters(chapterList);
                if (chapterList.length > 0) {
                    setSelectedChapter(chapterList[0]);
                    const verseData = bible[selectedBook.name][chapterList[0]];
                    const verseList = Object.entries(verseData).map(([num, text]) => ({
                        number: num,
                        text: text
                    }));
                    setVerses(verseList);
                }
            }
        } else {
            setChapters([]);
            setSelectedChapter('');
            setVerses([]);
        }
    }, [selectedBook, bible]);

    // Update verses when chapter changes
    useEffect(() => {
        if (selectedChapter && selectedBook && bible) {
            if (isNewFormat(bible)) {
                const book = bible.BIBLEBOOK.find(b => b.book_number === selectedBook.number || b.book_name === selectedBook.name);
                if (book) {
                    const chapter = book.CHAPTER.find(ch => ch.chapter_number === selectedChapter);
                    if (chapter) {
                        const verseList = chapter.VERSES.map(v => ({
                            number: v.verse_number,
                            text: v.verse_text
                        }));
                        setVerses(verseList);
                    }
                }
            } else {
                const verseData = bible[selectedBook.name]?.[selectedChapter] || {};
                const verseList = Object.entries(verseData).map(([num, text]) => ({
                    number: num,
                    text: text
                }));
                setVerses(verseList);
            }
        } else {
            setVerses([]);
        }
    }, [selectedChapter, selectedBook, bible]);

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-lg text-gray-500 dark:text-gray-400">Loading Bible...</p>;
        }

        if (error) {
            return (
                <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="font-bold text-lg">Failed to load Bible</p>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }

        if (!bible || books.length === 0) {
            return <p className="text-center text-lg text-gray-500 dark:text-gray-400">No Bible data found.</p>;
        }

        return (
            <div className="space-y-4 text-lg leading-relaxed text-text-main dark:text-gray-200">
                    {verses.map((verse) => (
                        <p key={verse.number}>
                            <sup className="font-bold text-primary dark:text-secondary mr-2">{verse.number}</sup>
                            {verse.text}
                        </p>
                    ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
                {/* Header */}
                <div className="relative text-center mb-8">
                    <button onClick={() => navigate(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden">
                        <ArrowLeftIcon className="w-6 h-6 text-text-main dark:text-gray-300" />
                    </button>
                    <BibleIcon className="w-16 h-16 text-primary dark:text-secondary mx-auto mb-4" />
                    <h1 className="text-4xl font-serif font-bold text-primary dark:text-white">The Holy Bible</h1>
                    <p className="mt-2 text-lg text-text-main dark:text-gray-300">
                        Engage with the Word of God.
                    </p>
                </div>
                
                {/* Controls */}
                <div className="sticky top-4 z-10 bg-gray-100/80 dark:bg-gray-800/80 py-4 mb-8 rounded-lg shadow-md backdrop-blur-sm -mx-4 px-4">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-secondary text-primary shadow' : 'text-text-main dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('sw')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${language === 'sw' ? 'bg-secondary text-primary shadow' : 'text-text-main dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                Kiswahili
                            </button>
                        </div>
                        <select 
                            disabled={isLoading || !!error} 
                            value={selectedBook?.number || ''} 
                            onChange={e => {
                                const book = books.find(b => b.number === e.target.value);
                                setSelectedBook(book || null);
                            }} 
                            className="w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                        >
                            {books.map(book => (
                                <option key={book.number} value={book.number}>
                                    {book.name}
                                </option>
                            ))}
                        </select>
                        <select 
                            disabled={isLoading || !!error || !selectedBook} 
                            value={selectedChapter || ''} 
                            onChange={e => setSelectedChapter(e.target.value)} 
                            className="w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                        >
                            {chapters.map(chapter => (
                                <option key={chapter} value={chapter}>
                                    Chapter {chapter}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-inner">
                        <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-6 border-b-2 border-secondary pb-2">
                            {selectedBook?.name} {selectedChapter}
                        </h2>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default BiblePage;
