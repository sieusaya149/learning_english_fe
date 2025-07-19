import { useMemo } from 'react';
import { useAuth } from './useAuth0';
import { ApiClient, apiClient } from '../utils/ApiClient';

export const useApiClient = () => {
  const { getAccessToken, isAuthenticated } = useAuth();

  // Create main authenticated client (version-flexible)
  const authClient = useMemo(() => {
    const client = new ApiClient();
    if (getAccessToken) {
      client.setAuthTokenGetter(getAccessToken);
    }
    return client;
  }, [getAccessToken]);

  // Convenience clients for different default versions (but can still override per request)
  const authApiV1 = useMemo(() => {
    const client = new ApiClient({ defaultApiVersion: '/v1/api' });
    if (getAccessToken) {
      client.setAuthTokenGetter(getAccessToken);
    }
    return client;
  }, [getAccessToken]);

  const authApiV2 = useMemo(() => {
    const client = new ApiClient({ defaultApiVersion: '/v2/api' });
    if (getAccessToken) {
      client.setAuthTokenGetter(getAccessToken);
    }
    return client;
  }, [getAccessToken]);

  return {
    // Main flexible client (recommended for new code)
    client: authClient,
    
    // Public API client (no auth)
    publicClient: apiClient,

    // Convenience clients with default versions (but can override per request)
    authApiV1, // Defaults to v1, but can use: client.get('endpoint', { apiVersion: '/v2/api' })
    authApiV2, // Defaults to v2, but can use: client.get('endpoint', { apiVersion: '/v1/api' })
    
    // Legacy exports for backward compatibility
    apiV1: authApiV1,
    apiV2: authApiV2,
    authClient,

    // Auth status
    isAuthenticated,
  };
}; 