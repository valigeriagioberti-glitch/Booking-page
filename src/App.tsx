import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Success from './pages/Success';
import Cancel from './pages/Cancel';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/success/:sessionId" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}