import React, { useState, useEffect } from 'react';
import { useApiClient } from '../hooks/useApiClient';
import { useAuth } from '../hooks/useAuth0';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiExample {
  name: string;
  method: HttpMethod;
  endpoint: string;
  apiVersion: string;
  authenticated: boolean;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  description: string;
}

interface RequestResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  timing: number;
  requestHeaders: Record<string, string>;
  requestUrl: string;
}

const API_EXAMPLES: ApiExample[] = [
  {
    name: 'Get Videos (v1)',
    method: 'GET',
    endpoint: 'videos',
    apiVersion: '/v1/api',
    authenticated: true,
    description: 'Fetch all videos using v1 API'
  },
  {
    name: 'Get Videos (v2)',
    method: 'GET',
    endpoint: 'videos',
    apiVersion: '/v2/api',
    authenticated: true,
    description: 'Fetch all videos using v2 API'
  },
  {
    name: 'Get User Profile',
    method: 'GET',
    endpoint: 'user/profile',
    apiVersion: '/v2/api',
    authenticated: true,
    description: 'Get authenticated user profile'
  },
  {
    name: 'Get Transcript Status',
    method: 'GET',
    endpoint: 'transcript-status',
    apiVersion: '/v1/api',
    authenticated: true,
    query: { video_url: 'https://example.com/video.mp4' },
    description: 'Check transcript generation status'
  },
  {
    name: 'Generate Transcript',
    method: 'POST',
    endpoint: 'generate_transcript',
    apiVersion: '/v1/api',
    authenticated: true,
    body: { video_url: 'https://example.com/video.mp4' },
    description: 'Start transcript generation for a video'
  },
  {
    name: 'Update User Preferences',
    method: 'PUT',
    endpoint: 'user/preferences',
    apiVersion: '/v1/api',
    authenticated: true,
    body: { theme: 'dark', language: 'en', notifications: true },
    description: 'Update user preferences'
  },
  {
    name: 'Record Practice Session',
    method: 'POST',
    endpoint: 'practice/sessions',
    apiVersion: '/v2/api',
    authenticated: true,
    body: { 
      sessionType: 'repeat', 
      duration: 300, 
      videoId: 'video_123',
      score: 85
    },
    description: 'Record a practice session'
  },
  {
    name: 'Get Practice Progress',
    method: 'GET',
    endpoint: 'practice/progress',
    apiVersion: '/v2/api',
    authenticated: true,
    description: 'Get user practice progress and statistics'
  },
  {
    name: 'Get Phrases (v1)',
    method: 'GET',
    endpoint: 'practice/phrases',
    apiVersion: '/v1/api',
    authenticated: true,
    query: { level: 'beginner', topic: 'greetings' },
    description: 'Get practice phrases with filters'
  },
  {
    name: 'Delete User Video',
    method: 'DELETE',
    endpoint: 'user/videos/video_123',
    apiVersion: '/v2/api',
    authenticated: true,
    description: 'Delete a user video'
  }
];

