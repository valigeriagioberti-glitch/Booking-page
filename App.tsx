
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingForm } from './components/BookingForm';
import { SuccessView } from './components/SuccessView';
import { BookingResult, Language } from './types';
import { TRANSLATIONS } from './translations';

const App: React.FC = () => {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Robust session_id detection for both standard and hash-routing URLs
  useEffect(() => {
    const getSessionId = () => {
      // 1. Check standard search params
      const searchParams = new URLSearchParams(window.location.search);
      let sid = searchParams.get('session_id');
      
      // 2. Check hash for params (e.g., /#/success?session_id=...)
      if (!sid && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        sid = hashParams.get('session_id');
      }
      return sid;
    };

    const sessionId = getSessionId();

    if (sessionId) {
      verifyStripeSession(sessionId);
    } else {
      // Recover state from localStorage if not a redirect
      const savedBooking = localStorage.getItem('ldr_latest_booking');
      if (savedBooking) {
        try {
          setBookingResult(JSON.parse(savedBooking));
        } catch (e) {
          localStorage.removeItem('ldr_latest_booking');
        }
      }
    }
    
    const savedLang = localStorage.getItem('ldr_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'it')) {
      setLanguage(savedLang);
    }
  }, []);

  const verifyStripeSession = async (sessionId: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
      if (!response.ok) throw new Error('Payment verification failed');
      
      const data = await response.json();
      if (data.status === 'paid') {
        const result: BookingResult = data.booking;
        setBookingResult(result);
        localStorage.setItem('ldr_latest_booking', JSON.stringify(result));
        
        // Clean URL while keeping hash structure if present
        const cleanPath = window.location.pathname + (window.location.hash.split('?')[0] || '');
        window.history.replaceState({}, document.title, cleanPath);
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred while verifying your payment.');
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ldr_language', lang);
  }, []);

  const handleBookingComplete = useCallback((result: BookingResult) => {
    setBookingResult(result);
  }, []);

  const handleReset = useCallback(() => {
    setBookingResult(null);
    localStorage.removeItem('ldr_latest_booking');
    setError(null);
    // Reset URL to base
    window.history.replaceState({}, document.title, window.location.pathname + '#/');
  }, []);

  const t = TRANSLATIONS[language];

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-green-900 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
        <p className="text-gray-500">Please wait while we confirm your booking with Stripe.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="print:hidden">
        <Header language={language} onLanguageToggle={toggleLanguage} />
      </div>
      
      <main className="flex-grow pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center font-bold">
            {error}
            <button onClick={handleReset} className="ml-4 underline">Try again</button>
          </div>
        )}

        {!bookingResult ? (
          <div className="animate-fade-in">
            <BookingForm onComplete={handleBookingComplete} language={language} />
          </div>
        ) : (
          <SuccessView result={bookingResult} onReset={handleReset} language={language} />
        )}
      </main>

      <div className="print:hidden">
        <Footer language={language} />
      </div>
    </div>
  );
};

export default App;
