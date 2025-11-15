// Bible Verse Service for Lower Third Graphics
// Provides verse lookup, popular verses, and verse of the day

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  translation: string;
}

export interface BibleBook {
  name: string;
  abbreviation: string;
  chapters: number;
  testament: 'old' | 'new';
}

class BibleVerseService {
  private verses: Map<string, BibleVerse> = new Map();
  private books: BibleBook[] = [];
  private popularVerses: string[] = [];
  private isInitialized = false;

  // Popular Bible verses for quick access
  private defaultPopularVerses = [
    'John 3:16',
    'Romans 8:28',
    'Philippians 4:13',
    'Jeremiah 29:11',
    'Psalm 23:1',
    'Isaiah 41:10',
    'Matthew 28:19-20',
    'Romans 10:9',
    'Ephesians 2:8-9',
    'Proverbs 3:5-6',
    '1 Corinthians 13:4-7',
    'Joshua 1:9',
    'Psalm 46:1',
    'Romans 12:2',
    'Matthew 6:33',
    'Galatians 2:20',
    'Psalm 119:105',
    'Isaiah 53:5',
    '2 Timothy 3:16',
    'Hebrews 11:1'
  ];

  // Bible books data
  private bibleBooks: BibleBook[] = [
    // Old Testament
    { name: 'Genesis', abbreviation: 'Gen', chapters: 50, testament: 'old' },
    { name: 'Exodus', abbreviation: 'Exod', chapters: 40, testament: 'old' },
    { name: 'Leviticus', abbreviation: 'Lev', chapters: 27, testament: 'old' },
    { name: 'Numbers', abbreviation: 'Num', chapters: 36, testament: 'old' },
    { name: 'Deuteronomy', abbreviation: 'Deut', chapters: 34, testament: 'old' },
    { name: 'Joshua', abbreviation: 'Josh', chapters: 24, testament: 'old' },
    { name: 'Judges', abbreviation: 'Judg', chapters: 21, testament: 'old' },
    { name: 'Ruth', abbreviation: 'Ruth', chapters: 4, testament: 'old' },
    { name: '1 Samuel', abbreviation: '1Sam', chapters: 31, testament: 'old' },
    { name: '2 Samuel', abbreviation: '2Sam', chapters: 24, testament: 'old' },
    { name: '1 Kings', abbreviation: '1Kgs', chapters: 22, testament: 'old' },
    { name: '2 Kings', abbreviation: '2Kgs', chapters: 25, testament: 'old' },
    { name: '1 Chronicles', abbreviation: '1Chr', chapters: 29, testament: 'old' },
    { name: '2 Chronicles', abbreviation: '2Chr', chapters: 36, testament: 'old' },
    { name: 'Ezra', abbreviation: 'Ezra', chapters: 10, testament: 'old' },
    { name: 'Nehemiah', abbreviation: 'Neh', chapters: 13, testament: 'old' },
    { name: 'Esther', abbreviation: 'Esth', chapters: 10, testament: 'old' },
    { name: 'Job', abbreviation: 'Job', chapters: 42, testament: 'old' },
    { name: 'Psalms', abbreviation: 'Ps', chapters: 150, testament: 'old' },
    { name: 'Proverbs', abbreviation: 'Prov', chapters: 31, testament: 'old' },
    { name: 'Ecclesiastes', abbreviation: 'Eccl', chapters: 12, testament: 'old' },
    { name: 'Song of Solomon', abbreviation: 'Song', chapters: 8, testament: 'old' },
    { name: 'Isaiah', abbreviation: 'Isa', chapters: 66, testament: 'old' },
    { name: 'Jeremiah', abbreviation: 'Jer', chapters: 52, testament: 'old' },
    { name: 'Lamentations', abbreviation: 'Lam', chapters: 5, testament: 'old' },
    { name: 'Ezekiel', abbreviation: 'Ezek', chapters: 48, testament: 'old' },
    { name: 'Daniel', abbreviation: 'Dan', chapters: 12, testament: 'old' },
    { name: 'Hosea', abbreviation: 'Hos', chapters: 14, testament: 'old' },
    { name: 'Joel', abbreviation: 'Joel', chapters: 3, testament: 'old' },
    { name: 'Amos', abbreviation: 'Amos', chapters: 9, testament: 'old' },
    { name: 'Obadiah', abbreviation: 'Obad', chapters: 1, testament: 'old' },
    { name: 'Jonah', abbreviation: 'Jonah', chapters: 4, testament: 'old' },
    { name: 'Micah', abbreviation: 'Mic', chapters: 7, testament: 'old' },
    { name: 'Nahum', abbreviation: 'Nah', chapters: 3, testament: 'old' },
    { name: 'Habakkuk', abbreviation: 'Hab', chapters: 3, testament: 'old' },
    { name: 'Zephaniah', abbreviation: 'Zeph', chapters: 3, testament: 'old' },
    { name: 'Haggai', abbreviation: 'Hag', chapters: 2, testament: 'old' },
    { name: 'Zechariah', abbreviation: 'Zech', chapters: 14, testament: 'old' },
    { name: 'Malachi', abbreviation: 'Mal', chapters: 4, testament: 'old' },
    
    // New Testament
    { name: 'Matthew', abbreviation: 'Matt', chapters: 28, testament: 'new' },
    { name: 'Mark', abbreviation: 'Mark', chapters: 16, testament: 'new' },
    { name: 'Luke', abbreviation: 'Luke', chapters: 24, testament: 'new' },
    { name: 'John', abbreviation: 'John', chapters: 21, testament: 'new' },
    { name: 'Acts', abbreviation: 'Acts', chapters: 28, testament: 'new' },
    { name: 'Romans', abbreviation: 'Rom', chapters: 16, testament: 'new' },
    { name: '1 Corinthians', abbreviation: '1Cor', chapters: 16, testament: 'new' },
    { name: '2 Corinthians', abbreviation: '2Cor', chapters: 13, testament: 'new' },
    { name: 'Galatians', abbreviation: 'Gal', chapters: 6, testament: 'new' },
    { name: 'Ephesians', abbreviation: 'Eph', chapters: 6, testament: 'new' },
    { name: 'Philippians', abbreviation: 'Phil', chapters: 4, testament: 'new' },
    { name: 'Colossians', abbreviation: 'Col', chapters: 4, testament: 'new' },
    { name: '1 Thessalonians', abbreviation: '1Thess', chapters: 5, testament: 'new' },
    { name: '2 Thessalonians', abbreviation: '2Thess', chapters: 3, testament: 'new' },
    { name: '1 Timothy', abbreviation: '1Tim', chapters: 6, testament: 'new' },
    { name: '2 Timothy', abbreviation: '2Tim', chapters: 4, testament: 'new' },
    { name: 'Titus', abbreviation: 'Titus', chapters: 3, testament: 'new' },
    { name: 'Philemon', abbreviation: 'Phlm', chapters: 1, testament: 'new' },
    { name: 'Hebrews', abbreviation: 'Heb', chapters: 13, testament: 'new' },
    { name: 'James', abbreviation: 'Jas', chapters: 5, testament: 'new' },
    { name: '1 Peter', abbreviation: '1Pet', chapters: 5, testament: 'new' },
    { name: '2 Peter', abbreviation: '2Pet', chapters: 3, testament: 'new' },
    { name: '1 John', abbreviation: '1John', chapters: 5, testament: 'new' },
    { name: '2 John', abbreviation: '2John', chapters: 1, testament: 'new' },
    { name: '3 John', abbreviation: '3John', chapters: 1, testament: 'new' },
    { name: 'Jude', abbreviation: 'Jude', chapters: 1, testament: 'new' },
    { name: 'Revelation', abbreviation: 'Rev', chapters: 22, testament: 'new' }
  ];

