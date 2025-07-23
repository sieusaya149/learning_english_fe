import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth0';
import { useApiClient } from '../hooks/useApiClient';
import { 
  GET_videos_authenticated, 
  AuthenticatedVideoAPI 
} from '../utils/VideoApis';

const ApiExample: React.FC = () => {
  const { getAccessToken, user, isAuthenticated } = useAuth();
  const { authApiV1, authClient } = useApiClient();
  const [videos, setVideos] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Example 1: Get access token directly
  const handleGetToken = async () => {
    try {
      const token = await getAccessToken();
      setAccessToken(token);
      console.log('Access Token:', token);
    } catch (err) {
      setError('Failed to get access token');
      console.error('Error getting token:', err);
    }
  };

  // Example 2: Using authenticated API functions with ApiClient
  const handleGetVideos = async () => {
    if (!authApiV1) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await GET_videos_authenticated(authApiV1);
      setVideos(data);
      console.log('Videos:', data);
    } catch (err) {
      setError('Failed to fetch videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Using direct ApiClient calls
  const handleGetTranscript = async () => {
    if (!authApiV1) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await authApiV1.get('transcript', {
        query: { video_url: 'https://example.com/video.mp4' },
        authenticated: true
      });
      setTranscript(data);
      console.log('Transcript:', data);
    } catch (err) {
      setError('Failed to fetch transcript');
      console.error('Error fetching transcript:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example 4: Using VideoAPI class
  const handleClassBasedApi = async () => {
    if (!authApiV1) return;
    
    setLoading(true);
    setError(null);
    try {
      const videoAPI = new AuthenticatedVideoAPI(authApiV1);
      const data = await videoAPI.getVideos();
      setVideos(data);
      console.log('Class-based API result:', data);
    } catch (err) {
      setError('Class-based API failed');
      console.error('Error with class-based API:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example 5: Direct fetch with manual token (for comparison)
  const handleDirectFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://bindev.online/v1/api/videos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();
      console.log('Direct fetch result:', data);
    } catch (err) {
      setError('Direct fetch failed');
      console.error('Error with direct fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to access API functions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Auth0 + ApiClient Integration Examples</h2>
      
      {/* User Info */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold mb-2">User Information:</h3>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>

      {/* Access Token Display */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Access Token:</h3>
        <button
          onClick={handleGetToken}
          className="mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Get Access Token
        </button>
        {accessToken && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono break-all">
            {accessToken.substring(0, 50)}...
          </div>
        )}
      </div>

      {/* API Examples */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleGetVideos}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Fetch Videos (Function + ApiClient)
          </button>
          
          <button
            onClick={handleGetTranscript}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Fetch Transcript (Direct ApiClient)
          </button>
          
          <button
            onClick={handleClassBasedApi}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            VideoAPI Class Method
          </button>
          
          <button
            onClick={handleDirectFetch}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Direct Fetch (Manual Token)
          </button>
        </div>

        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {videos.length > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">Videos:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(videos, null, 2)}</pre>
          </div>
        )}

        {transcript && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">Transcript:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(transcript, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Code Examples */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">Updated Usage Examples:</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">1. Get Access Token:</h4>
            <pre className="bg-gray-100 p-2 rounded mt-1">
{`const { getAccessToken } = useAuth();
const token = await getAccessToken();`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium">2. Using ApiClient directly:</h4>
            <pre className="bg-gray-100 p-2 rounded mt-1">
{`const { authApiV1 } = useApiClient();
const videos = await authApiV1.get('videos', { authenticated: true });`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium">3. Using API Functions with ApiClient:</h4>
            <pre className="bg-gray-100 p-2 rounded mt-1">
{`const { authApiV1 } = useApiClient();
const videos = await GET_videos_authenticated(authApiV1);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">4. Using API Classes:</h4>
            <pre className="bg-gray-100 p-2 rounded mt-1">
{`const { authApiV1 } = useApiClient();
const videoAPI = new AuthenticatedVideoAPI(authApiV1);
const videos = await videoAPI.getVideos();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiExample; 