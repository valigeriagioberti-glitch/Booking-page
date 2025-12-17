import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface CancelProps {
  language: Language;
}

const Cancel: React.FC<CancelProps> = ({ language }) => {
  const navigate = useNavigate();

  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
      <p className="text-gray-600 mb-8">No charges were made. You can try booking again when you are ready.</p>
      <button 
        onClick={() => navigate('/')}
        className="inline-flex items-center justify-center gap-2 bg-green-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors"
      >
        <ArrowLeft size={20} /> Return to Booking
      </button>
    </main>
  );
};

export default Cancel;