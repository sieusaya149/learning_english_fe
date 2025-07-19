import { useMemo } from 'react';
import { useAuth } from './useAuth0';
import { videoApi, createAuthenticatedVideoApi } from '../utils/VideoApis';

export const useVideoApi = () => {
  const { getAccessToken, isAuthenticated } = useAuth();

  // Create authenticated video API instance with Auth0 token
  const authVideoApi = useMemo(() => {
    if (!getAccessToken) return null;
    return createAuthenticatedVideoApi(getAccessToken);
  }, [getAccessToken]);

  return {
    // Public video API (no authentication)
    videoApi,
    
    // Authenticated video API (with Auth0 token)
    authVideoApi,
    
    // Auth status
    isAuthenticated,
  };
}; 