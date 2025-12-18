
import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { CONTACT_EMAIL, LOCATION_ADDRESS } from '../constants';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = TRANSLATIONS[language];

  return (
    <footer className="bg-gray-950 text-white py-20 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex-shrink-0">
              <img 
                src="https://cdn.shopify.com/s/files/1/0753/8144/0861/files/cropped-Untitled-design-2025-09-11T094640.576_1.png?v=1765462614" 
                alt="Logo" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">Luggage Deposit</span>
              <span className="font-bold text-[10px] tracking-widest text-green-500 block mt-0.5 leading-none uppercase">Rome</span>
            </div>
          </div>
          <p className="text-gray-400 mb-6 leading-relaxed">
            {t.footer.description}
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6 text-green-500">{t.footer.information}</h4>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li><a href="https://luggagedepositrome.com/" className="hover:text-green-400 transition-colors">Home</a></li>
            <li><a href="https://maps.app.goo.gl/HxdE3NVp8KmcVcjt8" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">{t.footer.findUsMaps}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6 text-green-500">{t.footer.contact}</h4>
          <ul className="space-y-4 text-gray-300 text-sm">
            <li className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
              <span>{LOCATION_ADDRESS}</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="w-4 h-4 flex-shrink-0 text-green-500" />
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-green-400 transition-colors">{CONTACT_EMAIL}</a>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="w-4 h-4 flex-shrink-0 text-green-500" />
              <a href="tel:+39064467843" className="hover:text-green-400 transition-colors">+39 064467843</a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Luggage Deposit Rome &bull; {t.footer.secureSolutions}
      </div>
    </footer>
  );
};
