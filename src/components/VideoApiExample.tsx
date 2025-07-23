import React, { useState, useEffect } from 'react';
import { useVideoApi } from '../hooks/useVideoApi';

const VideoApiExample: React.FC = () => {
  const { videoApi, authVideoApi, isAuthenticated } = useVideoApi();
  const [videos, setVideos] = useState<any[]>([]);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example 1: Using public video API (no auth required)
  const fetchPublicVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await videoApi.getVideos('v1');
      setVideos(result);
      console.log('Public videos:', result);
    } catch (err) {
      setError(`Failed to fetch public videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Using authenticated video API (Auth0 token included automatically)
  const fetchAuthenticatedVideos = async () => {
    if (!authVideoApi) return;
    
    setLoading(true);
    setError(null);
    try {
      // This will automatically include the Auth0 access token
      const result = await authVideoApi.getVideos('v1');
      setVideos(result);
      console.log('Authenticated videos:', result);
    } catch (err) {
      setError(`Failed to fetch authenticated videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Fetch user-specific videos
  const fetchUserVideos = async () => {
    if (!authVideoApi) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await authVideoApi.getUserVideos();
      setUserVideos(result);
      console.log('User videos:', result);
    } catch (err) {
      setError(`Failed to fetch user videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Example 4: Generate transcript with authentication
  const generateTranscript = async (videoUrl: string) => {
    if (!authVideoApi) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await authVideoApi.generateTranscript(videoUrl, 'v1');
      console.log('Transcript generation started:', result);
      // You might want to show a success message here
    } catch (err) {
      setError(`Failed to generate transcript: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Video API with Auth0 Examples</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Authentication Status</h3>
        <p className={`${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
          {isAuthenticated ? '✅ Authenticated (Auth0 token available)' : '❌ Not authenticated'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Public API (No Auth)</h3>
          <button
            onClick={fetchPublicVideos}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Public Videos'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Uses videoApi.getVideos() - no authentication required
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Authenticated API</h3>
          <button
            onClick={fetchAuthenticatedVideos}
            disabled={loading || !isAuthenticated}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Auth Videos'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Uses authVideoApi.getVideos() - includes Auth0 token automatically
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">User Videos</h3>
          <button
            onClick={fetchUserVideos}
            disabled={loading || !isAuthenticated}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch User Videos'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Uses authVideoApi.getUserVideos() - user-specific content
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Generate Transcript</h3>
          <button
            onClick={() => generateTranscript('https://example.com/video.mp4')}
            disabled={loading || !isAuthenticated}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Transcript'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Uses authVideoApi.generateTranscript() - authenticated action
          </p>
        </div>
      </div>

      {/* Results Display */}
      {videos.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Videos Results</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-48">
            {JSON.stringify(videos, null, 2)}
          </pre>
        </div>
      )}

      {userVideos.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">User Videos Results</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto max-h-48">
            {JSON.stringify(userVideos, null, 2)}
          </pre>
        </div>
      )}

      {/* Code Examples */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">How to Use in Your Components</h3>
        <div className="space-y-4 text-sm">
          
          <div>
            <h4 className="font-medium mb-2">1. Import the hook:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`import { useVideoApi } from '../hooks/useVideoApi';`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Use in your component:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`const MyComponent = () => {
  const { videoApi, authVideoApi, isAuthenticated } = useVideoApi();

  // Public API (no auth)
  const publicVideos = await videoApi.getVideos('v1');
  
  // Authenticated API (Auth0 token included automatically)
  if (authVideoApi && isAuthenticated) {
    const authVideos = await authVideoApi.getVideos('v1');
    const userVideos = await authVideoApi.getUserVideos();
    const transcript = await authVideoApi.generateTranscript(videoUrl);
  }
};`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Available Methods:</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`// AuthenticatedVideoAPI methods (all include Auth0 token):
await authVideoApi.getVideos(version?)
await authVideoApi.getTranscriptStatus(videoUrl, version?)
await authVideoApi.getTranscript(videoUrl, version?)
await authVideoApi.generateTranscript(videoUrl, version?)
await authVideoApi.getUserVideos()
await authVideoApi.getUserPracticeStats()
await authVideoApi.updateUserPreferences(preferences)
await authVideoApi.deleteUserVideo(videoId)`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoApiExample; 