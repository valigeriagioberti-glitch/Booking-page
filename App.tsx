
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingForm } from './components/BookingForm';
import { SuccessView } from './components/SuccessView';
import { VerifyView } from './components/VerifyView';
import { BookingResult, Language, ViewState } from './types';
import { TRANSLATIONS } from './translations';

const MainApp: React.FC = () => {
  console.log('[MainApp] Rendering...');
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('booking');
  const [verifyId, setVerifyId] = useState<string | null>(null);

  // Sync language with URL
  useEffect(() => {
    console.log('[MainApp] Syncing language with URL:', lang);
    const validLangs: Language[] = ['en', 'it', 'es'];
    if (lang && validLangs.includes(lang as Language)) {
      setLanguage(lang as Language);
      localStorage.setItem('ldr_language', lang);
    } else if (lang) {
      // Invalid language in URL, redirect to home
      navigate('/', { replace: true });
    } else {
      // If no lang in URL, check localStorage or default to 'en'
      const savedLang = localStorage.getItem('ldr_language') as Language;
      if (savedLang && validLangs.includes(savedLang)) {
        setLanguage(savedLang);
        // If we have a saved language that is not English, redirect to it
        if (savedLang !== 'en') {
          navigate(`/${savedLang}${location.search}${location.hash}`, { replace: true });
        }
      } else {
        setLanguage('en');
      }
    }
  }, [lang, navigate, location.search, location.hash]);

  // Handle URL changes and initial load
  useEffect(() => {
    console.log('[MainApp] Initial load/URL change handler');
    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      
      const sessionId = searchParams.get('session_id') || hashParams.get('session_id');
      const bid = searchParams.get('bid') || hashParams.get('bid');

      if (bid) {
        setVerifyId(bid);
        setCurrentView('verify');
        return;
      }

      if (sessionId) {
        verifyStripeSession(sessionId);
      } else {
        // Recover state from localStorage if not a redirect
        const savedBooking = localStorage.getItem('ldr_latest_booking');
        if (savedBooking && window.location.hash.includes('success')) {
          try {
            setBookingResult(JSON.parse(savedBooking));
            setCurrentView('success');
          } catch (e) {
            localStorage.removeItem('ldr_latest_booking');
          }
        } else if (!window.location.hash.includes('success')) {
          setCurrentView('booking');
        }
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    handleUrlChange();

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
    };
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
        setCurrentView('success');
        
        // Clean URL to success state
        navigate(`${location.pathname}#/success`, { replace: true });
      } else {
        setError('Payment was not completed. Please try again.');
        setCurrentView('booking');
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
    
    // Navigate to the new language path
    const newPath = lang === 'en' ? '/' : `/${lang}`;
    navigate(`${newPath}${location.search}${location.hash}`);
  }, [navigate, location.search, location.hash]);

  const handleBookingComplete = useCallback((result: BookingResult) => {
    setBookingResult(result);
    setCurrentView('success');
  }, []);

  const handleReset = useCallback(() => {
    setBookingResult(null);
    setVerifyId(null);
    localStorage.removeItem('ldr_latest_booking');
    setError(null);
    setCurrentView('booking');
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-green-900 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
        <p className="text-gray-500">Please wait while we confirm your booking with Stripe.</p>
      </div>
    );
  }

  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'English', label: 'EN' },
    { code: 'it', flag: '🇮🇹', name: 'Italiano', label: 'IT' },
    { code: 'es', flag: '🇪🇸', name: 'Español', label: 'ES' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
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

        {currentView === 'booking' && (
          <div className="animate-fade-in">
            <BookingForm onComplete={handleBookingComplete} language={language} />
          </div>
        )}

        {currentView === 'success' && bookingResult && (
          <SuccessView result={bookingResult} onReset={handleReset} language={language} />
        )}

        {currentView === 'verify' && verifyId && (
          <VerifyView bookingId={verifyId} language={language} />
        )}
      </main>

      <div className="print:hidden">
        <Footer language={language} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  console.log('[App] Rendering routes...');
  return (
    <Routes>
      <Route path="/:lang" element={<MainApp />} />
      <Route path="/" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
