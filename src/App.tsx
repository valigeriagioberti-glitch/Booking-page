import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import { Language } from './types';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white pb-24 print:bg-white print:pb-0">
        <div className="print:hidden">
          <Header language={language} setLanguage={setLanguage} />
        </div>
        
        <Routes>
          <Route path="/" element={<Home language={language} />} />
          <Route path="/success" element={<Success language={language} />} />
          <Route path="/cancel" element={<Cancel language={language} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;