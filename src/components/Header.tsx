import React from 'react';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
  const t = translations[language].header;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-green-900 text-white p-2 rounded-lg mr-2">
              <Briefcase size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-lg leading-tight tracking-tight">LUGGAGE DEPOSIT</span>
              <span className="font-medium text-green-900 text-sm uppercase tracking-widest">{t.subtitle}</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            {/* Return to Home Link */}
            <a 
              href="https://luggagedepositrome.com/" 
              className="flex items-center gap-2 text-gray-500 hover:text-green-900 font-medium transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">{t.returnHome}</span>
            </a>

            {/* Language Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${language === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                 title="English"
               >
                 <span className="text-lg leading-none">🇬🇧</span>
               </button>
               <button 
                 onClick={() => setLanguage('it')}
                 className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${language === 'it' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Italiano"
               >
                 <span className="text-lg leading-none">🇮🇹</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;