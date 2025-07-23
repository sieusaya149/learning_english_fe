import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Mic } from 'lucide-react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RepeatPractice from './pages/RepeatPractice';
import PhrasePractice from './pages/PhrasePractice';
import ShadowPractice from './pages/ShadowPractice';
import AddPhrase from './pages/AddPhrase';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import ApiTester from './components/ApiTester';

const App: React.FC = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Speak & Learn</h1>
            <p className="text-gray-600">Initializing your learning experience...</p>
          </div>
          
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          
          <div className="mt-8 max-w-md">
            <div className="flex space-x-1">
              <div className="h-2 bg-blue-200 rounded-full flex-1 animate-pulse"></div>
              <div className="h-2 bg-blue-300 rounded-full flex-1 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-2 bg-blue-400 rounded-full flex-1 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 bg-blue-500 rounded-full flex-1 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="repeat" element={
          <ProtectedRoute>
            <RepeatPractice />
          </ProtectedRoute>
        } />
        <Route path="phrases" element={
          <ProtectedRoute>
            <PhrasePractice />
          </ProtectedRoute>
        } />
        <Route path="add-phrase" element={
          <ProtectedRoute>
            <AddPhrase />
          </ProtectedRoute>
        } />
        <Route path="calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="shadow" element={
          <ProtectedRoute>
            <ShadowPractice />
          </ProtectedRoute>
        } />
        <Route path="api-tester" element={
          <ProtectedRoute>
            <ApiTester />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

export default App;