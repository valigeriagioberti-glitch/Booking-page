import React from 'react';
import { Briefcase, Menu } from 'lucide-react';

const Header: React.FC = () => {
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
              <span className="font-medium text-green-900 text-sm uppercase tracking-widest">ROME</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-500 hover:text-green-900 font-medium transition-colors">Home</a>
            <a href="#" className="text-gray-500 hover:text-green-900 font-medium transition-colors">Prices</a>
            <a href="#" className="text-gray-500 hover:text-green-900 font-medium transition-colors">Locations</a>
            <a href="#" className="text-gray-500 hover:text-green-900 font-medium transition-colors">FAQ</a>
            <a href="#" className="text-green-900 font-semibold hover:text-green-700 transition-colors">Contact</a>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-500 hover:text-gray-900 focus:outline-none">
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;