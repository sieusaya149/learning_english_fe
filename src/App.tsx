import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RepeatPractice from './pages/RepeatPractice';
import PhrasePractice from './pages/PhrasePractice';
import ShadowPractice from './pages/ShadowPractice';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="repeat" element={<RepeatPractice />} />
        <Route path="phrases" element={<PhrasePractice />} />
        <Route path="shadow" element={<ShadowPractice />} />
      </Route>
    </Routes>
  );
};

export default App;