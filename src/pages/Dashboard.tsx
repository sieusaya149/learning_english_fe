import React from 'react';
import { Link } from 'react-router-dom';
import { Repeat, BookOpen, Mic, ChevronRight, Star, Video, BookMarked } from 'lucide-react';
import clsx from 'clsx';

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

const stats = [
  { label: 'Videos Available', value: 120, icon: Video },
  { label: 'Practice Phrases', value: 500, icon: BookMarked },
  { label: 'Practice Minutes', value: 0, icon: Star },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Speak & Learn</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Improve your English speaking skills through repeating, shadowing, and phrase practice.
          Start with any practice method below to begin your learning journey.
        </p>
      </div>
      
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
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
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
    </div>
  );
};

export default Dashboard;