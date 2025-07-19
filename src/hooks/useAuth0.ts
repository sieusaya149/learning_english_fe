import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    loginWithPopup,
    logout: auth0Logout,
    error,
    getAccessTokenSilently,
  } = useAuth0();

  // Function to get access token for API calls
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!isAuthenticated) {
        console.log('🚫 Not authenticated, returning null token');
        return null;
      }
      
      const token = await getAccessTokenSilently();
      console.log('🔑 Retrieved Auth0 token:', token ? '✅ Valid' : '❌ None');
      return token;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await loginWithPopup({
        authorizationParams: {
          screen_hint: 'login',
          login_hint: email,
        },
      });
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await loginWithPopup({
        authorizationParams: {
          screen_hint: 'signup',
          login_hint: email,
        },
      });
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await loginWithPopup({
        authorizationParams: {
          connection: 'google-oauth2',
        },
      });
      console.log("user", user)
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const signInWithFacebook = async () => {
    try {
      await loginWithPopup({
        authorizationParams: {
          connection: 'facebook',
        },
      });
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('🔓 Logging out and clearing Auth0 cache...');
      
      auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Error during logout:', error);
      return { error: error.message };
    }
  };

  return {
    user: isAuthenticated ? user : null,
    loading: isLoading,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    error,
    getAccessToken,
  };
};