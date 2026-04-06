
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingForm } from './components/BookingForm';
import { SuccessView } from './components/SuccessView';
import { VerifyView } from './components/VerifyView';
import { BookingResult, Language, ViewState } from './types';
import { TRANSLATIONS } from './translations';

const App: React.FC = () => {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('booking');
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Handle URL changes and initial load
  useEffect(() => {
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

    const savedLang = localStorage.getItem('ldr_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'it' || savedLang === 'es')) {
      setLanguage(savedLang);
    }

    // Click outside handler for language menu
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      document.removeEventListener('mousedown', handleClickOutside);
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
        window.history.replaceState({}, document.title, window.location.pathname + '#/success');
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
    setIsLangMenuOpen(false);
  }, []);

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
    window.history.replaceState({}, document.title, window.location.pathname + '#/');
  }, []);

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

      {/* Sticky Language Switcher - SaaS Redesign */}
      <div className="fixed bottom-6 right-6 z-[60] print:hidden" ref={langMenuRef}>
        <div className="relative">
          <AnimatePresence>
            {isLangMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-1.5 min-w-[160px] overflow-hidden"
              >
                {languages.map((lang) => (
                  <button 
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code as Language)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors group ${
                      language === lang.code 
                        ? 'bg-[#f5f5f5] text-gray-900 font-semibold' 
                        : 'text-gray-600 hover:bg-[#f5f5f5] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <span className="text-[13px]">{lang.name}</span>
                    </div>
                    {language === lang.code && (
                      <Check className="w-3.5 h-3.5 text-gray-900" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all active:scale-95 group"
            title="Change Language"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-lg leading-none">{currentLang.flag}</span>
              <span className="text-[13px] font-bold text-gray-700 tracking-tight">{currentLang.label}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <Footer language={language} />
      </div>
    </div>
  );
};

export default App;