  // Sample verses removed – in production, verses should come from real Bible data or an API.
  private sampleVerses: { [key: string]: BibleVerse } = {};

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[BibleVerse] Initializing Bible verse service...');
      
      // Load Bible books
      this.books = [...this.bibleBooks];
      
      // Load sample verses
      Object.entries(this.sampleVerses).forEach(([reference, verse]) => {
        this.verses.set(reference, verse);
      });
      
      // Set popular verses
      this.popularVerses = [...this.defaultPopularVerses];
      
      this.isInitialized = true;
      console.log(`[BibleVerse] Loaded ${this.verses.size} verses and ${this.books.length} books`);
      
    } catch (error) {
      console.error('[BibleVerse] Initialization failed:', error);
      throw error;
    }
  }

  // Get verse by reference
  async getVerse(reference: string, translation: string = 'NIV'): Promise<BibleVerse | null> {
    // Check local cache first
    const cached = this.verses.get(reference);
    if (cached && cached.translation === translation) {
      return cached;
    }

    // No more hard-coded demo verses or placeholders – callers should
    // supply real verse data or integrate this service with a Bible source.
    return null;
  }

  // Parse verse reference (e.g., "John 3:16" or "Matthew 28:19-20")
  private parseReference(reference: string): { book: string; chapter: number; verse: number } | null {
    try {
      // Simple regex to parse "Book Chapter:Verse" format
      const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-\d+)?$/);
      if (match) {
        return {
          book: match[1].trim(),
          chapter: parseInt(match[2]),
          verse: parseInt(match[3])
        };
      }
    } catch (error) {
      console.error('[BibleVerse] Error parsing reference:', error);
    }
    return null;
  }

  // Get popular verses
  getPopularVerses(): string[] {
    return [...this.popularVerses];
  }

  // Get verse of the day
  async getVerseOfTheDay(): Promise<BibleVerse | null> {
    // Simple algorithm: use day of year to pick a verse
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const verseIndex = dayOfYear % this.popularVerses.length;
    const reference = this.popularVerses[verseIndex];
    
    return await this.getVerse(reference);
  }

  // Search verses by keyword
  async searchVerses(keyword: string, limit: number = 10): Promise<BibleVerse[]> {
    const results: BibleVerse[] = [];
    const searchTerm = keyword.toLowerCase();
    
    // Search through cached verses
    for (const verse of this.verses.values()) {
      if (verse.text.toLowerCase().includes(searchTerm) || 
          verse.reference.toLowerCase().includes(searchTerm)) {
        results.push(verse);
        if (results.length >= limit) break;
      }
    }
    
    // In production, this would search through a Bible database/API
    console.log(`[BibleVerse] Found ${results.length} verses for "${keyword}"`);
    return results;
  }

  // Get verses by book
  async getVersesByBook(bookName: string, chapter?: number): Promise<BibleVerse[]> {
    const results: BibleVerse[] = [];
    
    for (const verse of this.verses.values()) {
      if (verse.book.toLowerCase() === bookName.toLowerCase()) {
        if (chapter === undefined || verse.chapter === chapter) {
          results.push(verse);
        }
      }
    }
    
    return results;
  }

  // Get random verse
  async getRandomVerse(): Promise<BibleVerse | null> {
    const references = Array.from(this.verses.keys());
    if (references.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * references.length);
    const randomReference = references[randomIndex];
    
    return this.verses.get(randomReference) || null;
  }

  // Get Bible books
  getBibleBooks(): BibleBook[] {
    return [...this.books];
  }

  // Get books by testament
  getBooksByTestament(testament: 'old' | 'new'): BibleBook[] {
    return this.books.filter(book => book.testament === testament);
  }

  // Find book by name or abbreviation
  findBook(nameOrAbbr: string): BibleBook | null {
    const search = nameOrAbbr.toLowerCase();
    return this.books.find(book => 
      book.name.toLowerCase() === search || 
      book.abbreviation.toLowerCase() === search
    ) || null;
  }

  // Add custom verse
  addCustomVerse(verse: BibleVerse): void {
    this.verses.set(verse.reference, verse);
    console.log(`[BibleVerse] Added custom verse: ${verse.reference}`);
  }

  // Get verse suggestions based on partial input
  getVerseSuggestions(input: string, limit: number = 5): string[] {
    const suggestions: string[] = [];
    const searchTerm = input.toLowerCase();
    
    // Search through popular verses first
    for (const reference of this.popularVerses) {
      if (reference.toLowerCase().includes(searchTerm)) {
        suggestions.push(reference);
        if (suggestions.length >= limit) break;
      }
    }
    
    // If not enough suggestions, search through all cached verses
    if (suggestions.length < limit) {
      for (const reference of this.verses.keys()) {
        if (!suggestions.includes(reference) && 
            reference.toLowerCase().includes(searchTerm)) {
          suggestions.push(reference);
          if (suggestions.length >= limit) break;
        }
      }
    }
    
    return suggestions;
  }

  // Format verse for display
  formatVerseForDisplay(verse: BibleVerse, maxLength?: number): { title: string; subtitle: string } {
    let text = verse.text;
    
    // Truncate if too long
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...';
    }
    
    return {
      title: text,
      subtitle: `${verse.reference} (${verse.translation})`
    };
  }

  // Get verse statistics
  getStatistics(): { totalVerses: number; totalBooks: number; popularVerses: number } {
    return {
      totalVerses: this.verses.size,
      totalBooks: this.books.length,
      popularVerses: this.popularVerses.length
    };
  }

  // Cleanup
  cleanup(): void {
    console.log('[BibleVerse] Cleaning up Bible verse service...');
    this.verses.clear();
    this.books = [];
    this.popularVerses = [];
    this.isInitialized = false;
  }
}

// Create singleton instance
export const bibleVerseService = new BibleVerseService();
