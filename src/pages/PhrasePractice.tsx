import React, { useState, useEffect } from 'react';
import PhraseCard, { Phrase } from '../components/PhraseCard';
import { Filter, BookmarkCheck, ArrowUpDown, Search } from 'lucide-react';
import clsx from 'clsx';

// Sample phrases data
const samplePhrases: Phrase[] = [
  {
    id: '1',
    text: "I'd like to order a coffee please.",
    translation: "Quisiera pedir un café, por favor.",
    level: 'beginner',
    topic: 'restaurant',
    saved: false,
  },
  {
    id: '2',
    text: "I'm looking for the nearest subway station.",
    translation: "Estoy buscando la estación de metro más cercana.",
    level: 'beginner',
    topic: 'directions',
    saved: false,
  },
  {
    id: '3',
    text: "Could you tell me how to get to the airport?",
    translation: "¿Podría decirme cómo llegar al aeropuerto?",
    level: 'beginner',
    topic: 'directions',
    saved: true,
  },
  {
    id: '4',
    text: "I believe we should reconsider our marketing strategy based on the latest data.",
    translation: "Creo que deberíamos reconsiderar nuestra estrategia de marketing según los datos más recientes.",
    level: 'intermediate',
    topic: 'business',
    saved: false,
  },
  {
    id: '5',
    text: "The findings of this study suggest a correlation between sleep patterns and productivity.",
    translation: "Los hallazgos de este estudio sugieren una correlación entre los patrones de sueño y la productividad.",
    level: 'advanced',
    topic: 'academic',
    saved: false,
  },
  {
    id: '6',
    text: "I'm having trouble with my internet connection.",
    translation: "Estoy teniendo problemas con mi conexión a internet.",
    level: 'beginner',
    topic: 'technology',
    saved: false,
  },
  {
    id: '7',
    text: "We need to establish clear guidelines for this project to ensure consistent quality.",
    translation: "Necesitamos establecer pautas claras para este proyecto para garantizar una calidad constante.",
    level: 'intermediate',
    topic: 'business',
    saved: true,
  },
  {
    id: '8',
    text: "Could you please clarify what you mean by that?",
    translation: "¿Podría aclarar a qué se refiere con eso?",
    level: 'intermediate',
    topic: 'conversation',
    saved: false,
  },
];

const topics = [...new Set(samplePhrases.map(phrase => phrase.topic))];
const levels = ['beginner', 'intermediate', 'advanced'];

const PhrasePractice: React.FC = () => {
  const [phrases, setPhrases] = useState<Phrase[]>(samplePhrases);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>(samplePhrases);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    let result = [...phrases];
    
    // Apply level filter
    if (selectedLevel) {
      result = result.filter(phrase => phrase.level === selectedLevel);
    }
    
    // Apply topic filter
    if (selectedTopic) {
      result = result.filter(phrase => phrase.topic === selectedTopic);
    }
    
    // Apply saved filter
    if (showSavedOnly) {
      result = result.filter(phrase => phrase.saved);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        phrase => 
          phrase.text.toLowerCase().includes(query) || 
          (phrase.translation && phrase.translation.toLowerCase().includes(query))
      );
    }
    
    setFilteredPhrases(result);
  }, [phrases, selectedLevel, selectedTopic, showSavedOnly, searchQuery]);
  
  const handleSavePhrase = (phraseId: string, saved: boolean) => {
    setPhrases(prevPhrases => 
      prevPhrases.map(phrase => 
        phrase.id === phraseId ? { ...phrase, saved } : phrase
      )
    );
  };
  
  const handleRecordingComplete = (phraseId: string, blob: Blob) => {
    console.log(`Recording completed for phrase ${phraseId}`, blob);
    // In a real app, you would store this recording or upload it to a server
  };
  
  const clearFilters = () => {
    setSelectedLevel(null);
    setSelectedTopic(null);
    setSearchQuery('');
    setShowSavedOnly(false);
  };
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Phrase Practice</h1>
          <p className="text-gray-600">
            Practice common English phrases organized by level and topic. Save your favorites for later review.
          </p>
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
              
              {(selectedLevel || selectedTopic || showSavedOnly) && (
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
                placeholder="Search phrases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <ArrowUpDown size={16} />
              <span>Sort</span>
            </button>
          </div>
          
          {filteredPhrases.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPhrases.map(phrase => (
                <PhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  onSave={handleSavePhrase}
                  onRecordingComplete={handleRecordingComplete}
                />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-600">No phrases match your current filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhrasePractice;