import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import { Language } from './types';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <HashRouter>
      <div className="min-h-screen bg-white pb-24 print:bg-white print:pb-0">
        <div className="print:hidden">
          <Header language={language} setLanguage={setLanguage} />
        </div>
        
        <Routes>
          <Route path="/" element={<Home language={language} />} />
<<<<<<< HEAD
=======
          {/* CRITICAL: Route expects sessionId as a path parameter now */}
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
          <Route path="/success/:sessionId" element={<Success language={language} />} />
          <Route path="/cancel" element={<Cancel language={language} />} />
          <Route path="*" element={<Home language={language} />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;