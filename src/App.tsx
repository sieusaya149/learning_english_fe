import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RepeatPractice from './pages/RepeatPractice';
import PhrasePractice from './pages/PhrasePractice';
import ShadowPractice from './pages/ShadowPractice';
import ApiTester from './components/ApiTester';

const App: React.FC = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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