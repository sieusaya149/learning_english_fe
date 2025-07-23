import React, { useState, useEffect } from 'react';
import PhraseCard from '../components/PhraseCard';
import { Filter, BookmarkCheck, ArrowUpDown, Search, Loader2 } from 'lucide-react';
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
        
        <button
          onClick={toggleFilter}
          className={clsx(
            'md:hidden p-2 rounded-md',
            isFilterOpen ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Filter size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        
        <div className="md:col-span-3 space-y-6">
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
        </div>
      </div>
    </div>
  );
};

export default PhrasePractice;