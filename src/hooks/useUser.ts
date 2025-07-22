import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth0';
import { useApiClient } from './useApiClient';
import { createUserAPI, createPracticeAPI } from '../utils/VideoApis';

// Extended types for user data
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  bio?: string;
  location?: string;
  language_preference: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  auto_play: boolean;
  practice_reminders: boolean;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface PracticeStats {
  total_sessions: number;
  total_minutes: number;
  streak_days: number;
  best_streak: number;
  phrases_practiced: number;
  videos_completed: number;
  average_score: number;
  last_practice_date: string;
}

export interface DayProgress {
  date: string;
  sessions: number;
  minutes: number;
  phrases_count: number;
  videos_count: number;
  score_average: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  category: 'practice' | 'streak' | 'score' | 'milestone';
}

export const useUser = () => {
  const { getAccessToken, isAuthenticated, user: auth0User } = useAuth();
  const { authApiV2 } = useApiClient();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<DayProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API instances
  const userAPI = useMemo(() => {
    if (authApiV2) {
      return createUserAPI(authApiV2);
    }
    return null;
  }, [authApiV2]);

  const practiceAPI = useMemo(() => {
    if (authApiV2) {
      return createPracticeAPI(authApiV2);
    }
    return null;
  }, [authApiV2]);

  // Fetch user profile
  const fetchProfile = async () => {
    if (!userAPI) return;

    try {
      const profileData = await userAPI.getProfile();
      setProfile(profileData);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      // If profile doesn't exist, create one from Auth0 data
      if (err.status === 404 && auth0User) {
        const defaultProfile: Partial<UserProfile> = {
          email: auth0User.email!,
          name: auth0User.name || auth0User.email!,
          picture: auth0User.picture,
          language_preference: 'en'
        };
        setProfile(defaultProfile as UserProfile);
      }
    }
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!userAPI) return;

    try {
      const prefsData = await userAPI.getPreferences();
      setPreferences(prefsData);
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      // Set default preferences
      setPreferences({
        theme: 'system',
        language: 'en',
        notifications: true,
        auto_play: false,
        practice_reminders: true,
        difficulty_level: 'beginner'
      });
    }
  };

  // Fetch practice statistics
  const fetchPracticeStats = async () => {
    if (!practiceAPI) return;

    try {
      const stats = await practiceAPI.getProgress();
      setPracticeStats(stats);
    } catch (err: any) {
      console.error('Error fetching practice stats:', err);
      // Set default stats
      setPracticeStats({
        total_sessions: 0,
        total_minutes: 0,
        streak_days: 0,
        best_streak: 0,
        phrases_practiced: 0,
        videos_completed: 0,
        average_score: 0,
        last_practice_date: ''
      });
    }
  };

  // Fetch practice history
  const fetchPracticeHistory = async () => {
    if (!userAPI) return;

    try {
      const history = await userAPI.getPracticeHistory();
      // Transform API data to DayProgress format
      const dailyProgress = history.daily_progress || [];
      setPracticeHistory(dailyProgress);
    } catch (err: any) {
      console.error('Error fetching practice history:', err);
      setPracticeHistory([]);
    }
  };

  // Fetch achievements
  const fetchAchievements = async () => {
    if (!userAPI) return;

    try {
      const achievementsData = await userAPI.getAchievements();
      setAchievements(achievementsData.achievements || []);
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
      setAchievements([]);
    }
  };

  // Update profile
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!userAPI) throw new Error('Authentication required');

    try {
      const updatedProfile = await userAPI.updateProfile(profileData);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Update preferences
  const updatePreferences = async (prefsData: Partial<UserPreferences>) => {
    if (!userAPI) throw new Error('Authentication required');

    try {
      const updatedPrefs = await userAPI.updatePreferences(prefsData);
      setPreferences(updatedPrefs);
      return updatedPrefs;
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  // Get practice data for calendar visualization
  const getCalendarData = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const calendarData: { [date: string]: DayProgress } = {};
    
    // Initialize all days in month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarData[dateStr] = {
        date: dateStr,
        sessions: 0,
        minutes: 0,
        phrases_count: 0,
        videos_count: 0,
        score_average: 0
      };
    }
    
    // Fill with actual practice data
    practiceHistory.forEach(dayData => {
      if (calendarData[dayData.date]) {
        calendarData[dayData.date] = dayData;
      }
    });
    
    return calendarData;
  };

  // Get streak information
  const getStreakInfo = () => {
    if (!practiceHistory.length) return { current: 0, best: 0 };
    
    const sortedHistory = [...practiceHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate current streak
    for (let i = 0; i < sortedHistory.length; i++) {
      const practiceDate = new Date(sortedHistory[i].date);
      practiceDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (practiceDate.getTime() === expectedDate.getTime() && sortedHistory[i].sessions > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate best streak
    let consecutiveDays = 0;
    for (const dayData of sortedHistory) {
      if (dayData.sessions > 0) {
        consecutiveDays++;
        bestStreak = Math.max(bestStreak, consecutiveDays);
      } else {
        consecutiveDays = 0;
      }
    }
    
    return { current: currentStreak, best: bestStreak };
  };

  // Load all user data
  const loadUserData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchProfile(),
        fetchPreferences(),
        fetchPracticeStats(),
        fetchPracticeHistory(),
        fetchAchievements()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && userAPI && practiceAPI) {
      loadUserData();
    }
  }, [isAuthenticated, userAPI, practiceAPI]);

  return {
    // Data
    profile,
    preferences,
    practiceStats,
    practiceHistory,
    achievements,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    updateProfile,
    updatePreferences,
    loadUserData,
    
    // Utilities
    getCalendarData,
    getStreakInfo,
    
    // API instances (for advanced usage)
    userAPI,
    practiceAPI
  };
}; 