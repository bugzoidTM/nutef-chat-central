import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages';
import NotFound from '@/pages/404';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from '@/components/dashboard/Dashboard';
import SatisfactionSurvey from '@/pages/SatisfactionSurvey';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/satisfaction-survey" element={<SatisfactionSurvey />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </div>
  );
}

export default App;
