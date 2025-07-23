import React, { useState, useEffect } from 'react';
import { User, Settings, Edit3, Save, X, Camera, Mail, MapPin, Calendar, Globe, Bell, Palette, Monitor, Moon, Sun, Trophy, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser, UserProfile, UserPreferences } from '../hooks/useUser';
import { PageLoadingSkeleton } from '../components/Skeletons';
import clsx from 'clsx';

const Profile: React.FC = () => {
  const { 
    profile, 
    preferences, 
    practiceStats,
    achievements,
    loading, 
    error, 
    isAuthenticated, 
    updateProfile, 
    updatePreferences,
    getStreakInfo
  } = useUser();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [preferencesForm, setPreferencesForm] = useState<Partial<UserPreferences>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize forms when data loads
  useEffect(() => {
    if (profile) {
      setProfileForm(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setPreferencesForm(preferences);
    }
  }, [preferences]);

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const toastId = toast.loading('Updating profile...');

    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully! ✨', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const toastId = toast.loading('Updating preferences...');

    try {
      await updatePreferences(preferencesForm);
      setIsEditingPreferences(false);
      toast.success('Preferences updated successfully! ⚙️', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setIsEditingPreferences(false);
    setProfileForm(profile || {});
    setPreferencesForm(preferences || {});
  };

  const streakInfo = getStreakInfo();

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      default: return Monitor;
    }
  };

  if (loading) {
    return <PageLoadingSkeleton type="profile" />;
  }

  return (
    <div className="fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" />
          Profile
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Profile */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={profileForm.name || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={profileForm.email || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileForm.location || ''}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language Preference
                      </label>
                      <select
                        value={profileForm.language_preference || 'en'}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, language_preference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="th">Thai</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio || ''}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      {profile?.picture ? (
                        <img
                          src={profile.picture}
                          alt={profile.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{profile?.name}</h3>
                      <p className="text-gray-600">{profile?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {profile?.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span>{profile?.language_preference?.toUpperCase() || 'EN'}</span>
                    </div>
                    {profile?.created_at && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {profile?.bio && (
                    <div className="pt-4">
                      <p className="text-gray-700">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
                {!isEditingPreferences ? (
                  <button
                    onClick={() => setIsEditingPreferences(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingPreferences ? (
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={preferencesForm.theme || 'system'}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'system' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={preferencesForm.difficulty_level || 'beginner'}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Notifications</label>
                        <p className="text-sm text-gray-500">Receive practice reminders and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferencesForm.notifications ?? true}
                          onChange={(e) => setPreferencesForm(prev => ({ ...prev, notifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto Play</label>
                        <p className="text-sm text-gray-500">Automatically play audio when available</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferencesForm.auto_play ?? false}
                          onChange={(e) => setPreferencesForm(prev => ({ ...prev, auto_play: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Practice Reminders</label>
                        <p className="text-sm text-gray-500">Get daily practice reminder notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferencesForm.practice_reminders ?? true}
                          onChange={(e) => setPreferencesForm(prev => ({ ...prev, practice_reminders: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Preferences
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      {React.createElement(getThemeIcon(preferences?.theme || 'system'), { className: "w-5 h-5 text-gray-500" })}
                      <div>
                        <p className="text-sm font-medium text-gray-700">Theme</p>
                        <p className="text-sm text-gray-600 capitalize">{preferences?.theme || 'System'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Difficulty</p>
                        <p className="text-sm text-gray-600 capitalize">{preferences?.difficulty_level || 'Beginner'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Notifications</span>
                      <span className={`text-sm ${preferences?.notifications ? 'text-green-600' : 'text-gray-500'}`}>
                        {preferences?.notifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Auto Play</span>
                      <span className={`text-sm ${preferences?.auto_play ? 'text-green-600' : 'text-gray-500'}`}>
                        {preferences?.auto_play ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Practice Reminders</span>
                      <span className={`text-sm ${preferences?.practice_reminders ? 'text-green-600' : 'text-gray-500'}`}>
                        {preferences?.practice_reminders ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Stats & Achievements */}
          <div className="space-y-6">
            {/* Practice Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="font-medium">{practiceStats?.total_sessions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Time</span>
                  <span className="font-medium">
                    {practiceStats ? formatMinutes(practiceStats.total_minutes) : '0 minutes'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Streak</span>
                  <span className="font-medium text-orange-600">{streakInfo.current} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Streak</span>
                  <span className="font-medium text-green-600">{streakInfo.best} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Phrases Practiced</span>
                  <span className="font-medium">{practiceStats?.phrases_practiced || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="font-medium">
                    {practiceStats?.average_score ? `${practiceStats.average_score.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Achievements
              </h3>
              
              {achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 5).map(achievement => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                  {achievements.length > 5 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      +{achievements.length - 5} more achievements
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No achievements yet. Keep practicing to earn your first achievement!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 