import React, { useState } from 'react';
import { CreditCard, Lock, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { processMockStripePayment } from '../services/bookingService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  totalPrice: number;
  customerEmail: string;
  language: Language;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  totalPrice,
  customerEmail,
  language
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    zip: ''
  });

  const t = translations[language].paymentModal;
  const tAlerts = translations[language].alerts;

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Simple formatter for Card Number (groups of 4)
    if (field === 'number') {
      const cleaned = value.replace(/\D/g, '').slice(0, 16);
      formattedValue = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    // Simple formatter for Expiry (MM/YY)
    if (field === 'expiry') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      if (cleaned.length >= 3) {
        formattedValue = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      } else {
        formattedValue = cleaned;
      }
    }

    if (field === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cardData.number.length < 16 || cardData.expiry.length < 4 || cardData.cvc.length < 3) {
      alert(tAlerts.fillPayment);
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processMockStripePayment(totalPrice);
      if (result.success) {
        onSuccess(result.id);
      } else {
        alert(tAlerts.paymentFailed);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert(tAlerts.paymentFailed);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Lock size={16} className="text-green-900" />
            {t.title}
          </h3>
          {!isProcessing && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500 mb-1">{customerEmail}</p>
            <h2 className="text-3xl font-extrabold text-gray-900">€{totalPrice.toFixed(2)}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                {t.cardInformation}
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-900 focus-within:border-transparent transition-all">
                <div className="relative border-b border-gray-200">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <CreditCard size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000"
                    value={cardData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 outline-none font-mono text-gray-700 placeholder-gray-300"
                  />
                  {/* Visual Brand Icons (Mock) */}
                  <div className="absolute right-3 top-3 flex gap-1 opacity-50">
                    <div className="w-8 h-5 bg-blue-600 rounded-sm"></div>
                    <div className="w-8 h-5 bg-orange-500 rounded-sm"></div>
                  </div>
                </div>
                <div className="flex divide-x divide-gray-200">
                  <input 
                    type="text" 
                    placeholder={t.expiry}
                    value={cardData.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                    className="w-1/2 px-4 py-3 outline-none font-mono text-gray-700 placeholder-gray-300 text-center"
                    maxLength={5}
                  />
                  <input 
                    type="text" 
                    placeholder={t.cvc}
                    value={cardData.cvc}
                    onChange={(e) => handleInputChange('cvc', e.target.value)}
                    className="w-1/2 px-4 py-3 outline-none font-mono text-gray-700 placeholder-gray-300 text-center"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                {t.zip}
              </label>
              <input 
                type="text" 
                placeholder="12345"
                value={cardData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 mt-4 rounded-lg font-bold text-white shadow-md transition-all
                ${isProcessing ? 'bg-green-800 cursor-not-allowed' : 'bg-green-900 hover:bg-green-800 hover:shadow-lg transform active:scale-[0.98]'}`}
            >
              {isProcessing ? t.processing : `${t.payButton} €${totalPrice.toFixed(2)}`}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock size={12} />
            <span>{t.secureEncrypted}</span>
          </div>
          
          <div className="mt-2 text-center">
             <span className="text-xs text-gray-400 font-semibold italic">{t.poweredBy} <span className="text-gray-600 not-italic font-bold">Stripe</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;