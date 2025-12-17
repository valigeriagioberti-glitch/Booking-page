import React, { useState } from 'react';
import { Lock, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { createCheckoutSession } from '../services/bookingService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
  totalPrice: number;
  language: Language;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingData,
  totalPrice,
  language
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const t = translations[language].paymentModal;

  if (!isOpen) return null;

  const handleProceedToStripe = async () => {
    setIsProcessing(true);
    try {
      const { url } = await createCheckoutSession({
        ...bookingData,
        language
      });
      // Redirect to Stripe
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Could not initialize Stripe Checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!isProcessing ? onClose : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Lock size={16} className="text-green-900" />
            Confirm Booking
          </h3>
          {!isProcessing && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck size={32} className="text-green-900" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proceed to Payment</h2>
          <p className="text-gray-500 mb-6">
            You will be redirected to Stripe's secure checkout page to complete your payment of <span className="font-bold text-gray-900">€{totalPrice.toFixed(2)}</span>.
          </p>

          <button 
            onClick={handleProceedToStripe}
            disabled={isProcessing}
            className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
              ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-900 hover:bg-green-800 hover:shadow-lg transform active:scale-[0.98]'}`}
          >
            {isProcessing ? (
              <span>Redirecting...</span>
            ) : (
              <>
                Pay €{totalPrice.toFixed(2)} <ExternalLink size={18} />
              </>
            )}
          </button>
          
          <div className="mt-6 flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 text-xs text-gray-400">
                <Lock size={12} />
                <span>SSL Encrypted Transaction</span>
             </div>
             <span className="text-xs text-gray-400 font-semibold italic">Powered by <span className="text-gray-600 not-italic font-bold">Stripe</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;