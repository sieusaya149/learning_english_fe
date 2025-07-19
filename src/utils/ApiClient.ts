type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiPort = import.meta.env.VITE_API_PORT;

interface ApiClientConfig {
  baseUrl?: string;
  defaultApiVersion?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

interface RequestConfig {
  endpoint: string;
  method?: HttpMethod;
  apiVersion?: string; // Allow version override per request
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: any;
  authenticated?: boolean;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultApiVersion: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private getAccessToken?: () => Promise<string | null>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || `${apiBaseUrl}:${apiPort}`;
    this.defaultApiVersion = config.defaultApiVersion || '/v1/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Set the access token getter function for authenticated requests
   */
  setAuthTokenGetter(getToken: () => Promise<string | null>) {
    this.getAccessToken = getToken;
    return this;
  }

  /**
   * Build the full URL with base URL, API version, and endpoint
   */
  private buildUrl(endpoint: string, apiVersion?: string, query?: Record<string, string | number | boolean>): string {
    // Use provided version or fall back to default
    const version = apiVersion || this.defaultApiVersion;
    
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Build base URL
    let url = `${this.baseUrl}${version}/${cleanEndpoint}`;
    
    // Add query parameters
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      url += `?${params.toString()}`;
    }
    
    return url;
  }

  /**
   * Build headers for the request
   */
  private async buildHeaders(
    requestHeaders?: Record<string, string>,
    authenticated = false
  ): Promise<Record<string, string>> {
    const headers = { ...this.defaultHeaders, ...requestHeaders };

    // Add authentication header if needed
    if (authenticated && this.getAccessToken) {
      const token = await this.getAccessToken();
      console.log('HVH token:', token);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        throw new Error('Authentication required but no access token available');
      }
    }

    return headers;
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    const {
      endpoint,
      method = 'GET',
      apiVersion,
      query,
      headers: requestHeaders,
      body,
      authenticated = false,
      timeout = this.timeout,
    } = config;

    try {
      const url = this.buildUrl(endpoint, apiVersion, query);
      const headers = await this.buildHeaders(requestHeaders, authenticated);
      console.log('header is ', headers)

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error occurred during API request');
    }
  }

  /**
   * Convenience methods for different HTTP verbs
   */

  async get<T = any>(
    endpoint: string,
    options: Omit<RequestConfig, 'endpoint' | 'method'> = {}
  ): Promise<T> {
    return this.request<T>({ ...options, endpoint, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestConfig, 'endpoint' | 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>({ ...options, endpoint, method: 'POST', body });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestConfig, 'endpoint' | 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>({ ...options, endpoint, method: 'PUT', body });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestConfig, 'endpoint' | 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>({ ...options, endpoint, method: 'PATCH', body });
  }

  async delete<T = any>(
    endpoint: string,
    options: Omit<RequestConfig, 'endpoint' | 'method'> = {}
  ): Promise<T> {
    return this.request<T>({ ...options, endpoint, method: 'DELETE' });
  }

  /**
   * Create a new instance with different configuration
   */
  clone(config: Partial<ApiClientConfig> = {}): ApiClient {
    const newClient = new ApiClient({
      baseUrl: config.baseUrl || this.baseUrl,
      defaultApiVersion: config.defaultApiVersion || this.defaultApiVersion,
      defaultHeaders: { ...this.defaultHeaders, ...config.defaultHeaders },
      timeout: config.timeout || this.timeout,
    });
    
    if (this.getAccessToken) {
      newClient.setAuthTokenGetter(this.getAccessToken);
    }
    
    return newClient;
  }

  /**
   * Create an instance with a different default API version
   */
  withVersion(version: string): ApiClient {
    return this.clone({ defaultApiVersion: version });
  }

  /**
   * Create an instance with additional default headers
   */
  withHeaders(headers: Record<string, string>): ApiClient {
    return this.clone({ defaultHeaders: headers });
  }
}

// Default client instance (version-agnostic)
export const apiClient = new ApiClient();

// Convenience clients for different versions (but not required to use)
export const apiV1 = apiClient.withVersion('/v1/api');
export const apiV2 = apiClient.withVersion('/v2/api'); 
