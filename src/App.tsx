import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingPage } from './pages/BookingPage';
import { SuccessPage } from './pages/SuccessPage';
import { CancelPage } from './pages/CancelPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/success/:sessionId" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
