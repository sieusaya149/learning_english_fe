import React, { useState, useEffect } from 'react';
import PhraseCard from '../components/PhraseCard';
import { Filter, BookmarkCheck, ArrowUpDown, Search, Loader2, Grid3X3, List, Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import { usePhraseApi } from '../hooks/usePhraseApi';
import { Phrase } from '../utils/types';
import { PageLoadingSkeleton } from '../components/Skeletons';
import { useNotifications, createPracticeNotification, createAchievementNotification } from '../hooks/useNotifications';

const PhrasePractice: React.FC = () => {
  const { 
    phrases, 
    loading, 
    error, 
    isAuthenticated, 
    togglePhraseSave, 
    submitPracticeRecording, 
    evaluatePronunciation,
    getAudioUrl,
    getTranslations,
    filterPhrases
  } = usePhraseApi();

  const { addNotification } = useNotifications();
  
  // View mode state
  const [viewMode, setViewMode] = useState<'single' | 'list' | 'grid'>('grid');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'th' | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique topics and levels from phrases
  const topics = [...new Set(phrases.map(phrase => phrase.topic))].sort();
  const levels = ['beginner', 'intermediate', 'advanced'];
  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'th' as const, name: 'Thai', flag: '🇹🇭' }
  ];

  // Navigation functions for single phrase mode
  const goToNextPhrase = () => {
    if (currentPhraseIndex < filteredPhrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
    }
  };

  const goToPreviousPhrase = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
    }
  };

  const goToRandomPhrase = () => {
    const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
    setCurrentPhraseIndex(randomIndex);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Reset current phrase index when filters change
  useEffect(() => {
    setCurrentPhraseIndex(0);
  }, [filteredPhrases.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with input fields
      }

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            exitFullscreen();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (viewMode === 'single' || isFullscreen) {
            e.preventDefault();
            goToPreviousPhrase();
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          if (viewMode === 'single' || isFullscreen) {
            e.preventDefault();
            goToNextPhrase();
          }
          break;
        case ' ':
          if (viewMode === 'single' || isFullscreen) {
            e.preventDefault();
            goToRandomPhrase();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, currentPhraseIndex, filteredPhrases.length, isFullscreen]);
  
  useEffect(() => {
    const filtered = filterPhrases({
      level: selectedLevel || undefined,
      topic: selectedTopic || undefined,
      language: selectedLanguage || undefined,
      savedOnly: showSavedOnly,
      searchQuery: searchQuery || undefined
    });
    setFilteredPhrases(filtered);
  }, [phrases, selectedLevel, selectedTopic, selectedLanguage, showSavedOnly, searchQuery, filterPhrases]);
  
  const handleSavePhrase = async (phraseId: string, saved: boolean) => {
    try {
      await togglePhraseSave(phraseId, saved);
      
      if (saved) {
        // Count saved phrases for achievement
        const savedCount = phrases.filter(p => p.saved).length + 1;
        
        if (savedCount === 5) {
          addNotification(createAchievementNotification(
            'Collector! 📌',
            'You\'ve saved your first 5 phrases! Building your personal vocabulary collection.',
            '📌'
          ));
        } else if (savedCount === 25) {
          addNotification(createAchievementNotification(
            'Vocabulary Builder! 📚',
            'Amazing! 25 phrases saved. Your personal collection is growing strong!',
            '📚'
          ));
        } else if (savedCount === 50) {
          addNotification(createAchievementNotification(
            'Word Master! 🏆',
            'Incredible! 50 phrases saved. You\'re building an impressive vocabulary arsenal!',
            '🏆'
          ));
        }
      }
    } catch (error) {
      console.error('Failed to save/unsave phrase:', error);
    }
  };
  
  const handleRecordingComplete = async (phraseId: string, blob: Blob) => {
    try {
      await submitPracticeRecording(phraseId, blob, {
        timestamp: new Date().toISOString(),
        duration: blob.size // Simple metadata
      });
      
      console.log(`Recording submitted for phrase ${phraseId}`);
      
      // Add practice completion notification
      addNotification(createPracticeNotification('phrase', 1));
      
      // Check for practice milestones
      const todayPractices = localStorage.getItem('todayPracticeCount');
      const currentCount = todayPractices ? parseInt(todayPractices) + 1 : 1;
      const today = new Date().toDateString();
      const lastPracticeDate = localStorage.getItem('lastPracticeDate');
      
      if (lastPracticeDate !== today) {
        // Reset daily count for new day
        localStorage.setItem('todayPracticeCount', '1');
        localStorage.setItem('lastPracticeDate', today);
      } else {
        localStorage.setItem('todayPracticeCount', currentCount.toString());
        
        // Daily milestone notifications
        if (currentCount === 5) {
          addNotification(createAchievementNotification(
            'Daily Dedicated! 🎯',
            'Fantastic! You\'ve practiced 5 phrases today. Consistency is key!',
            '🎯'
          ));
        } else if (currentCount === 10) {
          addNotification(createAchievementNotification(
            'Practice Powerhouse! ⚡',
            'Outstanding! 10 phrases practiced today. You\'re on fire!',
            '⚡'
          ));
        } else if (currentCount === 20) {
          addNotification(createAchievementNotification(
            'Marathon Learner! 🏃‍♂️',
            'Incredible dedication! 20 phrases in one day. You\'re unstoppable!',
            '🏃‍♂️'
          ));
        }
      }
    } catch (error) {
      console.error('Failed to submit recording:', error);
    }
  };

  const handleEvaluate = async (phraseId: string, blob: Blob) => {
    return await evaluatePronunciation(phraseId, blob);
  };
  
  const clearFilters = () => {
    setSelectedLevel(null);
    setSelectedTopic(null);
    setSelectedLanguage(null);
    setSearchQuery('');
    setShowSavedOnly(false);
  };
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Authentication required message
  if (!isAuthenticated) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access phrase practice features.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state with skeleton
  if (loading) {
    return <PageLoadingSkeleton type="phrases" />;
  }

  // Error state
  if (error && phrases.length === 0) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load phrases: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Phrase Practice</h1>
          <p className="text-gray-600">
            Practice English and Thai phrases with pronunciation guides, translations, and audio. 
            Record yourself and get AI evaluation!
          </p>
          {loading && phrases.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm text-blue-600">Updating phrases...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Switcher - Desktop */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('single')}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                viewMode === 'single'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="Single phrase mode - Focus on one phrase at a time"
            >
              <Maximize2 size={16} />
              <span>Single</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="List view - Feed-style layout"
            >
              <List size={16} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="Grid view - Card layout"
            >
              <Grid3X3 size={16} />
              <span>Grid</span>
            </button>
          </div>

          {/* View Mode Switcher - Mobile */}
          <div className="md:hidden flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('single')}
              className={clsx(
                'flex items-center justify-center p-2 rounded-md transition-colors',
                viewMode === 'single'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
              )}
              title="Single phrase mode"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center justify-center p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
              )}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'flex items-center justify-center p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
              )}
              title="Grid view"
            >
              <Grid3X3 size={18} />
            </button>
          </div>
          
          {viewMode !== 'single' && (
            <button
              onClick={toggleFilter}
              className={clsx(
                'md:hidden p-2 rounded-md',
                isFilterOpen ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Filter size={20} />
            </button>
          )}
        </div>
      </div>
      
      <div className={clsx(
        "grid gap-6",
        viewMode === 'single' ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4"
      )}>
        {/* Filters Sidebar */}
        {viewMode !== 'single' && (
          <div className={clsx(
            'md:block space-y-6',
            isFilterOpen ? 'block' : 'hidden'
          )}>
            <div className="card p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={18} />
                <span>Filters</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <div className="space-y-2">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(selectedLanguage === lang.code ? null : lang.code)}
                        className={clsx(
                          'w-full px-3 py-2 text-left text-sm rounded-md transition-colors',
                          selectedLanguage === lang.code
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <div className="space-y-2">
                    {levels.map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                        className={clsx(
                          'w-full px-3 py-2 text-left text-sm rounded-md transition-colors',
                          selectedLevel === level
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {topics.map(topic => (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                        className={clsx(
                          'w-full px-3 py-2 text-left text-sm rounded-md transition-colors',
                          selectedTopic === topic
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {topic.charAt(0).toUpperCase() + topic.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <button
                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                    className={clsx(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors',
                      showSavedOnly
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <BookmarkCheck size={16} />
                    <span>Saved Phrases Only</span>
                  </button>
                </div>
                
                {(selectedLevel || selectedTopic || selectedLanguage || showSavedOnly) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content Area */}
        <div className={clsx(
          "space-y-6",
          viewMode === 'single' ? "col-span-1" : "md:col-span-3"
        )}>
          {/* Search and Controls */}
          {viewMode !== 'single' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search phrases or translations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{filteredPhrases.length} phrases</span>
              </div>
            </div>
          )}

          {/* Single Phrase Mode */}
          {viewMode === 'single' && filteredPhrases.length > 0 && (
            <div className="space-y-4">
              {/* Compact Navigation Bar */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                {/* Navigation Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPreviousPhrase}
                    disabled={currentPhraseIndex === 0}
                    className={clsx(
                      'flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors',
                      currentPhraseIndex === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  
                  <div className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded">
                    {currentPhraseIndex + 1} / {filteredPhrases.length}
                  </div>
                  
                  <button
                    onClick={goToNextPhrase}
                    disabled={currentPhraseIndex === filteredPhrases.length - 1}
                    className={clsx(
                      'flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors',
                      currentPhraseIndex === filteredPhrases.length - 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToRandomPhrase}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Random
                  </button>
                  
                  <button
                    onClick={toggleFilter}
                    className={clsx(
                      'p-1.5 rounded transition-colors',
                      isFilterOpen ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              {/* Compact Filter Panel */}
              {isFilterOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div>
                      <select
                        value={selectedLanguage || ''}
                        onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'th' || null)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">All Languages</option>
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <select
                        value={selectedLevel || ''}
                        onChange={(e) => setSelectedLevel(e.target.value || null)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">All Levels</option>
                        {levels.map(level => (
                          <option key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <select
                        value={selectedTopic || ''}
                        onChange={(e) => setSelectedTopic(e.target.value || null)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">All Topics</option>
                        {topics.map(topic => (
                          <option key={topic} value={topic}>
                            {topic.charAt(0).toUpperCase() + topic.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <button
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                        className={clsx(
                          'w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors',
                          showSavedOnly
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <BookmarkCheck size={14} />
                        <span>Saved</span>
                      </button>
                    </div>
                    
                    {(selectedLevel || selectedTopic || selectedLanguage || showSavedOnly) && (
                      <div>
                        <button
                          onClick={clearFilters}
                          className="w-full text-xs text-blue-600 hover:text-blue-800 py-1.5"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                    
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                      <div className="text-xs text-gray-500 py-1.5 text-center">
                        <div>Use ← → keys to navigate</div>
                        <div>Press F for fullscreen</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Phrase */}
              <div className="max-w-5xl mx-auto">
                <PhraseCard
                  key={filteredPhrases[currentPhraseIndex]?.id}
                  phrase={filteredPhrases[currentPhraseIndex]}
                  onSave={handleSavePhrase}
                  onRecordingComplete={handleRecordingComplete}
                  onEvaluate={handleEvaluate}
                  getAudioUrl={getAudioUrl}
                  getTranslations={getTranslations}
                  showZoomButton={true}
                  onZoom={toggleFullscreen}
                />
              </div>
            </div>
          )}

          {/* List View Mode */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredPhrases.length > 0 ? (
                <div className="max-w-4xl mx-auto">
                  {filteredPhrases.map(phrase => (
                    <div key={phrase.id} className="mb-3 last:mb-0">
                      <PhraseCard
                        phrase={phrase}
                        onSave={handleSavePhrase}
                        onRecordingComplete={handleRecordingComplete}
                        onEvaluate={handleEvaluate}
                        getAudioUrl={getAudioUrl}
                        getTranslations={getTranslations}
                        showZoomButton={true}
                        onZoom={() => {
                          const phraseIndex = filteredPhrases.findIndex(p => p.id === phrase.id);
                          setCurrentPhraseIndex(phraseIndex);
                          toggleFullscreen();
                        }}
                        compact={true}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedLevel || selectedTopic || selectedLanguage || showSavedOnly
                      ? 'No phrases match your current filters.'
                      : 'No phrases available.'}
                  </p>
                  {(searchQuery || selectedLevel || selectedTopic || selectedLanguage || showSavedOnly) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Grid View Mode */}
          {viewMode === 'grid' && (
            <>
              {filteredPhrases.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPhrases.map(phrase => (
                    <PhraseCard
                      key={phrase.id}
                      phrase={phrase}
                      onSave={handleSavePhrase}
                      onRecordingComplete={handleRecordingComplete}
                      onEvaluate={handleEvaluate}
                      getAudioUrl={getAudioUrl}
                      getTranslations={getTranslations}
                      showZoomButton={true}
                      onZoom={() => {
                        const phraseIndex = filteredPhrases.findIndex(p => p.id === phrase.id);
                        setCurrentPhraseIndex(phraseIndex);
                        toggleFullscreen();
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedLevel || selectedTopic || selectedLanguage || showSavedOnly
                      ? 'No phrases match your current filters.'
                      : 'No phrases available.'}
                  </p>
                  {(searchQuery || selectedLevel || selectedTopic || selectedLanguage || showSavedOnly) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty State for Single Mode */}
          {viewMode === 'single' && filteredPhrases.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedLevel || selectedTopic || selectedLanguage || showSavedOnly
                  ? 'No phrases match your current filters.'
                  : 'No phrases available.'}
              </p>
              {(searchQuery || selectedLevel || selectedTopic || selectedLanguage || showSavedOnly) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && filteredPhrases.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <div className="relative w-full h-full max-w-6xl mx-auto p-2 sm:p-4 flex flex-col">
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 bg-black bg-opacity-50 rounded-lg px-2 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-4 text-white">
                <button
                  onClick={goToPreviousPhrase}
                  disabled={currentPhraseIndex === 0}
                  className={clsx(
                    'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors',
                    currentPhraseIndex === 0
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  )}
                >
                  <ChevronLeft size={20} />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                
                <div className="bg-white bg-opacity-20 px-2 sm:px-4 py-1.5 sm:py-2 rounded text-white font-medium text-sm">
                  {currentPhraseIndex + 1} / {filteredPhrases.length}
                </div>
                
                <button
                  onClick={goToNextPhrase}
                  disabled={currentPhraseIndex === filteredPhrases.length - 1}
                  className={clsx(
                    'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors',
                    currentPhraseIndex === filteredPhrases.length - 1
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  )}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={goToRandomPhrase}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  <span className="hidden sm:inline">Random Phrase</span>
                  <span className="sm:hidden">Random</span>
                </button>
                
                <button
                  onClick={exitFullscreen}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Exit fullscreen (Esc)"
                >
                  <X size={20} />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Fullscreen Phrase Content */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl">
                <PhraseCard
                  key={`fullscreen-${filteredPhrases[currentPhraseIndex]?.id}`}
                  phrase={filteredPhrases[currentPhraseIndex]}
                  onSave={handleSavePhrase}
                  onRecordingComplete={handleRecordingComplete}
                  onEvaluate={handleEvaluate}
                  getAudioUrl={getAudioUrl}
                  getTranslations={getTranslations}
                  showZoomButton={false}
                />
              </div>
            </div>

            {/* Fullscreen Footer */}
            <div className="mt-2 sm:mt-4 text-center text-white text-xs sm:text-sm opacity-75">
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-6">
                <span>← → Arrow keys to navigate</span>
                <span>Spacebar for random phrase</span>
                <span>ESC to exit fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhrasePractice;