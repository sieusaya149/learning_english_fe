import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Repeat, BookOpen, Mic, ChevronRight, Star, Video, BookMarked, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth0';
import { useApiClient } from '../hooks/useApiClient';
import { createUserAPI } from '../utils/VideoApis';

const features = [
  {
    id: 'repeat',
    name: 'Repeat Practice',
    description: 'Watch videos and practice repeating what you hear to improve pronunciation and fluency.',
    icon: Repeat,
    color: 'bg-blue-100 text-blue-800',
    path: '/repeat',
  },
  {
    id: 'phrases',
    name: 'Phrase Practice',
    description: 'Practice common phrases organized by level and topic to build your vocabulary.',
    icon: BookOpen,
    color: 'bg-green-100 text-green-800',
    path: '/phrases',
  },
  {
    id: 'shadow',
    name: 'Shadowing Practice',
    description: 'Shadow along with native speakers to improve your rhythm, intonation, and speaking speed.',
    icon: Mic,
    color: 'bg-purple-100 text-purple-800',
    path: '/shadow',
  },
];

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { authApiV1 } = useApiClient();
  const [stats, setStats] = useState([
    { label: 'Videos Available', value: 'Loading...', icon: Video },
    { label: 'Practice Phrases', value: 500, icon: BookMarked },
    { label: 'Practice Minutes', value: 0, icon: Star },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data using the new ApiClient system
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !authApiV1) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user practice data using UserAPI
        const userAPI = createUserAPI(authApiV1);
        let practiceMinutes = 0;
        
        try {
          const practiceHistory = await userAPI.getPracticeHistory();
          // Calculate total practice minutes from history
          practiceMinutes = practiceHistory?.totalMinutes || 0;
        } catch (practiceError) {
          console.log('Practice stats not available:', practiceError);
          // This is okay - user might not have practice data yet
        }

        // Update stats with real data
        setStats([
          { label: 'Videos Available', value: 500, icon: Video },
          { label: 'Practice Phrases', value: 500, icon: BookMarked },
          { label: 'Practice Minutes', value: practiceMinutes, icon: Star },
        ]);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Keep default stats on error
        setStats([
          { label: 'Videos Available', value: 'Error', icon: Video },
          { label: 'Practice Phrases', value: 500, icon: BookMarked },
          { label: 'Practice Minutes', value: 0, icon: Star },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, authApiV1]);

  return (
    <div className="space-y-8 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Speak & Learn
          {user?.name && (
            <span className="block text-xl text-blue-600 mt-2">
              Hello, {user.name}! 👋
            </span>
          )}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Improve your English speaking skills through repeating, shadowing, and phrase practice.
          Start with any practice method below to begin your learning journey.
        </p>
      </div>

      {/* User Info Card (only shown when authenticated) */}
      {isAuthenticated && user && (
        <div className="card p-6 bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Your Profile</h3>
              <p className="text-gray-600">Email: {user.email}</p>
              {user.email_verified && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.id}
            to={feature.path}
            className="card hover:shadow-lg transform transition-all hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={clsx('p-3 rounded-lg', feature.color)}>
                  <feature.icon size={24} />
                </div>
                <ChevronRight className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h2>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Ready to improve your English?</h2>
            <p className="text-blue-100">
              Start with any practice mode that interests you the most.
            </p>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/repeat" 
              className="bg-white text-blue-800 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Start Practicing
            </Link>
          </div>
        </div>
      </div>

      {/* Add API Testing Tools for development (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Development: API Testing Tools</h3>
          <p className="text-gray-600 mb-4">These tools are only visible in development mode.</p>
          <div className="flex gap-4">
            <Link 
              to="/api-tester" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🚀 API Tester (Postman-like)
            </Link>
            <Link 
              to="/api-example" 
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📚 API Examples
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;