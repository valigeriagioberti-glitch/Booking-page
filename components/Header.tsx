
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface HeaderProps {
  language: Language;
  onLanguageToggle: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ language, onLanguageToggle }) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <img 
              src="https://cdn.shopify.com/s/files/1/0753/8144/0861/files/cropped-Untitled-design-2025-09-11T094640.576_1.png?v=1765462614" 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-gray-900 block leading-none">{t.header.storage}</span>
            <span className="font-bold text-[10px] tracking-widest text-green-700 block mt-0.5 leading-none uppercase">{t.header.booking}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8">
          <a 
            href="https://luggagedepositrome.com/" 
            className="flex items-center space-x-2 text-sm font-bold text-gray-600 hover:text-green-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.header.returnHome}</span>
          </a>

          <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100">
            <button 
              onClick={() => onLanguageToggle('en')}
              className={`px-2 py-1 rounded text-lg transition-all ${language === 'en' ? 'bg-white shadow-sm scale-110' : 'opacity-40 grayscale hover:opacity-80'}`}
              title="English"
            >
              🇬🇧
            </button>
            <button 
              onClick={() => onLanguageToggle('it')}
              className={`px-2 py-1 rounded text-lg transition-all ${language === 'it' ? 'bg-white shadow-sm scale-110' : 'opacity-40 grayscale hover:opacity-80'}`}
              title="Italiano"
            >
              🇮🇹
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
