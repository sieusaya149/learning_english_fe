import React, { useState } from 'react';
import { useApiClient } from '../hooks/useApiClient';
import { 
  GET_videos_v1,
  GET_videos_v2,
  GET_videos_authenticated,
  AuthenticatedVideoAPI,
  UserAPI,
  PracticeAPI
} from '../utils/VideoApis';

const ApiVersionExample: React.FC = () => {
  const { client, authApiV1, authApiV2, isAuthenticated } = useApiClient();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async (key: string, apiCall: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const result = await apiCall();
      setResults(prev => ({ ...prev, [key]: result }));
      console.log(`${key} result:`, result);
    } catch (err) {
      setError(`${key} failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(`${key} error:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to test API version flexibility.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">API Version Flexibility Examples</h2>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Method 1: Using Function Calls with Explicit Versions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">1. Function Calls with Version Control</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleApiCall('func-v1', () => GET_videos_v1())}
              disabled={loading['func-v1']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['func-v1'] ? 'Loading...' : 'GET Videos (v1 Function)'}
            </button>

            <button
              onClick={() => handleApiCall('func-v2', () => GET_videos_v2())}
              disabled={loading['func-v2']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['func-v2'] ? 'Loading...' : 'GET Videos (v2 Function)'}
            </button>

            <button
              onClick={() => handleApiCall('func-auth-v1', () => 
                GET_videos_authenticated(client, 'v1')
              )}
              disabled={loading['func-auth-v1']}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading['func-auth-v1'] ? 'Loading...' : 'GET Videos Auth (v1)'}
            </button>

            <button
              onClick={() => handleApiCall('func-auth-v2', () => 
                GET_videos_authenticated(client, 'v2')
              )}
              disabled={loading['func-auth-v2']}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading['func-auth-v2'] ? 'Loading...' : 'GET Videos Auth (v2)'}
            </button>
          </div>
        </div>

        {/* Method 2: Direct Client with Version Override */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">2. Direct Client with Version Override</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleApiCall('direct-v1', () =>
                client.get('videos', { 
                  authenticated: true,
                  apiVersion: '/v1/api'
                })
              )}
              disabled={loading['direct-v1']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['direct-v1'] ? 'Loading...' : 'Direct Client (v1 Override)'}
            </button>

            <button
              onClick={() => handleApiCall('direct-v2', () =>
                client.get('videos', { 
                  authenticated: true,
                  apiVersion: '/v2/api'
                })
              )}
              disabled={loading['direct-v2']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['direct-v2'] ? 'Loading...' : 'Direct Client (v2 Override)'}
            </button>

            <button
              onClick={() => handleApiCall('direct-mixed', () =>
                // Example of calling different versions in sequence
                Promise.all([
                  client.get('videos', { authenticated: true, apiVersion: '/v1/api' }),
                  client.get('user/profile', { authenticated: true, apiVersion: '/v2/api' })
                ]).then(([videos, profile]) => ({ videos, profile }))
              )}
              disabled={loading['direct-mixed']}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading['direct-mixed'] ? 'Loading...' : 'Mixed Versions (v1 + v2)'}
            </button>
          </div>
        </div>

        {/* Method 3: Default Version Clients */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">3. Default Version Clients</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleApiCall('default-v1', () =>
                authApiV1.get('videos', { authenticated: true })
              )}
              disabled={loading['default-v1']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['default-v1'] ? 'Loading...' : 'V1 Client (Default)'}
            </button>

            <button
              onClick={() => handleApiCall('default-v2', () =>
                authApiV2.get('videos', { authenticated: true })
              )}
              disabled={loading['default-v2']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['default-v2'] ? 'Loading...' : 'V2 Client (Default)'}
            </button>

            <button
              onClick={() => handleApiCall('override-default', () =>
                // Using v1 client but overriding to v2
                authApiV1.get('videos', { 
                  authenticated: true, 
                  apiVersion: '/v2/api' 
                })
              )}
              disabled={loading['override-default']}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading['override-default'] ? 'Loading...' : 'V1 Client → V2 Override'}
            </button>
          </div>
        </div>

        {/* Method 4: Class-Based APIs with Versions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">4. Class-Based APIs with Versions</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                const videoAPI = new AuthenticatedVideoAPI(client);
                return handleApiCall('class-v1', () => videoAPI.getVideos('v1'));
              }}
              disabled={loading['class-v1']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['class-v1'] ? 'Loading...' : 'VideoAPI.getVideos(v1)'}
            </button>

            <button
              onClick={() => {
                const videoAPI = new AuthenticatedVideoAPI(client);
                return handleApiCall('class-v2', () => videoAPI.getVideos('v2'));
              }}
              disabled={loading['class-v2']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['class-v2'] ? 'Loading...' : 'VideoAPI.getVideos(v2)'}
            </button>

            <button
              onClick={() => {
                const practiceAPI = new PracticeAPI(client);
                return handleApiCall('class-mixed', () => 
                  Promise.all([
                    practiceAPI.getPhrases('beginner'),      // v1 by default
                    practiceAPI.getPhrasesV2('beginner')     // v2 explicitly
                  ]).then(([v1Phrases, v2Phrases]) => ({ v1Phrases, v2Phrases }))
                );
              }}
              disabled={loading['class-mixed']}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading['class-mixed'] ? 'Loading...' : 'Practice: V1 + V2 Phrases'}
            </button>
          </div>
        </div>

        {/* Method 5: Real-World Mixed API Scenario */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">5. Real-World Mixed Scenario</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                const userAPI = new UserAPI(client);
                return handleApiCall('real-world', () => 
                  Promise.all([
                    // User preferences might still be v1
                    userAPI.getPreferences(),
                    // But profile is v2
                    userAPI.getProfile(), 
                    // And practice history is v2
                    userAPI.getPracticeHistory()
                  ]).then(([preferences, profile, history]) => ({
                    preferences,
                    profile,
                    history
                  }))
                );
              }}
              disabled={loading['real-world']}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              {loading['real-world'] ? 'Loading...' : 'User Data (Mixed V1/V2)'}
            </button>

            <button
              onClick={() => handleApiCall('version-specific', () =>
                // Demonstrate calling specific endpoints based on their version
                Promise.all([
                  client.get('videos', { 
                    authenticated: true, 
                    apiVersion: '/v1/api' 
                  }),
                  client.get('user/achievements', { 
                    authenticated: true, 
                    apiVersion: '/v2/api' 
                  }),
                  client.post('practice/sessions', 
                    { sessionType: 'repeat', duration: 300 },
                    { 
                      authenticated: true, 
                      apiVersion: '/v2/api' 
                    }
                  )
                ]).then(([videos, achievements, session]) => ({
                  videos,
                  achievements,
                  session
                }))
              )}
              disabled={loading['version-specific']}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded hover:from-green-600 hover:to-blue-700 disabled:opacity-50"
            >
              {loading['version-specific'] ? 'Loading...' : 'Version-Specific Calls'}
            </button>
          </div>
        </div>

        {/* Method 6: Performance Comparison */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">6. Performance & Error Handling</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleApiCall('timeout-test', () =>
                client.get('videos', {
                  authenticated: true,
                  apiVersion: '/v1/api',
                  timeout: 5000 // 5 second timeout
                })
              )}
              disabled={loading['timeout-test']}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading['timeout-test'] ? 'Loading...' : 'Custom Timeout (5s)'}
            </button>

            <button
              onClick={() => handleApiCall('version-error', () =>
                client.get('nonexistent-endpoint', {
                  authenticated: true,
                  apiVersion: '/v99/api' // Wrong version
                })
              )}
              disabled={loading['version-error']}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading['version-error'] ? 'Loading...' : 'Test Version Error'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {Object.keys(results).length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">API Results</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="border border-gray-200 rounded p-3">
                <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Examples */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Code Examples: Version Flexibility</h3>
        <div className="space-y-4 text-sm">
          
          <div>
            <h4 className="font-medium mb-2">1. Function with version parameter:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`// Same function, different versions
const videosV1 = await GET_videos_authenticated(client, 'v1');
const videosV2 = await GET_videos_authenticated(client, 'v2');`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Direct client with version override:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`// Override version per request
const videos = await client.get('videos', {
  authenticated: true,
  apiVersion: '/v2/api'  // Use v2 for this call
});`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Mixed versions in one component:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`// Different endpoints, different versions
const [videos, profile, phrases] = await Promise.all([
  client.get('videos', { authenticated: true, apiVersion: '/v1/api' }),
  client.get('user/profile', { authenticated: true, apiVersion: '/v2/api' }),
  client.get('practice/phrases', { authenticated: true, apiVersion: '/v1/api' })
]);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">4. Class methods with version control:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`// API classes support version parameters
const videoAPI = new AuthenticatedVideoAPI(client);
const videosV1 = await videoAPI.getVideos('v1');
const videosV2 = await videoAPI.getVideos('v2');

const practiceAPI = new PracticeAPI(client);
const phrasesV1 = await practiceAPI.getPhrases('beginner');     // v1
const phrasesV2 = await practiceAPI.getPhrasesV2('beginner');   // v2`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiVersionExample; 