const ApiTester: React.FC = () => {
  const { client } = useApiClient();
  const { user, isAuthenticated, getAccessToken } = useAuth();
  
  // Form state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [endpoint, setEndpoint] = useState('videos');
  const [apiVersion, setApiVersion] = useState('/v1/api');
  const [authenticated, setAuthenticated] = useState(true);
  const [requestBody, setRequestBody] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [queryParams, setQueryParams] = useState('');
  const [timeout, setTimeout] = useState(30000);
  
  // Results state
  const [result, setResult] = useState<RequestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>('');

  // Load example
  const loadExample = (exampleName: string) => {
    const example = API_EXAMPLES.find(ex => ex.name === exampleName);
    if (!example) return;

    setMethod(example.method);
    setEndpoint(example.endpoint);
    setApiVersion(example.apiVersion);
    setAuthenticated(example.authenticated);
    setRequestBody(example.body ? JSON.stringify(example.body, null, 2) : '');
    setCustomHeaders(example.headers ? JSON.stringify(example.headers, null, 2) : '');
    setQueryParams(example.query ? JSON.stringify(example.query, null, 2) : '');
    setSelectedExample(exampleName);
  };

  // Parse JSON safely
  const parseJson = (jsonString: string) => {
    if (!jsonString.trim()) return {};
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  // Execute API request
  const executeRequest = async () => {
    if (!client) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      // Parse form data
      const body = parseJson(requestBody);
      const headers = parseJson(customHeaders);
      const query = parseJson(queryParams);

      // Build request config
      const requestConfig: any = {
        apiVersion,
        authenticated,
        timeout,
      };

      if (Object.keys(headers).length > 0) {
        requestConfig.headers = headers;
      }

      if (Object.keys(query).length > 0) {
        requestConfig.query = query;
      }

      // Get access token for display
      let requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };

      if (authenticated && isAuthenticated) {
        const token = await getAccessToken();
        if (token) {
          requestHeaders.Authorization = `Bearer ${token}`;
        }
      }

      // Build URL for display
      const baseUrl = 'https://bindev.online';
      let requestUrl = `${baseUrl}${apiVersion}/${endpoint}`;
      if (Object.keys(query).length > 0) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        requestUrl += `?${params.toString()}`;
      }

      // Execute request
      let response;
      switch (method) {
        case 'GET':
          response = await client.get(endpoint, requestConfig);
          break;
        case 'POST':
          response = await client.post(endpoint, body, requestConfig);
          break;
        case 'PUT':
          response = await client.put(endpoint, body, requestConfig);
          break;
        case 'DELETE':
          response = await client.delete(endpoint, requestConfig);
          break;
        case 'PATCH':
          response = await client.patch(endpoint, body, requestConfig);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const timing = Date.now() - startTime;

      setResult({
        success: true,
        data: response,
        timing,
        requestHeaders,
        requestUrl,
        status: 200,
        statusText: 'OK'
      });

    } catch (error: any) {
      const timing = Date.now() - startTime;
      
      // Try to extract status from error message
      let status = 0;
      let statusText = 'Error';
      const errorMessage = error.message || 'Unknown error';
      
      const statusMatch = errorMessage.match(/HTTP (\d+):/);
      if (statusMatch) {
        status = parseInt(statusMatch[1]);
        statusText = errorMessage.split(': ')[1] || statusText;
      }

      setResult({
        success: false,
        error: errorMessage,
        timing,
        requestHeaders: {},
        requestUrl: '',
        status,
        statusText
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">API Tester</h1>
        {isAuthenticated && (
          <div className="text-sm text-gray-600">
            Authenticated as: <span className="font-medium">{user?.email}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="space-y-6">
          {/* Examples */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3">API Examples</h3>
            <select
              value={selectedExample}
              onChange={(e) => loadExample(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an example...</option>
              {API_EXAMPLES.map((example) => (
                <option key={example.name} value={example.name}>
                  {example.method} - {example.name}
                </option>
              ))}
            </select>
            {selectedExample && (
              <p className="mt-2 text-sm text-gray-600">
                {API_EXAMPLES.find(ex => ex.name === selectedExample)?.description}
              </p>
            )}
          </div>

          {/* Request Configuration */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3">Request Configuration</h3>
            
            {/* Method and Endpoint */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="endpoint"
                className="col-span-3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* API Version */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Version
              </label>
              <select
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="/v1/api">/v1/api</option>
                <option value="/v2/api">/v2/api</option>
              </select>
            </div>

            {/* Authentication */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={authenticated}
                  onChange={(e) => setAuthenticated(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Authenticated Request
                </span>
              </label>
              {authenticated && !isAuthenticated && (
                <p className="text-sm text-orange-600 mt-1">
                  Please log in to make authenticated requests
                </p>
              )}
            </div>

            {/* Timeout */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Query Parameters */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3">Query Parameters</h3>
            <textarea
              value={queryParams}
              onChange={(e) => setQueryParams(e.target.value)}
              placeholder='{"param1": "value1", "param2": "value2"}'
              className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">JSON format</p>
          </div>

          {/* Custom Headers */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3">Custom Headers</h3>
            <textarea
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder='{"X-Custom-Header": "value"}'
              className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">JSON format</p>
          </div>

          {/* Request Body */}
          {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3">Request Body</h3>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">JSON format</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={executeRequest}
            disabled={loading || (authenticated && !isAuthenticated)}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending Request...' : 'Send Request'}
          </button>
        </div>

        {/* Response Panel */}
        <div className="space-y-6">
          {/* Request Info */}
          {result && (
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3">Request Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">URL:</span>
                  <div className="font-mono bg-gray-100 p-2 rounded text-xs break-all">
                    {result.requestUrl || `https://bindev.online${apiVersion}/${endpoint}`}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Method:</span> 
                  <span className="ml-2 font-mono">{method}</span>
                </div>
                <div>
                  <span className="font-medium">Timing:</span> 
                  <span className="ml-2">{result.timing}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Request Headers */}
          {result && Object.keys(result.requestHeaders).length > 0 && (
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3">Request Headers</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto font-mono">
                {JSON.stringify(result.requestHeaders, null, 2)}
              </pre>
            </div>
          )}

          {/* Response */}
          {result && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Response</h3>
                <div className="flex items-center space-x-2">
                  {result.status && (
                    <span className={`font-mono text-sm ${getStatusColor(result.status)}`}>
                      {result.status} {result.statusText}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Error'}
                  </span>
                </div>
              </div>

              {result.success ? (
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto font-mono max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 text-sm font-medium">Error:</p>
                  <p className="text-red-700 text-sm mt-1">{result.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Response Headers */}
          {result && result.headers && Object.keys(result.headers).length > 0 && (
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3">Response Headers</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto font-mono">
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </div>
          )}

          {/* No Result */}
          {!result && (
            <div className="card p-8 text-center text-gray-500">
              <p>Configure your request and click "Send Request" to see the response here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Examples Documentation */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Available API Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {API_EXAMPLES.map((example) => (
            <div
              key={example.name}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => loadExample(example.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  example.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                  example.method === 'POST' ? 'bg-green-100 text-green-800' :
                  example.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  example.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {example.method}
                </span>
                <span className="text-xs text-gray-500">{example.apiVersion}</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{example.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{example.description}</p>
              <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {example.endpoint}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiTester; 