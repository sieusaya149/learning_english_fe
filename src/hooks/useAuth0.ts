import { useAuth0 } from '@auth0/auth0-react';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    loginWithPopup,
    logout: auth0Logout,
    error,
  } = useAuth0();

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
      auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    user: isAuthenticated ? user : null,
    loading: isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    error,
  };
};