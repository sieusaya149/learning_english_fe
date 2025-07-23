import React, { useState } from 'react';
import { useApiClient } from '../hooks/useApiClient';
import { VideoAPI, AuthenticatedVideoAPI, createVideoAPI, createAuthenticatedVideoAPI } from '../utils/VideoApis';
import { ApiClient } from '../utils/ApiClient';

const ApiClientExample: React.FC = () => {
  const { apiV1, authApiV1, authClient, isAuthenticated } = useApiClient();
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
        <p className="text-yellow-800">Please log in to test authenticated API calls.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold mb-6">ApiClient Usage Examples</h2>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Method 1: Direct ApiClient Usage */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">1. Direct ApiClient Usage</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleApiCall('direct-get', () =>
                apiV1.get('videos')
              )}
              disabled={loading['direct-get']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['direct-get'] ? 'Loading...' : 'GET Videos (Public)'}
            </button>

            <button
              onClick={() => handleApiCall('direct-auth-get', () =>
                authApiV1.get('videos', { authenticated: true })
              )}
              disabled={loading['direct-auth-get']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['direct-auth-get'] ? 'Loading...' : 'GET Videos (Authenticated)'}
            </button>

            <button
              onClick={() => handleApiCall('direct-post', () =>
                authApiV1.post('generate_transcript', 
                  { video_url: 'https://example.com/video.mp4' },
                  { authenticated: true }
                )
              )}
              disabled={loading['direct-post']}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading['direct-post'] ? 'Loading...' : 'POST Generate Transcript'}
            </button>
          </div>
        </div>

        {/* Method 2: Using VideoAPI Classes */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">2. Using VideoAPI Classes</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                const videoAPI = new VideoAPI(apiV1);
                return handleApiCall('class-get', () => videoAPI.getVideos());
              }}
              disabled={loading['class-get']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['class-get'] ? 'Loading...' : 'VideoAPI.getVideos() (Public)'}
            </button>

            <button
              onClick={() => {
                const authVideoAPI = new AuthenticatedVideoAPI(authApiV1);
                return handleApiCall('class-auth-get', () => authVideoAPI.getVideos());
              }}
              disabled={loading['class-auth-get']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['class-auth-get'] ? 'Loading...' : 'AuthVideoAPI.getVideos()'}
            </button>

            <button
              onClick={() => {
                const authVideoAPI = new AuthenticatedVideoAPI(authApiV1);
                return handleApiCall('class-transcript', () => 
                  authVideoAPI.getTranscriptStatus('https://example.com/video.mp4')
                );
              }}
              disabled={loading['class-transcript']}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading['class-transcript'] ? 'Loading...' : 'Get Transcript Status'}
            </button>
          </div>
        </div>

        {/* Method 3: Using Factory Functions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">3. Using Factory Functions</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                const videoAPI = createVideoAPI(apiV1);
                return handleApiCall('factory-get', () => videoAPI.getVideos());
              }}
              disabled={loading['factory-get']}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading['factory-get'] ? 'Loading...' : 'Factory VideoAPI (Public)'}
            </button>

            <button
              onClick={() => {
                const authVideoAPI = createAuthenticatedVideoAPI(authApiV1);
                return handleApiCall('factory-auth-get', () => authVideoAPI.getVideos());
              }}
              disabled={loading['factory-auth-get']}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading['factory-auth-get'] ? 'Loading...' : 'Factory AuthVideoAPI'}
            </button>
          </div>
        </div>

        {/* Method 4: Advanced Configuration */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">4. Advanced Configuration</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                const customClient = authClient.withHeaders({ 'X-Custom-Header': 'test' });
                return handleApiCall('custom-headers', () =>
                  customClient.get('videos', { authenticated: true })
                );
              }}
              disabled={loading['custom-headers']}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading['custom-headers'] ? 'Loading...' : 'Custom Headers'}
            </button>

            <button
              onClick={() => {
                const v2Client = authClient.withVersion('/v2/api');
                return handleApiCall('v2-api', () =>
                  v2Client.get('videos', { 
                    authenticated: true,
                    timeout: 10000 // 10 second timeout
                  })
                );
              }}
              disabled={loading['v2-api']}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading['v2-api'] ? 'Loading...' : 'V2 API with Timeout'}
            </button>

            <button
              onClick={() => {
                return handleApiCall('query-params', () =>
                  authApiV1.get('transcript', {
                    query: { 
                      video_url: 'https://example.com/video.mp4',
                      format: 'json',
                      include_timestamps: true
                    },
                    authenticated: true
                  })
                );
              }}
              disabled={loading['query-params']}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              {loading['query-params'] ? 'Loading...' : 'Complex Query Params'}
            </button>
          </div>
        </div>

        {/* Method 5: Generic Client Usage */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">5. Generic Client Usage</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                return handleApiCall('generic-request', () =>
                  authClient.request({
                    endpoint: 'videos',
                    method: 'GET',
                    authenticated: true,
                    headers: { 'Accept': 'application/json' }
                  })
                );
              }}
              disabled={loading['generic-request']}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {loading['generic-request'] ? 'Loading...' : 'Generic Request Method'}
            </button>

            <button
              onClick={() => {
                return handleApiCall('generic-put', () =>
                  authClient.put('user/preferences', 
                    { theme: 'dark', language: 'en' },
                    { authenticated: true }
                  )
                );
              }}
              disabled={loading['generic-put']}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading['generic-put'] ? 'Loading...' : 'PUT User Preferences'}
            </button>
          </div>
        </div>

        {/* Method 6: Error Handling Examples */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">6. Error Handling</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                return handleApiCall('404-error', () =>
                  authApiV1.get('nonexistent-endpoint', { authenticated: true })
                );
              }}
              disabled={loading['404-error']}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading['404-error'] ? 'Loading...' : 'Test 404 Error'}
            </button>

            <button
              onClick={() => {
                return handleApiCall('timeout-error', () =>
                  authApiV1.get('videos', { 
                    authenticated: true,
                    timeout: 1 // 1ms timeout - will fail
                  })
                );
              }}
              disabled={loading['timeout-error']}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading['timeout-error'] ? 'Loading...' : 'Test Timeout Error'}
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
        <h3 className="text-lg font-semibold mb-4">Usage Examples in Code</h3>
        <div className="space-y-4 text-sm">
          
          <div>
            <h4 className="font-medium mb-2">1. Simple GET request:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`const { authApiV1 } = useApiClient();
const videos = await authApiV1.get('videos', { authenticated: true });`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. POST request with body:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`const { authApiV1 } = useApiClient();
const result = await authApiV1.post('generate_transcript', 
  { video_url: 'https://example.com/video.mp4' },
  { authenticated: true }
);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Using VideoAPI class:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`const { authApiV1 } = useApiClient();
const videoAPI = new AuthenticatedVideoAPI(authApiV1);
const videos = await videoAPI.getVideos();`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">4. Advanced configuration:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`const { authClient } = useApiClient();
const customClient = authClient
  .withHeaders({ 'X-App-Version': '1.0' })
  .withVersion('/v2/api');

const result = await customClient.get('data', {
  query: { limit: 10, offset: 0 },
  authenticated: true,
  timeout: 5000
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiClientExample; 