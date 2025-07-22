import React, { useState } from 'react';
import { Upload, Plus, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { usePhraseApi } from '../hooks/usePhraseApi';

interface PhraseFormData {
  text: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  pronunciation?: string;
  romanize?: string;
  phonetic?: string;
  translations: Array<{
    language_code: string;
    translation_text: string;
  }>;
}

const AddPhrase: React.FC = () => {
  const { createPhrase, createPhraseBatch, isAuthenticated, loading } = usePhraseApi();
  
  // Single phrase form state
  const [singlePhrase, setSinglePhrase] = useState<PhraseFormData>({
    text: '',
    level: 'beginner',
    topic: '',
    pronunciation: '',
    romanize: '',
    phonetic: '',
    translations: [{ language_code: 'th', translation_text: '' }]
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<PhraseFormData[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to add phrases.</p>
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

  // Handle single phrase form changes
  const handleSinglePhraseChange = (field: keyof PhraseFormData, value: any) => {
    setSinglePhrase(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle translation changes
  const handleTranslationChange = (index: number, field: 'language_code' | 'translation_text', value: string) => {
    setSinglePhrase(prev => ({
      ...prev,
      translations: prev.translations.map((trans, i) => 
        i === index ? { ...trans, [field]: value } : trans
      )
    }));
  };

  // Add new translation
  const addTranslation = () => {
    setSinglePhrase(prev => ({
      ...prev,
      translations: [...prev.translations, { language_code: 'en', translation_text: '' }]
    }));
  };

  // Remove translation
  const removeTranslation = (index: number) => {
    if (singlePhrase.translations.length > 1) {
      setSinglePhrase(prev => ({
        ...prev,
        translations: prev.translations.filter((_, i) => i !== index)
      }));
    }
  };

  // Submit single phrase
  const handleSinglePhraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Filter out empty translations
      const filteredTranslations = singlePhrase.translations.filter(
        trans => trans.translation_text.trim() !== ''
      );

      const phraseData = {
        ...singlePhrase,
        translations: filteredTranslations.length > 0 ? filteredTranslations : undefined
      };

      await createPhrase(phraseData);
      setSubmitStatus({ type: 'success', message: 'Phrase created successfully!' });
      
      // Reset form
      setSinglePhrase({
        text: '',
        level: 'beginner',
        topic: '',
        pronunciation: '',
        romanize: '',
        phonetic: '',
        translations: [{ language_code: 'th', translation_text: '' }]
      });
    } catch (error: any) {
      setSubmitStatus({ type: 'error', message: error.message || 'Failed to create phrase' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CSV file selection
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      setSubmitStatus({ type: 'error', message: 'Please select a valid CSV file' });
    }
  };

  // Parse CSV file
  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setSubmitStatus({ type: 'error', message: 'CSV must have at least a header and one data row' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['text', 'level', 'topic'];
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        setSubmitStatus({ 
          type: 'error', 
          message: 'CSV must include columns: text, level, topic. Optional: pronunciation, romanize, phonetic, translation_en, translation_th' 
        });
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setCsvData(data);
      
      // Convert to phrase format for preview
      const preview = data.map(row => ({
        text: row.text || '',
        level: (row.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        topic: row.topic || '',
        pronunciation: row.pronunciation || '',
        romanize: row.romanize || '',
        phonetic: row.phonetic || '',
        translations: [
          ...(row.translation_en ? [{ language_code: 'en', translation_text: row.translation_en }] : []),
          ...(row.translation_th ? [{ language_code: 'th', translation_text: row.translation_th }] : [])
        ]
      }));

      setCsvPreview(preview);
      setSubmitStatus({ type: 'success', message: `Loaded ${data.length} phrases from CSV` });
    };

    reader.readAsText(file);
  };

  // Submit CSV phrases
  const handleCsvSubmit = async () => {
    if (csvPreview.length === 0) {
      setSubmitStatus({ type: 'error', message: 'No phrases to submit' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      await createPhraseBatch(csvPreview);
      setSubmitStatus({ type: 'success', message: `Successfully created ${csvPreview.length} phrases!` });
      
      // Reset CSV state
      setCsvFile(null);
      setCsvData([]);
      setCsvPreview([]);
    } catch (error: any) {
      setSubmitStatus({ type: 'error', message: error.message || 'Failed to create phrases from CSV' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add Phrases</h1>

        {/* Status Message */}
        {submitStatus.type && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {submitStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{submitStatus.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="inline w-4 h-4 mr-2" />
            Single Phrase
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'csv'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="inline w-4 h-4 mr-2" />
            CSV Upload
          </button>
        </div>

        {/* Single Phrase Form */}
        {activeTab === 'single' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Single Phrase</h2>
            
            <form onSubmit={handleSinglePhraseSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phrase Text *
                  </label>
                  <input
                    type="text"
                    value={singlePhrase.text}
                    onChange={(e) => handleSinglePhraseChange('text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <select
                    value={singlePhrase.level}
                    onChange={(e) => handleSinglePhraseChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <input
                    type="text"
                    value={singlePhrase.topic}
                    onChange={(e) => handleSinglePhraseChange('topic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pronunciation
                  </label>
                  <input
                    type="text"
                    value={singlePhrase.pronunciation}
                    onChange={(e) => handleSinglePhraseChange('pronunciation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Romanize
                  </label>
                  <input
                    type="text"
                    value={singlePhrase.romanize}
                    onChange={(e) => handleSinglePhraseChange('romanize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phonetic
                  </label>
                  <input
                    type="text"
                    value={singlePhrase.phonetic}
                    onChange={(e) => handleSinglePhraseChange('phonetic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Translations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Translations
                  </label>
                  <button
                    type="button"
                    onClick={addTranslation}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Translation
                  </button>
                </div>

                <div className="space-y-3">
                  {singlePhrase.translations.map((translation, index) => (
                    <div key={index} className="flex gap-3">
                      <select
                        value={translation.language_code}
                        onChange={(e) => handleTranslationChange(index, 'language_code', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">EN</option>
                        <option value="th">TH</option>
                        <option value="ja">JA</option>
                        <option value="ko">KO</option>
                        <option value="zh">ZH</option>
                      </select>
                      <input
                        type="text"
                        value={translation.translation_text}
                        onChange={(e) => handleTranslationChange(index, 'translation_text', e.target.value)}
                        placeholder="Translation text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {singlePhrase.translations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTranslation(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Phrase
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CSV Upload */}
        {activeTab === 'csv' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>
              
              <div className="mb-4">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> CSV file
                      </p>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {csvFile && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{csvFile.name}</span>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 mb-4">
                <p className="font-medium mb-2">CSV Format Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Required columns:</strong> text, level, topic</li>
                  <li><strong>Optional columns:</strong> pronunciation, romanize, phonetic, translation_en, translation_th</li>
                  <li><strong>Level values:</strong> beginner, intermediate, advanced</li>
                  <li>First row should contain column headers</li>
                </ul>
              </div>

              {csvPreview.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleCsvSubmit}
                    disabled={isSubmitting || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Create {csvPreview.length} Phrases
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preview ({csvPreview.length} phrases)
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Text</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Level</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Topic</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Translations</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {csvPreview.slice(0, 10).map((phrase, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2 text-sm text-gray-900">{phrase.text}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 capitalize">{phrase.level}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{phrase.topic}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {phrase.translations.map(t => `${t.language_code}: ${t.translation_text}`).join(', ') || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 10 && (
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      Showing first 10 of {csvPreview.length} phrases
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPhrase; 