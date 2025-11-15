import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, SearchIcon, BookIcon, PlayIcon, ArrowRightIcon } from '../constants/icons';
import { tenziService, Hymn, HymnSearchResult } from '../services/tenziService';

const TenziPage: React.FC = () => {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HymnSearchResult[]>([]);
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [hymnOfTheDay, setHymnOfTheDay] = useState<Hymn | null>(null);
  const [popularHymns, setPopularHymns] = useState<Hymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [statistics, setStatistics] = useState({ totalHymns: 0, totalVerses: 0 });

  // Initialize service and load hymns
  useEffect(() => {
    initializeTenzi();
  }, []);

  const initializeTenzi = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await tenziService.initialize();
      
      // Load initial data
      const allHymns = tenziService.getAllHymns();
      const todaysHymn = tenziService.getHymnOfTheDay();
      const popular = tenziService.getPopularHymns(10);
      const stats = tenziService.getStatistics();

      setHymns(allHymns);
      setHymnOfTheDay(todaysHymn);
      setPopularHymns(popular);
      setStatistics(stats);

      console.log('[TenziPage] Loaded hymns successfully');
    } catch (err) {
      console.error('[TenziPage] Error loading hymns:', err);
      setError('Hitilafu katika kupakia nyimbo. Tafadhali jaribu tena.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = tenziService.searchHymns(query, 20);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Select hymn
  const selectHymn = (hymn: Hymn) => {
    setSelectedHymn(hymn);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Navigate hymns
  const goToNextHymn = () => {
    if (selectedHymn) {
      const nextHymn = tenziService.getNextHymn(selectedHymn.number);
      if (nextHymn) {
        setSelectedHymn(nextHymn);
      }
    }
  };

  const goToPreviousHymn = () => {
    if (selectedHymn) {
      const prevHymn = tenziService.getPreviousHymn(selectedHymn.number);
      if (prevHymn) {
        setSelectedHymn(prevHymn);
      }
    }
  };

  // Format hymn content for display
  const formatHymnContent = (hymn: Hymn) => {
    const formatted = tenziService.formatHymnForDisplay(hymn);
    return formatted;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookIcon className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Inapakia Tenzi la Rohoni...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Subiri kidogo, tunapakia nyimbo za Kiswahili
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <BookIcon className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Hitilafu
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={initializeTenzi}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Jaribu Tena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {selectedHymn ? (
                <button
                  onClick={() => setSelectedHymn(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
              ) : null}
              
              <BookIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tenzi la Rohoni
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nyimbo za Kiswahili za Kanisa
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showSearch 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <SearchIcon className="w-4 h-4" />
                Tafuta
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedHymn ? (
          /* Hymn Display */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Hymn Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedHymn.number}. {selectedHymn.title}
                    </h2>
                    {selectedHymn.reference && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ({selectedHymn.reference})
                      </p>
                    )}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPreviousHymn}
                      disabled={!tenziService.getPreviousHymn(selectedHymn.number)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNextHymn}
                      disabled={!tenziService.getNextHymn(selectedHymn.number)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hymn Content */}
              <div className="p-6">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {selectedHymn.verses.map((verse, index) => (
                    <div key={index} className="mb-6">
                      <div className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                        Ubeti wa {verse.number}
                      </div>
                      <div className="whitespace-pre-line text-gray-900 dark:text-white leading-relaxed">
                        {verse.text}
                      </div>
                    </div>
                  ))}
                  
                  {selectedHymn.chorus && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
                      <div className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                        Kiitikio
                      </div>
                      <div className="whitespace-pre-line text-gray-900 dark:text-white">
                        {selectedHymn.chorus}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Page */
          <div className="space-y-8">
            {/* Search Section */}
            {showSearch && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tafuta Wimbo
                </h3>
                
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Andika nambari ya wimbo, jina, au maneno..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Matokeo ya utafutaji ({searchResults.length})
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => selectHymn(result.hymn)}
                          className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {result.hymn.number}. {result.hymn.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {result.matchType === 'verse' ? `"${result.matchText}"` : result.matchText}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Hakuna matokeo ya "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                <BookIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalHymns}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Nyimbo Zote
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                <PlayIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalVerses}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Beti Zote
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                <SearchIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  Kiswahili
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Lugha ya Nyimbo
                </div>
              </div>
            </div>

            {/* Hymn of the Day */}
            {hymnOfTheDay && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🌟 Wimbo wa Leo
                </h3>
                <button
                  onClick={() => selectHymn(hymnOfTheDay)}
                  className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {hymnOfTheDay.number}. {hymnOfTheDay.title}
                  </div>
                  {hymnOfTheDay.reference && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ({hymnOfTheDay.reference})
                    </div>
                  )}
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {hymnOfTheDay.verses[0]?.text.split('\n')[0]}...
                  </div>
                </button>
              </div>
            )}

            {/* Popular Hymns */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📖 Nyimbo Maarufu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {popularHymns.map((hymn) => (
                  <button
                    key={hymn.id}
                    onClick={() => selectHymn(hymn)}
                    className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {hymn.number}. {hymn.title}
                    </div>
                    {hymn.reference && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        ({hymn.reference})
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* All Hymns Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📚 Nyimbo Zote
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {hymns.map((hymn) => (
                  <button
                    key={hymn.id}
                    onClick={() => selectHymn(hymn)}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-center"
                  >
                    <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {hymn.number}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {hymn.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenziPage;
