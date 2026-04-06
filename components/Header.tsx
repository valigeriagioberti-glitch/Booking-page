
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface HeaderProps {
  language: Language;
  onLanguageToggle: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ language, onLanguageToggle }) => {
  const t = TRANSLATIONS[language];
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'English', label: 'EN' },
    { code: 'it', flag: '🇮🇹', name: 'Italiano', label: 'IT' },
    { code: 'es', flag: '🇪🇸', name: 'Español', label: 'ES' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

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
          {/* Language Switcher */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              title="Change Language"
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="text-[13px] font-semibold text-gray-700">{currentLang.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 p-1 min-w-[140px] z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageToggle(lang.code as Language);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        language === lang.code
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <span className={`text-[14px] ${language === lang.code ? 'font-semibold' : 'font-medium'}`}>
                          {lang.name}
                        </span>
                      </div>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-gray-900" strokeWidth={2.5} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a 
            href="https://luggagedepositrome.com/" 
            className="flex items-center space-x-2 text-sm font-bold text-gray-600 hover:text-green-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.header.returnHome}</span>
          </a>
        </div>
      </div>
    </header>
  );
};
