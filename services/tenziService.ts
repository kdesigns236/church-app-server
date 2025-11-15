// Tenzi la Rohoni Service - Swahili Hymns Management
// Handles hymn parsing, search, and display functionality

export interface HymnVerse {
  number: number;
  text: string;
}

export interface Hymn {
  id: string;
  number: number;
  title: string;
  verses: HymnVerse[];
  chorus?: string;
  reference?: string;
  category?: string;
}

export interface HymnSearchResult {
  hymn: Hymn;
  matchType: 'title' | 'verse' | 'number';
  matchText: string;
}

class TenziService {
  private hymns: Map<number, Hymn> = new Map();
  private hymnsByTitle: Map<string, Hymn> = new Map();
  private isInitialized = false;
  private rawHymnText = '';

  // Initialize the service with hymn data
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[Tenzi] Initializing Swahili hymns service...');
      
      // Load hymn text from file
      await this.loadHymnData();
      
      // Parse hymns
      this.parseHymns();
      
      this.isInitialized = true;
      console.log(`[Tenzi] Loaded ${this.hymns.size} Swahili hymns`);
      
    } catch (error) {
      console.error('[Tenzi] Initialization failed:', error);
      throw error;
    }
  }

  // Load hymn data from the text file
  private async loadHymnData(): Promise<void> {
    try {
      // Load the hymn text from the file
      const response = await fetch('/hymns.txt');
      if (!response.ok) {
        throw new Error('Failed to load hymns file');
      }
      
      this.rawHymnText = await response.text();
      console.log('[Tenzi] Hymn data loaded successfully');
    } catch (error) {
      console.error('[Tenzi] Error loading hymn data:', error);
      
      // Fallback to sample data if file loading fails
      this.rawHymnText = `1.                    PETRO NA YOHANA
                         (Mdo. 3:1-10)

     1) Yule Petro pia Yohana,
        Walikuwa pamoja (wote)
        Walikwea na kwenda kusali,
        Walimwona kiwete (yule).

              Alipokwisha waona (wao)
              Aliwakazia macho (sana)
              Akiomba na apewe (yeye)
              Cho chote walicho (nacho). x2

              Sisi hatuna dhahabu (kweli)
              Hata nayo fedha (ndugu),
              Kwa jina la Bwana Yesu
              Simama uende. x2

              Ilikuwa ajabu (sana)
              Kiwete akitembea. x4

     2) Mara kiwete akasimama,
        Akiruka jamani (kweli),
        Akaingia kwenye hekalu,
        Akimsifu Mungu (Baba).

2.                        MPANZI MMOJA

     1) Mpanzi mmoja alitoka kupanda mbegu njema,
        Adui naye akaja kupanda magugu,
        Mbegu zote zikawa zimechanganyikana, (x2)
        Kwa pamoja.

3.                               YEHOVA

     1) Yehova we Baba Yangu,
        Ombi langu lisikie. x2

        (Ewe Baba)         Ewe Baba Yangu
                           Mungu Wangu wa Mbinguni,
                           Ombi langu lisikie,
        (Niandike)         Nami niandike ndani ya
                           Kile kitabu cha uzima
                           Wa milele.

     2) Na mambo ya dunia hii,
        Yamenishinda ninajuta. x2`;

      console.log('[Tenzi] Using fallback hymn data');
    }
  }

  // Parse the raw hymn text into structured data
  private parseHymns(): void {
    try {
      // This is a simplified parser - in production, you'd want more robust parsing
      const lines = this.rawHymnText.split('\n');
      let currentHymn: Partial<Hymn> | null = null;
      let currentVerse: Partial<HymnVerse> | null = null;
      let verseText = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;

        // Check for hymn number and title (e.g., "1.                    PETRO NA YOHANA")
        const hymnMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (hymnMatch) {
          // Save previous hymn if exists
          if (currentHymn && currentHymn.number) {
            this.saveHymn(currentHymn as Hymn);
          }

          // Start new hymn
          const number = parseInt(hymnMatch[1]);
          const title = hymnMatch[2].trim();
          
          currentHymn = {
            id: `hymn_${number}`,
            number,
            title,
            verses: []
          };
          continue;
        }

        // Check for reference (e.g., "(Mdo. 3:1-10)")
        const refMatch = line.match(/^\((.+)\)$/);
        if (refMatch && currentHymn) {
          currentHymn.reference = refMatch[1];
          continue;
        }

        // Check for verse number (e.g., "1)", "2)", etc.)
        const verseMatch = line.match(/^\s*(\d+)\)\s*(.*)$/);
        if (verseMatch && currentHymn) {
          // Save previous verse if exists
          if (currentVerse && verseText) {
            currentVerse.text = verseText.trim();
            currentHymn.verses!.push(currentVerse as HymnVerse);
          }

          // Start new verse
          currentVerse = {
            number: parseInt(verseMatch[1]),
            text: ''
          };
          verseText = verseMatch[2];
          continue;
        }

        // Add to current verse text
        if (currentVerse && currentHymn) {
          if (verseText) verseText += '\n';
          verseText += line;
        }
      }

      // Save the last hymn and verse
      if (currentVerse && verseText) {
        currentVerse.text = verseText.trim();
        currentHymn?.verses!.push(currentVerse as HymnVerse);
      }
      if (currentHymn && currentHymn.number) {
        this.saveHymn(currentHymn as Hymn);
      }

      console.log(`[Tenzi] Parsed ${this.hymns.size} hymns successfully`);
    } catch (error) {
      console.error('[Tenzi] Error parsing hymns:', error);
    }
  }

  // Save a hymn to the collections
  private saveHymn(hymn: Hymn): void {
    this.hymns.set(hymn.number, hymn);
    this.hymnsByTitle.set(hymn.title.toLowerCase(), hymn);
  }

  // Get all hymns
  getAllHymns(): Hymn[] {
    return Array.from(this.hymns.values()).sort((a, b) => a.number - b.number);
  }

  // Get hymn by number
  getHymnByNumber(number: number): Hymn | null {
    return this.hymns.get(number) || null;
  }

  // Get hymn by title
  getHymnByTitle(title: string): Hymn | null {
    return this.hymnsByTitle.get(title.toLowerCase()) || null;
  }

  // Search hymns
  searchHymns(query: string, limit: number = 20): HymnSearchResult[] {
    const results: HymnSearchResult[] = [];
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return results;

    // Search by number first
    const numberMatch = searchTerm.match(/^\d+$/);
    if (numberMatch) {
      const number = parseInt(numberMatch[0]);
      const hymn = this.getHymnByNumber(number);
      if (hymn) {
        results.push({
          hymn,
          matchType: 'number',
          matchText: `Hymn ${number}`
        });
      }
    }

    // Search by title
    for (const hymn of this.hymns.values()) {
      if (hymn.title.toLowerCase().includes(searchTerm)) {
        results.push({
          hymn,
          matchType: 'title',
          matchText: hymn.title
        });
      }
    }

    // Search in verse content
    for (const hymn of this.hymns.values()) {
      for (const verse of hymn.verses) {
        if (verse.text.toLowerCase().includes(searchTerm)) {
          // Avoid duplicates from title search
          if (!results.find(r => r.hymn.number === hymn.number)) {
            results.push({
              hymn,
              matchType: 'verse',
              matchText: this.getMatchingLine(verse.text, searchTerm)
            });
          }
        }
      }
    }

    return results.slice(0, limit);
  }

  // Get a matching line from verse text
  private getMatchingLine(text: string, searchTerm: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(searchTerm)) {
        return line.trim();
      }
    }
    return lines[0]?.trim() || text.substring(0, 50) + '...';
  }

  // Get hymns by category (if we add categories later)
  getHymnsByCategory(category: string): Hymn[] {
    return Array.from(this.hymns.values())
      .filter(hymn => hymn.category === category)
      .sort((a, b) => a.number - b.number);
  }

  // Get random hymn
  getRandomHymn(): Hymn | null {
    const hymns = Array.from(this.hymns.values());
    if (hymns.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * hymns.length);
    return hymns[randomIndex];
  }

  // Get hymn of the day (based on date)
  getHymnOfTheDay(): Hymn | null {
    const hymns = Array.from(this.hymns.values());
    if (hymns.length === 0) return null;

    // Use day of year to pick a hymn
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const hymnIndex = dayOfYear % hymns.length;
    return hymns[hymnIndex];
  }

  // Get popular hymns (first 20 for now)
  getPopularHymns(limit: number = 20): Hymn[] {
    return Array.from(this.hymns.values())
      .slice(0, limit)
      .sort((a, b) => a.number - b.number);
  }

  // Format hymn for display
  formatHymnForDisplay(hymn: Hymn): { title: string; content: string } {
    let content = '';
    
    if (hymn.reference) {
      content += `(${hymn.reference})\n\n`;
    }

    hymn.verses.forEach(verse => {
      content += `${verse.number}) ${verse.text}\n\n`;
    });

    if (hymn.chorus) {
      content += `Chorus:\n${hymn.chorus}\n\n`;
    }

    return {
      title: `${hymn.number}. ${hymn.title}`,
      content: content.trim()
    };
  }

  // Get hymn statistics
  getStatistics(): { totalHymns: number; totalVerses: number } {
    let totalVerses = 0;
    for (const hymn of this.hymns.values()) {
      totalVerses += hymn.verses.length;
    }

    return {
      totalHymns: this.hymns.size,
      totalVerses
    };
  }

  // Get next/previous hymn
  getNextHymn(currentNumber: number): Hymn | null {
    const numbers = Array.from(this.hymns.keys()).sort((a, b) => a - b);
    const currentIndex = numbers.indexOf(currentNumber);
    
    if (currentIndex === -1 || currentIndex === numbers.length - 1) {
      return null;
    }
    
    return this.hymns.get(numbers[currentIndex + 1]) || null;
  }

  getPreviousHymn(currentNumber: number): Hymn | null {
    const numbers = Array.from(this.hymns.keys()).sort((a, b) => a - b);
    const currentIndex = numbers.indexOf(currentNumber);
    
    if (currentIndex <= 0) {
      return null;
    }
    
    return this.hymns.get(numbers[currentIndex - 1]) || null;
  }

  // Cleanup
  cleanup(): void {
    console.log('[Tenzi] Cleaning up hymns service...');
    this.hymns.clear();
    this.hymnsByTitle.clear();
    this.rawHymnText = '';
    this.isInitialized = false;
  }
}

// Create singleton instance
export const tenziService = new TenziService();
